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
		     	'customer'             : customer_name ,  # Filter by customer name
		     	'outstanding_amount'   : ['>', 0]      ,  # Only unpaid invoices
		     	'docstatus'            : 1             ,  # not the canceled ones
		     	'consolidated_invoice' : ''
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
			'customer'           : customer_name ,  # Filter by customer name
			'outstanding_amount' : ['>', 0]      ,  # Only unpaid invoices
			'docstatus'          : 1                # not the canceled ones
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
	#override date to keep the old one
	new_pos_invoice.posting_date = pos_invoice.posting_date

	pos_invoice.cancel()
	frappe.db.commit()


	# Convert the outstanding amount to float for comparison
	outstanding_amount = float(new_pos_invoice.outstanding_amount)
	client_payment_amount = float(payment_amount)

	# Check if the invoice has an outstanding amount
	if outstanding_amount > 0:
		if client_payment_amount == outstanding_amount :
			new_pos_invoice.payments[0].amount      += client_payment_amount
			new_pos_invoice.payments[0].base_amount += client_payment_amount
			new_pos_invoice.outstanding_amount      -= client_payment_amount
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
		elif client_payment_amount > outstanding_amount :
			new_pos_invoice.payments[0].amount += outstanding_amount
			new_pos_invoice.payments[0].base_amount += outstanding_amount
			new_pos_invoice.outstanding_amount = 0
			new_pos_invoice.status = 'Paid'
			rest = client_payment_amount - outstanding_amount
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
			new_pos_invoice.payments[0].amount      += client_payment_amount
			new_pos_invoice.payments[0].base_amount += client_payment_amount
			new_pos_invoice.outstanding_amount      -= client_payment_amount
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
	sales_invoice = frappe.get_doc('Sales Invoice', invoice_name)

	if float(sales_invoice.outstanding_amount) > 0:

		payAmount         = 0
		outstandingAmount = 0
		rest = 0

		#Important check if it pay more than outstanding
		if(payment_amount > sales_invoice.outstanding_amount):
			payAmount = float(sales_invoice.outstanding_amount)
			rest      = float(float(payment_amount) - float(sales_invoice.outstanding_amount))
		else:
			payAmount = float(payment_amount)

		# Create a Payment Entry
		payment_entry = frappe.new_doc('Payment Entry')
		payment_entry.payment_type    = 'Receive'
		payment_entry.party_type      = 'Customer'
		payment_entry.party           = sales_invoice.customer
		payment_entry.received_amount = float(payment_amount)
		payment_entry.paid_amount     = float(payment_amount)


		# Link the Payment Entry to the Sales Invoice
		# Add a row to the references table
		reference_row = payment_entry.append('references', {})
		reference_row.reference_doctype = 'Sales Invoice'
		reference_row.reference_name = sales_invoice.name
		reference_row.allocated_amount = float(payAmount)



		# Set the Paid To account
		default_bank_account = frappe.db.get_value('Company', sales_invoice.company, 'default_bank_account')
		if not default_bank_account:
			return {
				'error': 'Default bank account not set for the company. Please configure it in the Company settings.'
			}

		payment_entry.paid_to = default_bank_account
		payment_entry.paid_to_account_currency = frappe.db.get_value('Account', default_bank_account, 'account_currency')


		#exchange rate is required
		if payment_entry.company_currency != payment_entry.paid_to_account_currency:
			payment_entry.target_exchange_rate = 1  # Default to 1 or fetch the correct rate
			payment_entry.source_exchange_rate = 1  # Default to 1 or fetch the correct rate

 		# Set Reference No and Reference Date
		payment_entry.reference_no = "AUTO-GEN"  # Replace with actual reference number
		payment_entry.reference_date = frappe.utils.nowdate()  # Set the current date


		# Save and submit the Payment Entry
		payment_entry.save()
		payment_entry.submit()

		return {
			'invoice_name': sales_invoice.name,
			'paid_amount': payment_amount,
			'outstanding_amount': sales_invoice.outstanding_amount,
			'status': sales_invoice.status
		}
	else:
		return {'error': 'This invoice is already fully paid or has no outstanding amount.'}




