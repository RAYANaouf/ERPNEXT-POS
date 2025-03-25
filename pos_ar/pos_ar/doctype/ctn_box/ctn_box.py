# Copyright (c) 2025, rayan aouf and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe
import json

class CTNBOX(Document):
	pass



@frappe.whitelist()
def get_transactions(ctn_box_name):
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


    summary = {}
    for row in doc.items:
        item_code = row.item
        qty = row.qty or 0
        summary[item_code] = summary.get(item_code, 0) + qty

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
import frappe, json

@frappe.whitelist()
def get_ctn_for_invoice(items=None):
    """
    For each row in 'selected_items' (which is a list of {"item": ..., "qty": ...}),
    find records in `tabCTN Item` with that item code and qty > 0.
    """

    # 1) Parse the incoming JSON string (if it's JSON)
    selected_items = json.loads(items) if items else []
    
    # If no items, return an empty list
    if not selected_items:
        return []
    
    result = []

    # 2) For each row in selected_items
    for row in selected_items:
        item_code = row.get('item')
        qty_needed = row.get('qty', 0)

        # 3) Query tabCTN Item for matching item_code
        ctn_item_rows = frappe.db.sql(
            """
            SELECT *
            FROM `tabCTN Item`
            WHERE parenttype = 'CTN-BOX'
              AND item = %s
            """,
            (item_code,),
            as_dict=True
        )

        # 4) Loop each row returned from the DB
        for ctn_item_row in ctn_item_rows:
            
            if ctn_item_row.get('qty', 0) > 0:
                if ctn_item_row["qty"] >= qty_needed:
                    result.append({
                        "ctn": ctn_item_row["parent"],  # name of the CTN-BOX
                        "item": item_code,
                        "qty": qty_needed
                    })
                    break
                else:
                    result.append({
                        "ctn": ctn_item_row["parent"],  # name of the CTN-BOX
                        "item": item_code,
                        "qty": ctn_item_row["qty"]
                    })
                    qty_needed -= ctn_item_row["qty"]
                    

    return result
