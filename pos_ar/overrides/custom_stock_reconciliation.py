import frappe
from frappe.utils import cint, flt, rounded
from erpnext.stock.doctype.stock_reconciliation.stock_reconciliation import StockReconciliation

try:
    from erpnext.stock.doctype.stock_reconciliation.stock_reconciliation import (
        EmptyStockReconciliationItemsError,
    )
except ImportError:
    EmptyStockReconciliationItemsError = None

FLOAT_PRECISION = 9


class CustomStockReconciliation(StockReconciliation):
    def validate(self):
        original_items = [d.as_dict() for d in self.items]
        exceptions = [frappe.exceptions.ValidationError]
        
        if EmptyStockReconciliationItemsError:
            exceptions.append(EmptyStockReconciliationItemsError)

        try:
            super().validate()
        except tuple(exceptions) as e:
            error_msg = str(e)
            is_no_change_error = (
                "None of the items have any change" in error_msg
                or "EmptyStockReconciliationItemsError" in error_msg
                or (EmptyStockReconciliationItemsError and isinstance(e, EmptyStockReconciliationItemsError))
            )
            
            if is_no_change_error:
                self.items = []
                for item_dict in original_items:
                    self.append("items", item_dict)
            else:
                raise

        if not self.items and original_items:
            self.items = []
            for item_dict in original_items:
                self.append("items", item_dict)

    def remove_items_with_no_change(self):
        pass

    def update_stock_ledger(self):
        if not self.items:
            return
            
        sle_map = self._fetch_sle_map()
        has_change = any(not self._item_has_no_change(row, sle_map) for row in self.items)
        
        if has_change:
            super().update_stock_ledger()

    def _fetch_sle_map(self):
        if not self.items:
            return {}

        values = {
            "posting_date": self.posting_date,
            "posting_time": self.posting_time,
        }

        pair_conditions = []
        for i, row in enumerate(self.items):
            pair_conditions.append(f"(item_code = %(item_{i})s AND warehouse = %(wh_{i})s)")
            values[f"item_{i}"] = row.item_code
            values[f"wh_{i}"] = row.warehouse

        where_clause = " OR ".join(pair_conditions)

        query = f"""
            SELECT item_code, warehouse, qty_after_transaction, valuation_rate
            FROM (
                SELECT 
                    item_code, 
                    warehouse, 
                    qty_after_transaction, 
                    valuation_rate,
                    ROW_NUMBER() OVER(
                        PARTITION BY item_code, warehouse 
                        ORDER BY posting_date DESC, posting_time DESC, creation DESC
                    ) as rn
                FROM `tabStock Ledger Entry`
                WHERE is_cancelled = 0
                  AND (
                      posting_date < %(posting_date)s 
                      OR (posting_date = %(posting_date)s AND posting_time <= %(posting_time)s)
                  )
                  AND ({where_clause})
            ) AS latest_sle
            WHERE rn = 1
        """

        rows = frappe.db.sql(query, values, as_dict=True)

        return {
            (r.item_code, r.warehouse): {
                "qty": flt(r.qty_after_transaction),
                "rate": flt(r.valuation_rate),
            }
            for r in rows
        }

    def _item_has_no_change(self, row, sle_map):
        entry = sle_map.get((row.item_code, row.warehouse))
        
        if not entry:
            return flt(row.qty) == 0.0 and (flt(row.valuation_rate) == 0.0 or not row.valuation_rate)

        qty_unchanged = rounded(flt(row.qty), FLOAT_PRECISION) == rounded(entry["qty"], FLOAT_PRECISION)
        rate_unchanged = (
            rounded(flt(row.valuation_rate), FLOAT_PRECISION) == rounded(entry["rate"], FLOAT_PRECISION)
            or not row.valuation_rate
        )
        
        return qty_unchanged and rate_unchanged

    def get_parent_document_name(self):
        return frappe.db.get_value(
            "Stock Reconciliation",
            {"custom_zero_out_document": self.name},
            "name",
        )

    def before_submit(self):
        pass

    def on_submit(self):
        if self.flags.get("is_zero_out_child_process") or self.get_parent_document_name():
            return

        if cint(self.get("custom_zero_out_unlisted_items")):
            frappe.clear_document_cache(self.doctype, self.name)
            self._zero_out_unlisted_items()

    def before_cancel(self):
        if cint(frappe.db.get_value("Stock Reconciliation", self.name, "docstatus")) == 2:
            return

        parent_name = self.get_parent_document_name()
        if not parent_name:
            return

        if frappe.flags.get("allow_child_reconciliation_cancel") == self.name:
            return

        if cint(frappe.db.get_value("Stock Reconciliation", parent_name, "docstatus")) == 2:
            return

        frappe.throw(
            f"<b>Action Blocked</b><br><br>"
            f"This zero-out document is managed automatically. You cannot cancel it directly.<br>"
            f"Please navigate to the parent document "
            f"<a href='/app/stock-reconciliation/{parent_name}'><b>{parent_name}</b></a> "
            f"and cancel it there to trigger the cascade cancellation.",
            title="Unauthorized Cancellation",
        )

    def on_cancel(self):
        linked_doc_name = self.get("custom_zero_out_document")
        
        if linked_doc_name:
            if cint(frappe.db.get_value("Stock Reconciliation", linked_doc_name, "docstatus")) == 1:
                linked_doc = frappe.get_doc("Stock Reconciliation", linked_doc_name)
                try:
                    frappe.flags.allow_child_reconciliation_cancel = linked_doc.name
                    linked_doc.cancel()
                    frappe.msgprint(
                        msg=f"Linked zero-out document <b>{linked_doc_name}</b> was automatically cancelled.",
                        title="Cascade Cancellation Complete",
                        indicator="orange",
                    )
                except Exception as e:
                    frappe.throw(f"Failed to cancel linked document <b>{linked_doc_name}</b>: {e}")
                finally:
                    if hasattr(frappe.flags, "allow_child_reconciliation_cancel"):
                        del frappe.flags.allow_child_reconciliation_cancel

        super().on_cancel()

    def _zero_out_unlisted_items(self):
        default_warehouse = self.get("set_warehouse")
        
        if not default_warehouse:
            frappe.throw(
                "Please select a Default Warehouse before submitting.", 
                title="Missing Warehouse"
            )

        existing_doc = frappe.db.get_value("Stock Reconciliation", self.name, "custom_zero_out_document")
        if existing_doc:
            frappe.throw(
                f"A zero-out document already exists for this entry: <b>{existing_doc}</b>.<br>"
                "Please cancel it before resubmitting.",
                title="Existing Zero-Out Document",
            )

        reconciled_items = {r.item_code for r in self.items if r.warehouse == default_warehouse}

        query = """
            SELECT item_code, warehouse, valuation_rate
            FROM (
                SELECT 
                    item_code, 
                    warehouse, 
                    qty_after_transaction, 
                    valuation_rate,
                    ROW_NUMBER() OVER(
                        PARTITION BY item_code 
                        ORDER BY posting_date DESC, posting_time DESC, creation DESC
                    ) as rn
                FROM `tabStock Ledger Entry`
                WHERE warehouse = %(warehouse)s
                  AND is_cancelled = 0
                  AND (
                      posting_date < %(posting_date)s 
                      OR (posting_date = %(posting_date)s AND posting_time <= %(posting_time)s)
                  )
            ) AS latest_sle
            WHERE rn = 1 AND qty_after_transaction != 0
        """

        values = {
            "warehouse": default_warehouse,
            "posting_date": self.posting_date,
            "posting_time": self.posting_time,
        }

        sle_data = frappe.db.sql(query, values, as_dict=True)
        items_to_zero = [row for row in sle_data if row.item_code not in reconciled_items]
        
        if not items_to_zero:
            return

        new_sr = frappe.new_doc("Stock Reconciliation")
        new_sr.update({
            "purpose": "Stock Reconciliation",
            "company": self.company,
            "posting_date": self.posting_date,
            "posting_time": self.posting_time,
            "set_warehouse": default_warehouse,
            "set_posting_time": 1,
            "custom_zero_out_unlisted_items": 0,
        })

        for row in items_to_zero:
            new_sr.append("items", {
                "item_code": row.item_code,
                "warehouse": row.warehouse,
                "qty": 0,
                "valuation_rate": flt(row.valuation_rate),
            })

        new_sr.flags.is_zero_out_child_process = True

        try:
            new_sr.insert(ignore_permissions=True)
            new_sr.submit()
        except Exception as e:
            frappe.throw(f"Automatic zero-out processing failed: {e}", title="Zero-Out Error")

        self.db_set("custom_zero_out_document", new_sr.name)

        frappe.msgprint(
            msg=f"Zero-out document automatically submitted: <b>{new_sr.name}</b>",
            title="Submitted",
            indicator="green",
        )