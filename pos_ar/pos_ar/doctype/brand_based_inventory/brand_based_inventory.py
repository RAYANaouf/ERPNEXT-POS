# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt



import frappe
from frappe.model.document import Document
import json
from frappe.utils import flt

class BrandBasedInventory(Document):
	pass



@frappe.whitelist()
def get_items_from_cartons(cartons):
    # Parse the JSON list of cartons sent from the client
    if isinstance(cartons, str):
        cartons = json.loads(cartons)
    
    if not cartons:
        return []

    # Fetch items from the 'Carton Item' child table belonging to these parents
    # Adjust 'parent' and 'item_code', 'qty' to match your actual field names
    items = frappe.get_all("Carton Item", 
        filters={
            "parent": ["in", cartons]
        }, 
        fields=["item", "qty", "parent as carton_origin"]
    )
    
    return items




@frappe.whitelist()
def get_items_by_brand(brands, warehouse=None):
    """
    Returns items grouped by brand with their actual quantity in a specific warehouse.
    """
    if isinstance(brands, str):
        brands = json.loads(brands)
    
    if not brands:
        return {}

    result = {}

    for brand in brands:
        # Fetch items linked to this brand
        items = frappe.get_all("Item",
            filters={"brand": brand, "disabled": 0},
            fields=["name"],
            order_by="name asc"
        )

        item_list = []
        for itm in items:
            # Fetch actual quantity from the Bin table for this item and warehouse
            actual_qty = 0
            if warehouse:
                actual_qty = frappe.db.get_value("Bin", 
                    {"item_code": itm.name, "warehouse": warehouse}, 
                    "actual_qty"
                ) or 0

            # 2. Find the timestamp of the LAST Stock Reconciliation for THIS ITEM in THIS WAREHOUSE
            # We check the Stock Ledger Entry directly.
            print("actual_qty ::: ", actual_qty)
            print("warehouse ::: ", warehouse)
            last_sle_reco = frappe.db.get_all("Stock Ledger Entry",
                    filters={
                        "item_code": itm.name,
                        "warehouse": warehouse,
                        "voucher_type": "Stock Reconciliation",
                        "docstatus": 1
                    },
                    fields=["posting_date", "posting_time"],
                    order_by="posting_date desc, posting_time desc",
                    limit=1
                )

			# 3. Sum POS Invoices newer than that specific SLE
            query = """
                SELECT SUM(item.qty) 
                FROM `tabPOS Invoice Item` item
                JOIN `tabPOS Invoice` parent ON item.parent = parent.name
                WHERE item.item_code = %s 
                AND item.warehouse = %s 
                AND (parent.consolidated_invoice IS NULL OR parent.consolidated_invoice = '')
                AND parent.docstatus = 1
                """
            params = [itm.name, warehouse]
            print("last_sle_reco ::: ", last_sle_reco)
            if last_sle_reco:
                # Combine posting_date and posting_time for the comparison
                last_timestamp = f"{last_sle_reco[0].posting_date} {last_sle_reco[0].posting_time}"
                query += " AND TIMESTAMP(parent.posting_date, parent.posting_time) > %s"
                params.append(last_timestamp)

            pos_qty = frappe.db.sql(query, tuple(params))[0][0] or 0


            # Adjusted quantity
            print("the item", itm.name)
            print("pos_qty", pos_qty)
            print("actual_qty", actual_qty)
            actual_qty = flt(actual_qty) - flt(pos_qty)
            
            item_list.append({
                "name": itm.name,
                "actual_qty": actual_qty
            })

        result[brand] = {
            "total": len(items),
            "items": item_list
        }
    
    return result