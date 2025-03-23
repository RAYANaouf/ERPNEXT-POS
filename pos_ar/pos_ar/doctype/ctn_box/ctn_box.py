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
def get_ctn_status(ctn_box_name):
    """
    Return a list of { "item": "ITEM-0001", "qty": 10 } showing
    what's in the CTN-BOX. Adjust logic as needed.
    """
    # 1) Load the CTN-BOX doc
    doc = frappe.get_doc("CTN-BOX", ctn_box_name)

    # 2) Summarize items
    #    If your child table is doc.items, you may already have 'item' and 'qty' fields.
    #    Adjust accordingly.
    summary = {}
    for row in doc.items:
        item_code = row.item
        qty = row.qty or 0
        summary[item_code] = summary.get(item_code, 0) + qty

    # 3) Convert dict -> list of dicts
    #    E.g. [ {"item": "ITEM-0001", "qty": 10}, {"item": "ITEM-0002", "qty": 5} ]
    result = []
    for item_code, total_qty in summary.items():
        result.append({
            "item": item_code,
            "qty": total_qty
        })

    return result

    
    
@frappe.whitelist()
def get_ctn_items(ctn_box_name):
    """
    Return a list of item codes from the child table (e.g. "CTN Items")
    of the given CTN-BOX doc. used to filter porpose on CTN-BOX Transaction sales invoice (child doctype)
    """
      
    result = frappe.get_doc("CTN-BOX", ctn_box_name).get("items")
    
    items_list = [d.item for d in result]
        
    return items_list
