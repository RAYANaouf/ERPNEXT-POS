
import frappe
from datetime import datetime

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






import frappe
import csv
import os
from frappe.utils import get_url

@frappe.whitelist()
def export_item_prices():
    prices = frappe.get_all("Item Price",
        filters={"price_list": "Standard Selling"},
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
