# Copyright (c) 2025, rayan aouf and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe


class CTNBOX(Document):
	pass



@frappe.whitelist()
def get_transactions(ctn_box_name):
    # Example: fetch all Stock Entry or Sales Invoices that link to this CTN-BOX
    # Adjust the doctype/field names to match your actual setup
    return frappe.db.get_list(
        "CTN-BOX Transaction",
        filters={"ctn": ctn_box_name, "docstatus": 1},
        fields=["*"]  # specify what fields you need
    )