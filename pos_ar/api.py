

from datetime import datetime

import frappe
import csv
import os
from frappe.utils import get_url
import json




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
            sii.item_code,
            sii.item_name,
            SUM(sii.qty) AS total_qty,
            i.stock_uom
        FROM 
            `tabSales Invoice Item` sii
        INNER JOIN 
            `tabSales Invoice` si ON sii.parent = si.name
        INNER JOIN 
            `tabItem` i ON sii.item_code = i.name
        WHERE 
            si.posting_date BETWEEN %s AND %s
            AND si.docstatus = 1
    """
    filters = [start, end]

    if company:
        query += " AND si.company = %s"
        filters.append(company)

    query += " GROUP BY sii.item_code, sii.item_name, i.stock_uom"
    query += " HAVING total_qty > 0"

    return frappe.db.sql(query, filters, as_dict=True)













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
def CA_FRD_generator( ref = None, max_count = None , from_warehouse = None , to_warehouse = None):

    useCTN = True
    
    if not ref:
        useCTN = False

    if not max_count:
        useCTN = False
        
    if max_count:
        try:
            max_count = int(max_count)
        except ValueError:
            frappe.throw("max_count must be an integer")

    if useCTN == True :
        # Step 1: Get CTN-BOXES with given ref from CA (beaulieu alger - OC)
        ctn_boxes = frappe.get_all(
            "CTN-BOX",
            filters={"ref": ref, "warehouse": from_warehouse},
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

        # Step 3: Get current stock in to warehouse
        alger_stock = frappe.get_all(
            "Bin",
            filters={"warehouse": to_warehouse},
            fields=["item_code", "actual_qty"]
        )   
    
        alger_item_codes = set(row.item_code for row in alger_stock if row.actual_qty > 0)

        # Step 4: Determine needed CTNs (ordered list)
        needed_ctns = []
        for ctn in ctn_names:  # preserve order from fetched CTNs
            items = ctn_to_items.get(ctn, [])
            for item in items:
                if item["item"] not in alger_item_codes:
                    needed_ctns.append(ctn)
                    break  # Only one missing item needed

        # Apply max_count limit
        if max_count:
           needed_ctns = needed_ctns[:max_count]

        # Filter ctn_to_items to only keep needed CTNs
        needed_ctn_details = {ctn: ctn_to_items[ctn] for ctn in needed_ctns}

        return {
            "needed_ctns": needed_ctns,
            "count": len(needed_ctns),
            "ctn_details": needed_ctn_details
        }
    else:
        # Step 1: Get current stock in from warehouse
        from_warehouse_stock = frappe.get_all(
            "Bin",
            filters={"warehouse": from_warehouse},
            fields=["item_code", "actual_qty"]
        )  
    
        # Step 2: Get current stock in to warehouse
        to_warehouse_stock = frappe.get_all(
            "Bin",
            filters={"warehouse": to_warehouse},
            fields=["item_code", "actual_qty"]
        )   
    
        # Convert to dictionaries for faster lookup
        from_stock_map = {row.item_code: min(row.actual_qty, 100)   for row in from_warehouse_stock if row.actual_qty > 0} # cap to 100
        to_stock_set = set(row.item_code for row in to_warehouse_stock if row.actual_qty > 0)

        # Step 3: Determine needed items (in from_warehouse but not in to_warehouse)
        needed_items = [
            {"item_code": item_code, "qty": qty}
            for item_code, qty in from_stock_map.items()
            if item_code not in to_stock_set
        ]

        return {
            "needed_items": needed_items,
            "count": len(needed_items)
        }


################################################### user on client script ##############################################


@frappe.whitelist()
def get_items_from_ctns(ctn_list):
    """
    Accepts a list of CTN-BOX names.
    Returns a list of item the ctn contain with item_code, qty, uom, s_warehouse (gotten from the CTN warehouse).
    """
    item_map = {}
    
    if isinstance(ctn_list, str):
        ctn_list = json.loads(ctn_list)  # Deserialize from string to Python list if needed

    for ctn_name in ctn_list:
        ctn = frappe.get_doc("CTN-BOX", ctn_name)
        
        for row in ctn.items:
            item = frappe.get_doc("Item", row.item)
            uom = item.stock_uom or (item.uoms[0].uom if item.uoms else "")
            conversion_factor = 1.0
            
            
            # Find the conversion factor if stock_uom is not default
            if item.uoms:
                for uom_row in item.uoms:
                    if uom_row.uom == uom:
                        conversion_factor = uom_row.conversion_factor or 1.0
                        break
                    
                    
            key = (row.item, uom, ctn.warehouse)

                
            if key not in item_map:
                if not uom:
                    item_map[key] = {
                        "item_code": row.item,
                        "qty": 0,
                        "s_warehouse": ctn.warehouse
                    }
                else:
                    item_map[key] = {
                        "item_code": row.item,
                        "qty": 0,
                        "uom": uom,
                        "conversion_factor": conversion_factor,
                        "s_warehouse": ctn.warehouse
                    }
                    
            item_map[key]["qty"] += row.qty

    return list(item_map.values())






@frappe.whitelist()
def get_all_item_qty(warehouse=None, since=None):
    """
    Returns list of all items in a warehouse with their actual quantities (non-zero),
    and total quantity sold in POS invoices (non-consolidated only) for that warehouse.
    """
    if not warehouse:
        frappe.throw(_("Warehouse is required"))
        
    if since == None : 
        print("====> since inside if oww :::: " , since)
        # Get item stock info (excluding actual_qty == 0)
        bins = frappe.get_all("Bin",
            filters={
                "warehouse": warehouse,
                "actual_qty": ["!=", 0],
            },
        fields=['name', 'actual_qty', 'item_code', 'warehouse', 'modified']
        )
    else : 
        print("====> since inside else oww :::: " , since)
        # Get item stock info (excluding actual_qty == 0)
        bins = frappe.get_all("Bin",
            filters={
                "warehouse": warehouse,
                "actual_qty": ["!=", 0],
                "modified": [">", since]
            },
        fields=['name', 'actual_qty', 'item_code', 'warehouse', 'modified']
    )

    

    item_codes = [bin["item_code"] for bin in bins]
    if not item_codes:
        return bins  # No items to query for POS sales

    # Create placeholders for item_code list
    placeholders = ', '.join(['%s'] * len(item_codes))

    # SQL query to get POS invoice quantities for non-consolidated invoices, filtered by warehouse
    query = f"""
        SELECT pii.item_code, SUM(pii.qty) AS pos_invoice_qty
        FROM `tabPOS Invoice Item` pii
        JOIN `tabPOS Invoice` pi ON pi.name = pii.parent
        WHERE pi.consolidated_invoice IS NULL
        AND pii.warehouse = %s
        AND pi.docstatus = 1
        AND pii.item_code IN ({placeholders})
        GROUP BY pii.item_code
    """

    # Combine warehouse and item_codes for the query parameters
    query_params = tuple([warehouse] + item_codes)

    pos_data = frappe.db.sql(query, query_params, as_dict=True)

    # Map POS quantities to item codes
    pos_map = {row["item_code"]: row["pos_invoice_qty"] for row in pos_data}

    # Merge POS data into bins
    for bin in bins:
        bin["pos_invoice_qty"] = pos_map.get(bin["item_code"], 0)

    return bins

    




@frappe.whitelist()
def get_company_default_warehouse(company=None, ignorePermission=False):
    if not company:
        return {"default_warehouse": None}

    # Convert string to boolean (as it comes from JS as string)
    if isinstance(ignorePermission, str):
        ignorePermission = ignorePermission.lower() == "true"

    try:
        if ignorePermission:
            doc = frappe.get_doc("Company", company).as_dict()
        else:
            doc = frappe.get_doc("Company", company)
    except frappe.DoesNotExistError:
        return {"default_warehouse": None}

    return {"default_warehouse": doc.get("custom_default_warehouse")}










#################################################### event functions ####################################################








#sales invoice , POS invoice , payment entry event
#on submit , on cancel
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





#sales invoice event
#on submit , on cancel
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




#Stock Entry  event
#type = "Material Transfer"
#on submit , on cancel
def update_ctn_box_warehouse(doc, method):
    """
    Update CTN Box warehouse on submit or cancel of Material Transfer.
    """
    if doc.stock_entry_type != "Material Transfer":
        return

    if not doc.get("custom_ctn_boxs"):
        return

    if method == "on_submit":
        target_warehouse = doc.items[0].t_warehouse  # Assumes uniform target
    elif method == "on_cancel":
        target_warehouse = doc.items[0].s_warehouse  # Reset to source or set to None if needed
    else:
        return

    for row in doc.custom_ctn_boxs:
        frappe.db.set_value("CTN-BOX", row.ctn, "warehouse", target_warehouse)




# Stock Entry event
# type = "Material Transfer"
# on submit, on cancel
def remove_ctn(doc, method):
    """
    If the type = "Material Issue", remove all the CTN related to it on submit
    and restore them on cancel.
    """
    if doc.stock_entry_type != "Material Issue":
        return

    # If there are no CTN boxes, exit
    if not doc.get("custom_ctn_boxs"):
        return

    # On submit: Delete the CTN-Box records and backup them
    if method == "on_submit":
        for row in doc.custom_ctn_boxs:
            if row.ctn:  # Check if there is a CTN
                try:
                    # Get the CTN-BOX document by its name (row.ctn)
                    ctn_box = frappe.get_doc("CTN-BOX", row.ctn)
                    print("ctn_box items ==============> : ", ctn_box.items)

                    for item in ctn_box.items : 
                        print("item - - - -  -==== >>>>>>>>>>>> " , item )
                    
                    print("ctn_box items ==============> : ", ctn_box.items)
                    # Now, we have access to the full CTN-BOX document
                    # Proceed with the logic to backup and delete
                    backup_data = {
                        "company"         : ctn_box.company,
                        "warehouse"       : ctn_box.warehouse,
                        "ref"             : ctn_box.ref,
                        "ctn_num"         : ctn_box.ctn_num,
                        "box_place"       : ctn_box.box_place,
                        "status"          : ctn_box.status,
                        "items"           : ctn_box.items
                    }
                    
                    # Debugging: Display backup data in the UI
                    frappe.msgprint(f"ctn_box items : {ctn_box.items}")
                    
                    # Debugging: Display backup data in the UI
                    frappe.msgprint(f"Backup Data: {backup_data}")
                    
                    # Create a backup document for the CTN-Box
                    frappe.get_doc({
                        "doctype": "CTN-Box Backup",
                        "ctn": row.ctn,
                        "backup_data": backup_data  # Store the data as JSON
                    }).insert()
                    # Delete the CTN-Box document after backup
                    frappe.delete_doc("CTN-BOX", row.ctn, force=1)
                    frappe.msgprint(f"Deleted CTN-BOX: {row.ctn}")
                except frappe.DoesNotExistError:
                    frappe.msgprint(f"CTN-BOX {row.ctn} not found, skipping.")
                except Exception as e:
                    frappe.log_error(frappe.get_traceback(), f"Error deleting CTN-BOX {row.ctn}")
                




#Customer filtring.

def sync_customer_permissions_from_user_permission(doc, method=None):
    if doc.allow != "Company" or doc.applicable_for  :
        return
    company = doc.for_value
    user = doc.user
    
    # Step 1: Get all Customers linked to the granted Company
    customers = frappe.db.sql("""
        SELECT DISTINCT parent
        FROM `tabCustomer Company` 
        WHERE company = %s
    """, (company,), as_list=True)
    
    # Flatten the result into a simple list of names
    customer_names = [row[0] for row in customers]
    
    for customer_name in customer_names:
        # Step 2: Add Customer permission (if not already there biensur)
        # check if permission already exists
        exist = frappe.db.exists("User Permission",{
            "user":user,
            "allow":"Customer",
            "for_value":customer_name,
            "applicable_for": None
        })
        if not exist:
            add_user_permission(user,"Customer",customer_name)
            
         # Step 3: Use get_doc to fetch companies from custom_companies child table
        customer_doc = frappe.get_doc("Customer", customer_name)
        
        for row in customer_doc.custom_companies:
            print("row.company : ", row.company)
            print("customer_name : ", customer_name)
            linked_company = row.company

            scoped_perm_exists = frappe.db.exists("User Permission", {
                "user": user,
                "allow": "Company",
                "for_value": linked_company,
                "applicable_for": "Customer"
            })

            if not scoped_perm_exists:
                add_company_permission_for_customer(user, linked_company)
                
            print("--------scoped_perm_exists : ", scoped_perm_exists)

        
            
    
    

    


@frappe.whitelist()
def update_customer_user_permissions(doc, method=None):
    customer_name = doc.name
    companies = [row.company for row in doc.custom_companies]

    # Step 1: Delete all user permissions for this customer
    frappe.db.delete("User Permission", {
        "allow": "Customer",
        "for_value": customer_name
    })
    
    # Step 2: Delete all 'Company' permissions scoped to this customer
    frappe.db.delete("User Permission", {
        "allow": "Company",
        "applicable_for": "Customer",
        "for_value": customer_name
    })


    users = frappe.get_all("User", filters={"enabled": 1}, pluck="name")

    for user_name in users:
        # Get all allowed companies for user
        allowed_companies = frappe.get_all(
            "User Permission",
            filters={"user": user_name, "allow": "Company"},
            pluck="for_value"
        )

        if not allowed_companies:
            continue

        has_common = any(company in allowed_companies for company in companies)

        if has_common:
            # Add permission to view this customer
            add_user_permission(user_name, "Customer", customer_name)

            for company in companies:
                # If user doesn’t already have access to this company
                if company not in allowed_companies:
                    add_company_permission_for_customer(user_name, company)


def add_user_permission(user, doctype, for_value):
    frappe.get_doc({
        "doctype": "User Permission",
        "user": user,
        "allow": doctype,
        "for_value": for_value,
    }).insert(ignore_permissions=True)




def add_company_permission_for_customer(user_name, company):
    frappe.get_doc({
        "doctype": "User Permission",
        "user": user_name,
        "allow": "Company",
        "for_value": company,
        "apply_to_all_doctypes": 0,
        "applicable_for": "Customer"
    }).insert(ignore_permissions=True)
    
    
    
def remove_user_company_permission(doc , method=None):
    print("doc.allow : ", doc.allow)
    print("doc.user : ", doc.user)
    print("doc.for_value : ", doc.for_value)
    print("doc.applicable_for : ", doc.applicable_for)
    if doc.allow != "Company" or doc.applicable_for  :
        return
    
        
    #Fetch all Customer linked to this Company
    customers = frappe.db.sql("""
        SELECT DISTINCT parent
        FROM `tabCustomer Company` 
        WHERE company = %s
    """, (doc.for_value,), as_list=True)
    
    # Flatten the result into a simple list of names
    customer_names = [row[0] for row in customers]
    
    #delete all customer access to this company
    for customer_name in customer_names:
        # Delete all user permissions for this customer
        frappe.db.delete("User Permission", {
            "user": doc.user,
            "allow": "Customer",
            "for_value": customer_name
        })
        print(f"deleted customer access to this company {customer_name}")
        
    

