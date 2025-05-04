

from datetime import datetime

import frappe
import csv
import os
from frappe.utils import get_url


def update_customer_debt_on_invoice(doc, method):
    """
    Updates the custom_debt and debt_date fields in the Customer Doctype when a Sales Invoice, POS Invoice,
    or Payment Entry is created or submitted.

    Args:
        doc (Document): The document triggering the event.
        method (str): The trigger method (e.g., 'on_submit', 'on_cancel').
    """
    try:
        customer = None

        # Determine the customer based on document type
        if doc.doctype == "Payment Entry" and doc.party_type == "Customer":
            customer = doc.party
        else:
            customer = getattr(doc, "customer", None)

        if not customer:
            frappe.logger().info(f"No customer found for document {doc.name}. Skipping.")
            return

        # Determine the appropriate query based on whether this is a POS invoice
        if doc.doctype == "Sales Invoice" and getattr(doc, "is_pos", 0) == 1:
            # POS Sales Invoice
            total_outstanding = frappe.db.sql("""
                SELECT SUM(outstanding_amount)
                FROM `tabSales Invoice`
                WHERE customer = %s AND docstatus = 1
            """, (customer,))[0][0] or 0
        else:
            # Regular Sales Invoice or other document types
            total_outstanding = frappe.db.sql("""
                SELECT SUM(outstanding_amount)
                FROM (
                    SELECT outstanding_amount
                    FROM `tabSales Invoice`
                    WHERE customer = %s AND docstatus = 1

                    UNION ALL

                    SELECT outstanding_amount
                    FROM `tabPOS Invoice`
                    WHERE customer = %s AND docstatus = 1 AND consolidated_invoice IS NULL AND outstanding_amount > 0
                ) AS combined
            """, (customer, customer))[0][0] or 0

        # Update the custom_debt and debt_date fields in the Customer Doctype
        frappe.db.set_value("Customer", customer, {
            "custom_debt": total_outstanding,
            "custom_debt_date": datetime.now()
        })

        frappe.logger().info(f"Customer {customer}'s debt updated to {total_outstanding} on {datetime.now()}.")

    except Exception as e:
        frappe.logger().error(f"Error updating debt for document {doc.name}: {str(e)}")







def update_all_customers_debt(doc, method):
    """
    Updates the custom_debt field for all customers in the Customer Doctype,
    considering both Sales Invoices and POS Invoices.
    """
    try:
        # Get all customers from Sales and POS Invoices
        customers = frappe.db.sql("""
            SELECT DISTINCT customer
            FROM (
                SELECT customer FROM `tabSales Invoice` WHERE docstatus = 1
                UNION
                SELECT customer FROM `tabPOS Invoice` WHERE docstatus = 1 AND consolidated_invoice IS NULL AND outstanding_amount > 0
            ) AS customer_list
        """, as_list=True)

        # Update debts for each customer
        for customer_record in customers:
            customer = customer_record[0]
            
            # Calculate total outstanding for the customer
            total_outstanding = frappe.db.sql(""" 
                SELECT SUM(outstanding_amount)
                FROM (
                    SELECT outstanding_amount
                    FROM `tabSales Invoice`
                    WHERE customer = %s AND docstatus = 1 AND outstanding_amount > 0
                    
                    UNION ALL

                    SELECT outstanding_amount
                    FROM `tabPOS Invoice`
                    WHERE customer = %s AND docstatus = 1 AND consolidated_invoice IS NULL AND outstanding_amount > 0
                ) AS combined
            """, (customer, customer))[0][0] or 0

            # Update the custom_debt field in the Customer Doctype
            frappe.db.set_value("Customer", customer, {"custom_debt": total_outstanding , "custom_debt_date": datetime.now() })

        frappe.logger().info("All customer debts updated successfully.")
    except Exception as e:
        frappe.logger().error(f"Error updating debts for all customers: {str(e)}")





def manage_related_ctn_transactions(doc, method):
    """
    Create related CTN Transactions whenever a Sales Invoice is submitted.
    """
    # Only run for 'on_submit' if you also hooked it into other events.
    if method == "on_submit":
        
        
        for item in doc.custom_ctn_transaction:
            # create a new "CTN Transaction" doc
            ctn_trn = frappe.new_doc("CTN-BOX Transaction")
            ctn_trn.name = doc.name + "-" + item.ctn + "-" + item.item
            ctn_trn.item = item.item
            ctn_trn.qty  = item.qty
            ctn_trn.ctn  = item.ctn
            ctn_trn.sales_invoice = doc.name
            ctn_trn.insert()
            ctn_trn.submit()






@frappe.whitelist()
def get_item_sold(start, end, company=None):
    if not start or not end:
        frappe.throw(_("Start and End dates are required"))

    query = """
        SELECT 
            sii.item_name,
            SUM(sii.qty) AS total_qty
        FROM 
            `tabSales Invoice Item` sii
        INNER JOIN 
            `tabSales Invoice` si ON sii.parent = si.name
        WHERE 
            si.posting_date BETWEEN %s AND %s
            AND si.docstatus = 1
    """
    filters = [start, end]

    if company:
        query += " AND si.company = %s"
        filters.append(company)

    query += " GROUP BY sii.item_code, sii.item_name"

    items = frappe.db.sql(query, filters, as_dict=True)

    return items














