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


@frappe.whitelist()
def get_ctn_for_invoice(warehouse=None, items=None):
    """
    1) Fetch the Sales Invoice using docname
    2) Read company, warehouse (or any fields) from that Sales Invoice
    3) Find all CTN-BOX records with that warehouse (and optionally that company)
    4) Filter `tabCTN Item` by those specific parent boxes + item code
    5) For each item, fulfill quantity needed from the relevant CTN Items
    """

    if not warehouse:
        return []


    # Parse items argument into a list of {item, qty}
    selected_items = items
    if isinstance(items, str):
        selected_items = json.loads(items)
    if not selected_items:
        return []

    # -- 3) Find all CTN-BOX docs in the same warehouse
    filters = {"warehouse": warehouse}

    ctn_boxes = frappe.get_list(
        "CTN-BOX",
        filters = filters,
        fields  = ["name"]
    )

    # If no CTN Boxes found, return early
    if not ctn_boxes:
        return []

    # Collect the names of the relevant CTN-BOX documents
    ctn_box_names = [box["name"] for box in ctn_boxes]

    result = []

    # -- 4) For each item row, query `tabCTN Item` but limit to these parents
    for row in selected_items:
        item_code  = row.get('item')
        qty_needed = row.get('qty', 0)

        if not item_code or qty_needed <= 0:
            continue

        # Query only from relevant CTN-BOX parents
        ctn_item_rows = frappe.db.sql(
            """
            SELECT *
            FROM `tabCTN Item`
            WHERE parent IN %(parents)s
              AND parenttype = 'CTN-BOX'
              AND item = %(item_code)s
              AND qty > 0
            ORDER BY qty DESC
            """,
            {
                "parents": ctn_box_names,
                "item_code": item_code
            },
            as_dict=True
        )

        # -- 5) Fulfill qty_needed across the matched CTN items
        for ctn_item_row in ctn_item_rows:
            available_qty = ctn_item_row.get('qty', 0)
            if available_qty <= 0:
                continue

            if available_qty >= qty_needed:
                # enough in one box
                result.append({
                    "ctn":  ctn_item_row["parent"],  # The CTN-BOX name
                    "item": item_code,
                    "qty":  qty_needed
                })
                break
            else:
                # partially fulfill from this CTN
                result.append({
                    "ctn":  ctn_item_row["parent"],
                    "item": item_code,
                    "qty":  available_qty
                })
                qty_needed -= available_qty
                if qty_needed == 0:
                    break

    return result
