
import frappe



def update_customer_debt_on_invoice(doc, method):
    """
    Updates the custom_debt field in the Customer Doctype when a Sales Invoice, POS Invoice,
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
                WHERE customer = %s AND docstatus = 1 AND consolidated_invoice IS NULL
            ) AS combined
        """, (customer, customer))[0][0] or 0

        # Update the custom_debt field in the Customer Doctype
        frappe.db.set_value("Customer", customer, "custom_debt", total_outstanding)

        frappe.logger().info(f"Customer {customer}'s debt updated to {total_outstanding}.")

    except Exception as e:
        frappe.logger().error(f"Error updating debt for document {doc.name}: {str(e)}")
