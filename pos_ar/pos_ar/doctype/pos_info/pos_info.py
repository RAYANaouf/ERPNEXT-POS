# Copyright (c) 2024, rayan aouf and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class pos_info(Document):
	pass



@frappe.whitelist()
def get_customer_debts(customer_name):
	invoices = frappe.get_all(
		'POS Invoice',  # DocType
		fields=['name' , 'outstanding_amount' , 'posting_date'],  # Required fields
                filters={
			'customer': customer_name,  # Filter by customer name
			'outstanding_amount': ['>', 0],  # Only unpaid invoices
			'docstatus': 1  # not the canceled ones
		}, # Apply filters
		limit_page_length=100000  # Adjust as needed
	)
	return invoices

@frappe.whitelist()
def get_customer_debts_sales_invoices(customer_name):
	invoices = frappe.get_all(
		'Sales Invoice',  # DocType
		fields=['name' , 'outstanding_amount' , 'posting_date'],  # Required fields
                filters={
			'customer': customer_name,  # Filter by customer name
			'outstanding_amount': ['>', 0],  # Only unpaid invoices
			'docstatus': 1  # not the canceled ones
		}, # Apply filters
		limit_page_length=100000  # Adjust as needed
	)
	return invoices





@frappe.whitelist()
def get_item_barcodes(since=None):
    filters = {}
    if since:
        filters['modified'] = ['>', since]

    # Using frappe.get_all for better performance and permissions handling
    barcodes = frappe.get_all(
        'Item Barcode',  # DocType
        fields=['name', 'barcode_type', 'parent', 'uom', 'barcode'],  # Required fields
        filters=filters,  # Apply filters
        limit_page_length=100000  # Adjust as needed
    )

    return barcodes


@frappe.whitelist()
def check_opening_entry(user , posProfile):
        open_vouchers = frappe.db.get_all(
                "POS Opening Entry",
                filters={"user": user, "pos_closing_entry": ["in", ["", None]], "docstatus": 1 , "pos_profile" : posProfile},
                fields=["name", "company", "pos_profile", "period_start_date"],
                order_by="period_start_date desc",
        )

        return open_vouchers



@frappe.whitelist()
def get_mode_of_payments():

    # Use SQL to fetch data directly
    query = """
        SELECT *
        FROM `tabMode of Payment`
    """
    mode_of_payments = frappe.db.sql(query,  as_dict=True)

    return mode_of_payments





@frappe.whitelist()
def update_invoice_payment(invoice_name, payment_amount):
	# Fetch the POS Invoice by its name
	pos_invoice = frappe.get_doc('POS Invoice', invoice_name)

	# Create a new POS Invoice by duplicating the old one
	new_pos_invoice = frappe.copy_doc(pos_invoice)

	pos_invoice.cancel()
	frappe.db.commit()


	# Convert the outstanding amount to float for comparison
	outstanding_amount = float(new_pos_invoice.outstanding_amount)

	# Check if the invoice has an outstanding amount
	if float(outstanding_amount) > 0:
		if float(payment_amount) == float(outstanding_amount):
			new_pos_invoice.payments[0].amount += float(payment_amount)
			new_pos_invoice.payments[0].base_amount += float(payment_amount)
			new_pos_invoice.outstanding_amount -= float(payment_amount)
			new_pos_invoice.status = 'Paid'
			# Save the updated POS Invoice
			new_pos_invoice.save()
			frappe.db.commit()
			new_pos_invoice.submit()  # Resubmit the invoice
			return {
				'real_name'         : new_pos_invoice.name,
				'paid_amount'       : new_pos_invoice.paid_amount,
				'payment_method'    : new_pos_invoice.payments[0],
				'deb'               : 1,
				'remaining'         : 0,
				'paid'              : new_pos_invoice.status
			}
		elif float(payment_amount) > float(outstanding_amount):
			new_pos_invoice.payments[0].amount += float(outstanding_amount)
			new_pos_invoice.payments[0].base_amount += float(outstanding_amount)
			new_pos_invoice.outstanding_amount = 0
			new_pos_invoice.status = 'Paid'
			rest = float(payment_amount) - float(outstanding_amount)
			# Save the updated POS Invoice
			new_pos_invoice.save()
			frappe.db.commit()
			new_pos_invoice.submit()  # Resubmit the invoice
			return {
				'real_name'          : new_pos_invoice.name,
				'outstanding_amount' : new_pos_invoice.outstanding_amount,
				'deb'                : 2,
				'payment_method'     : new_pos_invoice.payments[0],
				'paid_amount'        : new_pos_invoice.paid_amount,
				'remaining'          : rest,
				'paid'               : new_pos_invoice.status
			}
		else:
			new_pos_invoice.payments[0].amount += float(payment_amount)
			new_pos_invoice.payments[0].base_amount += float(payment_amount)
			new_pos_invoice.outstanding_amount -= float(payment_amount)
			# Save the updated POS Invoice
			new_pos_invoice.save()
			frappe.db.commit()
			new_pos_invoice.submit()  # Resubmit the invoice
		return {
			'real_name'          : new_pos_invoice.name,
			'payment_method'     : new_pos_invoice.payments[0],
			'deb'                : 3,
			'outstanding_amount' : new_pos_invoice.outstanding_amount,
			'paid_amount'        : new_pos_invoice.paid_amount,
			'remaining'          : 0,
			'paid'               : new_pos_invoice.status
		}
	else:
		return {'error': 'This invoice is already fully paid or has no outstanding amount.'}










@frappe.whitelist()
def update_sales_invoice_payment(invoice_name, payment_amount):
	# Fetch the POS Invoice by its name
	pos_invoice = frappe.get_doc('Sales Invoice', invoice_name)

	if float(pos_invoice.outstanding_amount) > 0:
		# Create a Payment Entry
		payment_entry = frappe.new_doc('Payment Entry')
		payment_entry.payment_type = 'Receive'
		payment_entry.party_type = 'Customer'
		payment_entry.party = sales_invoice.customer
		payment_entry.paid_amount = payment_amount
		payment_entry.payment_date = frappe.utils.nowdate()
	else:
		return {'error': 'This invoice is already fully paid or has no outstanding amount.'}
