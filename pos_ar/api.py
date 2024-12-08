
import frappe



import frappe
from datetime import datetime

def update_customer_debt_on_invoice(doc, method):
    """
    Updates the custom_debt and debt_date fields in the Customer Doctype when a Sales Invoice, POS Invoice,
    or Payment Entry is created or submitted.

    Args:
        doc (Document): The document triggering the event.
        method (str): The trigger method (e.g., 'on_submit', 'on_update').
    """
    try:
        customer = None

        # Check if the document is a Payment Entry
        if doc.doctype == "Payment Entry" and doc.party_type == "Customer":
            customer = doc.party
        else:
            # For Sales Invoice and POS Invoice, get the customer directly
            customer = getattr(doc, "customer", None)

        if not customer:
            frappe.logger().info(f"No customer found for document {doc.name}. Skipping.")
            return

        # Calculate the total outstanding amount for the customer
        total_outstanding = frappe.db.sql("""
            SELECT SUM(outstanding_amount)
            FROM (
                SELECT outstanding_amount
                FROM `tabSales Invoice`
                WHERE customer = %s AND docstatus = 1

                UNION ALL

                SELECT outstanding_amount
                FROM `tabPOS Invoice`
                WHERE customer = %s AND docstatus = 1 AND consolidated_invoice IS NULL AND  outstanding_amount > 0
            ) AS combined
        """, (customer, customer))[0][0] or 0

        # Update the custom_debt and debt_date fields in the Customer Doctype
        frappe.db.set_value("Customer", customer, {"custom_debt": total_outstanding , "custom_debt_date" : datetime.now() })

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


