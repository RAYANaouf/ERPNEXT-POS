
import frappe

def handle_customer_debt(doc, method):
    if method == "on_cancel":
        frappe.log_error(f"Sales Invoice {doc.name} was canceled.", "Sales Invoice Event")
        # Add your logic for canceled invoices here
    elif method == "on_submit":
        frappe.log_error(f"Sales Invoice {doc.name} was submitted.", "Sales Invoice Event")
        # Add your logic for submitted invoices here

