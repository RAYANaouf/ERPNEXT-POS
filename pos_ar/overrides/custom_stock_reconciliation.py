import frappe
from frappe.utils import cint, flt
from erpnext.stock.doctype.stock_reconciliation.stock_reconciliation import StockReconciliation


class CustomStockReconciliation(StockReconciliation):

    def remove_items_with_no_change(self):
        from erpnext.stock.stock_ledger import get_stock_value_difference
        from erpnext.stock.utils import get_stock_balance

        self.difference_amount = 0.0

        def _process(item):
            if item.current_serial_and_batch_bundle:
                bundle_data = frappe.get_all(
                    "Serial and Batch Bundle",
                    filters={"name": item.current_serial_and_batch_bundle},
                    fields=["total_qty as qty", "avg_rate as rate"],
                )[0]
                bundle_data.qty = abs(bundle_data.qty)
                self.calculate_difference_amount(item, bundle_data)
                return

            result = get_stock_balance(
                item.item_code,
                item.warehouse,
                self.posting_date,
                self.posting_time,
                with_valuation_rate=True,
            )

            current_qty = flt(result[0]) if isinstance(result, tuple) else flt(result)
            current_rate = flt(result[1]) if isinstance(result, tuple) and len(result) > 1 else 0.0

            item_dict = {"qty": current_qty, "rate": current_rate}

            if (
                not item_dict.get("qty")
                and not item.qty
                and not item.valuation_rate
                and not item.current_qty
            ):
                difference_amount = get_stock_value_difference(
                    item.item_code, item.warehouse, self.posting_date, self.posting_time, self.name
                )
                if abs(difference_amount) > 0:
                    self.difference_amount += difference_amount
                return

            if item.qty is None:
                item.qty = item_dict.get("qty")

            if item.valuation_rate is None:
                item.valuation_rate = item_dict.get("rate")

            item.current_qty = item_dict.get("qty")
            item.current_valuation_rate = item_dict.get("rate")

            self.calculate_difference_amount(item, item_dict)

        for item in self.items:
            _process(item)

    def validate(self):
        try:
            super().validate()
        except frappe.ValidationError as e:
            if "None of the items have any change" in str(e):
                if frappe.message_log:
                    frappe.message_log.pop()
            else:
                raise

    def get_parent_document_name(self):
        return frappe.db.get_value(
            "Stock Reconciliation",
            {"custom_zero_out_document": self.name},
            "name",
        )

    def on_submit(self):
        try:
            super().on_submit()
        except frappe.ValidationError as e:
            if "No stock ledger entries were created" in str(e):
                if frappe.message_log:
                    frappe.message_log.pop()
            else:
                raise

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
            f"This zero-out document is managed automatically and cannot be cancelled directly.<br>"
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
                    frappe.flags.pop("allow_child_reconciliation_cancel", None)

        super().on_cancel()

    def _zero_out_unlisted_items(self):
        default_warehouse = self.get("set_warehouse")

        if not default_warehouse:
            frappe.throw(
                "Please select a Default Warehouse before submitting.",
                title="Missing Warehouse",
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
                        PARTITION BY item_code, warehouse
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