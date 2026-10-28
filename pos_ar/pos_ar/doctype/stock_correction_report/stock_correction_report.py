# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt

from collections import defaultdict

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate


class StockCorrectionReport(Document):
    def before_validate(self):
        # Browser amendments can copy read-only links even when no_copy is enabled.
        if self.docstatus == 0:
            self.material_issue_ref = None
            self.material_receipt_ref = None

    def validate(self):
        reason = frappe.db.get_value(
            "Stock Incident Reason", self.incident_reason, ["applies_to", "is_active"], as_dict=True
        ) if self.incident_reason else None
        if not reason or not cint(reason.is_active) or reason.applies_to != "Stock Correction":
            frappe.throw(_("Select an active reason applicable to Stock Correction."))

    def before_submit(self):
        outgoing = self.get_quantities_by_uom("wrong_items")
        incoming = self.get_quantities_by_uom("true_items")
        if set(outgoing) != set(incoming) or any(
            flt(outgoing[uom] - incoming[uom], 6) for uom in outgoing
        ):
            frappe.throw(_("Outgoing and incoming quantities must match for each stock UOM."))

    def get_quantities_by_uom(self, fieldname):
        rows = self.get(fieldname) or []
        if not rows:
            frappe.throw(_("Enter both the items to issue and the items to receive."))
        quantities = defaultdict(float)
        seen = set()
        for row in rows:
            if not row.item_code or flt(row.qty) <= 0:
                frappe.throw(_("Each correction row must have an item and a positive quantity."))
            if row.item_code in seen:
                frappe.throw(_("Item {0} appears more than once.").format(row.item_code))
            seen.add(row.item_code)
            stock_uom = frappe.get_cached_value("Item", row.item_code, "stock_uom")
            if not stock_uom:
                frappe.throw(_("Stock UOM is missing for item {0}.").format(row.item_code))
            quantities[stock_uom] += flt(row.qty)
        return quantities

    def on_submit(self):
        issue = self.make_stock_entry("Material Issue")
        values = defaultdict(float)
        for row in issue.items:
            values[row.stock_uom] += flt(row.amount)
        self.make_stock_entry("Material Receipt", values)

    def make_stock_entry(self, purpose, outgoing_values=None):
        is_issue = purpose == "Material Issue"
        entry = frappe.new_doc("Stock Entry")
        entry.stock_entry_type = purpose
        entry.company = self.company
        entry.posting_date = self.date
        entry.from_warehouse = self.warehouse if is_issue else None
        entry.to_warehouse = None if is_issue else self.warehouse
        entry.custom_is_stock_incident = 1
        entry.custom_incident_reason = self.incident_reason
        entry.custom_incident_notes = self.incident_notes
        entry.custom_stock_correction_report = self.name
        entry.remarks = _("Stock correction {0}: {1}").format(self.name, self.incident_reason)
        if self.incident_notes:
            entry.remarks += "\n" + self.incident_notes

        rows = self.wrong_items if is_issue else self.true_items
        if not is_issue:
            remaining_qty = self.get_quantities_by_uom("true_items")
            remaining_value = dict(outgoing_values)
        for row in rows:
            detail = entry.append("items", {
                "item_code": row.item_code,
                "qty": row.qty,
                "s_warehouse": self.warehouse if is_issue else None,
                "t_warehouse": None if is_issue else self.warehouse,
                "description": entry.remarks,
            })
            if not is_issue:
                uom = frappe.get_cached_value("Item", row.item_code, "stock_uom")
                qty = flt(row.qty)
                # Allocate the issued value, including rounding on the last row of each UOM.
                amount = remaining_value[uom]
                if flt(remaining_qty[uom] - qty, 6):
                    amount = flt(amount * qty / remaining_qty[uom], detail.precision("basic_amount"))
                detail.basic_rate = amount / qty
                detail.basic_amount = amount
                detail.set_basic_rate_manually = 1
                detail.allow_zero_valuation_rate = int(not amount)
                remaining_qty[uom] -= qty
                remaining_value[uom] -= amount

        # Reserve the reverse link before validation so only these generated entries
        # can use the correction reason. The request transaction rolls back on failure.
        entry.set_new_name()
        self.db_set("material_issue_ref" if is_issue else "material_receipt_ref", entry.name)
        entry.insert()
        entry.submit()
        return entry

    def on_cancel(self):
        # Remove the received stock before restoring the incorrectly identified stock.
        for reference in (self.material_receipt_ref, self.material_issue_ref):
            if reference:
                entry = frappe.get_doc("Stock Entry", reference)
                if entry.docstatus == 1:
                    entry.cancel()
                    frappe.msgprint(_("Linked stock entry {0} has been cancelled.").format(reference))


def validate_correction_stock_entry(entry):
    """Only the movements generated by a submitted correction may use its reason."""
    reference = entry.get("custom_stock_correction_report")
    if not reference:
        frappe.throw(_("Stock Correction reasons must be used through Stock Correction Report."))
    correction = frappe.get_doc("Stock Correction Report", reference)
    purpose = entry.get("purpose") or entry.get("stock_entry_type")
    fields = {
        "Material Issue": ("material_issue_ref", "wrong_items", "s_warehouse", "t_warehouse"),
        "Material Receipt": ("material_receipt_ref", "true_items", "t_warehouse", "s_warehouse"),
    }
    if purpose not in fields:
        frappe.throw(_("A stock correction must generate a Material Issue or Material Receipt."))
    ref_field, items_field, warehouse_field, other_warehouse = fields[purpose]
    if (
        correction.docstatus != 1
        or correction.get(ref_field) != entry.name
        or not cint(entry.get("custom_is_stock_incident"))
        or entry.get("custom_incident_reason") != correction.incident_reason
        or entry.company != correction.company
        or getdate(entry.posting_date) != getdate(correction.date)
    ):
        frappe.throw(_("This stock entry does not match its Stock Correction Report."))

    expected = {row.item_code: flt(row.qty) for row in correction.get(items_field)}
    actual = {}
    for row in entry.get("items") or []:
        if (
            row.item_code in actual
            or row.get(warehouse_field) != correction.warehouse
            or row.get(other_warehouse)
            or flt(row.conversion_factor) != 1
        ):
            frappe.throw(_("Stock correction items and warehouse must match the original correction."))
        actual[row.item_code] = flt(row.qty)
    if expected != actual:
        frappe.throw(_("Stock correction items and quantities must match the original correction."))
