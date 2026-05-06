# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class StockCorrectionReport(Document):
    def on_submit(self):
        """
        Triggers on Submit: Creates Material Issue for wrong items 
        and Material Receipt for true items.
        """
        # 1. Handle Wrong Items (Material Issue)
        if self.wrong_items:
            issue = frappe.new_doc("Stock Entry")
            issue.stock_entry_type = "Material Issue"
            issue.company = self.company
            issue.posting_date = self.date
            issue.set_warehouse = self.warehouse
            
            for item in self.wrong_items:
                issue.append("items", {
                    "item_code": item.item_code,
                    "qty": item.qty,
                    "s_warehouse": self.warehouse,
                    "company": self.company,
                    "description": f"System error correction via {self.name}"
                })
            
            issue.insert()
            issue.submit()
            # Save the reference link back to this document
            self.db_set("material_issue_ref", issue.name)

        # 2. Handle True Items (Material Receipt)
        if self.true_items:
            receipt = frappe.new_doc("Stock Entry")
            receipt.stock_entry_type = "Material Receipt"
            receipt.posting_date = self.date
            receipt.to_warehouse = self.warehouse
            receipt.company = self.company
            
            for item in self.true_items:
                receipt.append("items", {
                    "item_code": item.item_code,
                    "qty": item.qty,
                    "t_warehouse": self.warehouse,
                    "company": self.company,
                    "description": f"Physical stock validation via {self.name}"
                })
            
            receipt.insert()
            receipt.submit()
            # Save the reference link back to this document
            self.db_set("material_receipt_ref", receipt.name)

    def on_cancel(self):
        """
        Triggers on Cancel: Automatically cancels the linked 
        Stock Entries to keep stock accurate.
        """
        # Cancel the Material Issue reference
        if self.material_issue_ref:
            issue_doc = frappe.get_doc("Stock Entry", self.material_issue_ref)
            if issue_doc.docstatus == 1: # Only if Submitted
                issue_doc.cancel()
                frappe.msgprint(f"Linked Issue <b>{self.material_issue_ref}</b> has been cancelled.")

        # Cancel the Material Receipt reference
        if self.material_receipt_ref:
            receipt_doc = frappe.get_doc("Stock Entry", self.material_receipt_ref)
            if receipt_doc.docstatus == 1: # Only if Submitted
                receipt_doc.cancel()
                frappe.msgprint(f"Linked Receipt <b>{self.material_receipt_ref}</b> has been cancelled.")