#i do that for export_item_prices form the database and download it as xlsx

@frappe.whitelist()
def export_item_prices():
    prices = frappe.get_all("Item Price",
        filters={"price_list": "TP - Alger"},
        fields=["item_code", "price_list_rate"]
    )

    if not prices:
        return "No prices found."

    file_path = "/tmp/item_prices.csv"

    # Write CSV using built-in csv module
    with open(file_path, mode="w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Item", "Price"])  # Header
        for row in prices:
            writer.writerow([row["item_code"], row["price_list_rate"]])

    # Save file into Frappe's File DocType
    with open(file_path, "rb") as f:
        file = frappe.get_doc({
            "doctype": "File",
            "file_name": "item_prices.csv",
            "is_private": 1,
            "content": f.read()
        })
        file.save()

    os.remove(file_path)

    return get_url(file.file_url)




@frappe.whitelist()
def export_stock_value():
    
    
    import frappe, csv, os
    from frappe.utils import get_url
    from frappe.model.document import Document

    # Get all items
    items = frappe.get_all("Item", fields=["item_code"])

    if not items:
        return "No items found."

    file_path = "/tmp/stock_value.csv"

    # Write CSV
    with open(file_path, mode="w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Item", "Price (TP - Alger)", "Qty (Magasin - OA)"])  # Header

        for item in items:
            item_code = item["item_code"]

            # Get price from price list
            price_doc = frappe.db.get_value(
                "Item Price",
                {"item_code": item_code, "price_list": "TP - Alger"},
                "price_list_rate"
            )

            # Get stock quantity from warehouse
            qty = frappe.db.get_value(
                "Bin",
                {"item_code": item_code, "warehouse": "Magasins - OA"},
                "actual_qty"
            )

            writer.writerow([
                item_code,
                price_doc or 0.0,
                qty or 0.0
            ])

    # Save file into Frappe's File DocType
    with open(file_path, "rb") as f:
        file = frappe.get_doc({
            "doctype": "File",
            "file_name": "stock_value.csv",
            "is_private": 1,
            "content": f.read()
        })
        file.save()

    os.remove(file_path)

    return get_url(file.file_url)





@frappe.whitelist()
def export_items_without_price():
    import frappe, csv, os
    from frappe.utils import get_url

    # Get all active items with brand
    items = frappe.get_all(
        "Item",
        filters={"disabled": 0},
        fields=["item_code", "item_name", "brand"]
    )

    # Filter items without price in Public Price List
    result = []
    for item in items:
        has_price = frappe.db.exists("Item Price", {
            "item_code": item["item_code"],
            "price_list": "TP - Alger"
        })
        if not has_price:
            result.append(item)

    if not result:
        return "All items have a price in the TP - Alger Price List."

    # Sort result by brand
    result.sort(key=lambda x: (x["brand"] or "").lower())

    file_path = "/tmp/items_without_price.csv"

    # Write to CSV
    with open(file_path, mode="w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Item Code", "Item Name", "Brand"])  # Header row

        for item in result:
            writer.writerow([
                item["item_code"],
                item["item_name"],
                item.get("brand", "")
            ])

    # Save to File Doctype
    with open(file_path, "rb") as f:
        file = frappe.get_doc({
            "doctype": "File",
            "file_name": "items_without_price.csv",
            "is_private": 1,
            "content": f.read()
        })
        file.save()

    os.remove(file_path)

    return get_url(file.file_url)






@frappe.whitelist()
def CA_FRD_generator():
    # Step 1: Get CTN-BOXES with ref 24019 from CA (beaulieu alger - OC)
    ctn_boxes = frappe.get_all(
        "CTN-BOX",
        filters={"ref": "24019", "warehouse": "beaulieu alger - OC"},
        fields=["name"]
    )
    
    ctn_names = [box.name for box in ctn_boxes]

    # Step 2: Get items inside those CTN-BOXES (with qty)
    ctn_items = frappe.get_all(
        "CTN Item",  
        filters={"parent": ["in", ctn_names]},
        fields=["parent", "item", "qty"]
    )
    
    # Map: CTN → [{item, qty}]
    ctn_to_items = {}
    for row in ctn_items:
        ctn_to_items.setdefault(row.parent, []).append({
            "item": row.item,
            "qty": row.qty
        })

    # Step 3: Get current stock in ALGER (Bordj el kiffen - OA)
    alger_stock = frappe.get_all(
        "Bin",
        filters={"warehouse": "Bordj el kiffen - OA"},
        fields=["item_code", "actual_qty"]
    )
    
    alger_item_codes = set(row.item_code for row in alger_stock if row.actual_qty > 0)

    # Step 4: Determine needed CTNs
    needed_ctns_set = set()
    for ctn, items in ctn_to_items.items():
        for item in items:
            if item["item"] not in alger_item_codes:
                needed_ctns_set.add(ctn)
                break

    # Filter ctn_to_items to only keep needed CTNs
    needed_ctn_details = {ctn: ctn_to_items[ctn] for ctn in needed_ctns_set}

    return {
        "needed_ctns": list(needed_ctns_set),
        "count": len(needed_ctns_set),
        "ctn_details": needed_ctn_details
    }


