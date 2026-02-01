# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt



import frappe
from frappe.model.document import Document
import json
from frappe.utils import flt, getdate, get_time

class BrandBasedInventory(Document):

    def on_submit(self):
        print("============> on_submit")
        self.create_stock_reconciliation()

    def create_stock_reconciliation(self):
        # 1. Prepare the items list for Stock Reconciliation
        reco_items = []

        price_list = self.price_list
        
        for d in self.items:
            price = frappe.db.get_value("Item Price", 
                {"item_code": d.item, "price_list": price_list}, 
                "price_list_rate")
            
            # If no price is found in the Price List, fallback to 0 or Item Master valuation
            if not price:
                price = frappe.db.get_value("Item", d.item, "valuation_rate") or 0

            reco_items.append({
                "item_code": d.item,
                "warehouse": self.warehouse,
                "qty": d.total,
                "valuation_rate": price,
            })

        if not reco_items:
            frappe.throw("No items found to reconcile.")

        # 2. Extract Date and Time from DateTime field
        # If date_time is empty, fallback to current system time
        posting_date = getdate(self.date_time) if self.date_time else frappe.utils.nowdate()
        posting_time = get_time(self.date_time) if self.date_time else frappe.utils.nowtime()

        # 2. Create the Stock Reconciliation Document
        sr = frappe.get_doc({
            "doctype": "Stock Reconciliation",
            "purpose": "Stock Reconciliation",
            "company": self.company,
            "posting_date": posting_date,
            "posting_time": posting_time,
            "items": reco_items,
            "remarks": f"Automatically created from Brand Based Inventory: {self.name}"
        })

        sr.insert()
        sr.submit()
        
        # 3. Link the created SR back to this document for reference
        # Make sure you have a field 'stock_reconciliation' in your DocType
        #self.db_set("stock_reconciliation", sr.name)
        
        frappe.msgprint(f"Stock Reconciliation {sr.name} created and submitted.")


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


import json
import frappe
from frappe.utils import flt

@frappe.whitelist()
def get_items_by_brand(brands, warehouse=None):
    if isinstance(brands, str):
        brands = json.loads(brands)
    
    if not warehouse or not brands:
        return {"brands": {}, "items": {}}

    result = {
        "brands": {}, 
        "items": {}   
    }

    # Fetch items matching the brands
    items = frappe.get_all("Item",
        filters={"brand": ["in", brands], "disabled": 0},
        fields=["name", "brand"],
        order_by="name asc"
    )

    for item in items:
        # 1. Fetch Bin Qty
        bin_qty = frappe.db.get_value("Bin", 
            {"item_code": item.name, "warehouse": warehouse}, 
            "actual_qty") or 0

        # 2. Get Last Reconciliation for POS adjustment
        last_sle = frappe.get_all("Stock Ledger Entry",
            filters={"item_code": item.name, "warehouse": warehouse, "voucher_type": "Stock Reconciliation", "docstatus": 1},
            fields=["posting_date", "posting_time"],
            order_by="posting_date desc, posting_time desc", limit=1)

        # 3. Calculate Pending POS Qty
        query = """
            SELECT SUM(item.qty) FROM `tabPOS Invoice Item` item
            JOIN `tabPOS Invoice` parent ON item.parent = parent.name
            WHERE item.item_code = %s AND item.warehouse = %s 
            AND (parent.consolidated_invoice IS NULL OR parent.consolidated_invoice = '')
            AND parent.docstatus = 1
        """
        params = [item.name, warehouse]
        if last_sle:
            query += " AND TIMESTAMP(parent.posting_date, parent.posting_time) > %s"
            params.append(f"{last_sle[0].posting_date} {last_sle[0].posting_time}")

        pos_qty = frappe.db.sql(query, tuple(params))[0][0] or 0
        
        # Final Calculation
        result["items"][item.name] = {
            "brand": item.brand,
            "actual_qty": flt(bin_qty) - flt(pos_qty)
        }

        # Count brand items
        result["brands"][item.brand] = result["brands"].get(item.brand, 0) + 1

    return result











