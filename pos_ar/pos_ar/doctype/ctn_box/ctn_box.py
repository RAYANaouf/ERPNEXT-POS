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
    
    
    
    
@frappe.whitelist()
def get_ctn_items(ctn_box_name):
    """
    Return a list of item codes from the child table (e.g. "CTN Items")
    of the given CTN-BOX doc.
    """
    
    print("DEBUG: ctn_box_name =", ctn_box_name)
    
    result = frappe.get_doc("CTN-BOX", ctn_box_name).get("items")
    
    items_list = [d.item for d in result]
    
    print("DEBUG: items_list =", items_list)
    
    return items_list
