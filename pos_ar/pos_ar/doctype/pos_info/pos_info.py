# Copyright (c) 2024, rayan aouf and contributors
# For license information, please see license.txt

from ast import If
from dataclasses import fields
from functools import cache
from pickle import FALSE
import frappe
from frappe.model.document import Document
import json


class pos_info(Document):
	pass





def update_customer_debt_on_invoice(doc, method):
    """
    Updates the custom_debt field in the Customer Doctype when a Sales Invoice is created or submitted.

    Args:
        doc (Sales Invoice): The Sales Invoice document.
        method (str): The trigger method (e.g., 'on_submit', 'on_update').
    """
    try:
        # Calculate the total outstanding amount for the customer
        total_outstanding = frappe.db.sql("""
            SELECT SUM(outstanding_amount)
            FROM `tabSales Invoice`
            WHERE customer = %s AND docstatus = 1
        """, (doc.customer,))[0][0] or 0

        # Update the custom_debt field in the Customer Doctype
        frappe.db.set_value("Customer", doc.customer, "custom_debt", total_outstanding)

        frappe.logger().info(f"Customer {doc.customer}'s debt updated to {total_outstanding}.")

    except Exception as e:
        frappe.logger().error(f"Error updating debt for customer {doc.customer}: {str(e)}")



@frappe.whitelist()
def get_customer_debt( name ):

    debt = frappe.db.sql("""
        SELECT custom_debt
        FROM `tabCustomer`
        where name like %s
    """, (name,) ) [0][0] or 0

    return debt




def update_all_customers_debt():
    """
    Updates the custom_debt field for all customers in the Customer Doctype.
    """
    try:
        # Get all customers with outstanding sales invoices
        customer_debts = frappe.db.sql("""
            SELECT customer, SUM(outstanding_amount) as total_outstanding
            FROM `tabSales Invoice`
            WHERE docstatus = 1
            GROUP BY customer
        """, as_dict=True)

        # Update each customer's custom_debt field
        for record in customer_debts:
            frappe.db.set_value("Customer", record["customer"], "custom_debt", record["total_outstanding"])

        frappe.logger().info("All customer debts updated successfully.")
    except Exception as e:
        frappe.logger().error(f"Error updating debts for all customers: {str(e)}")






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
    query = """
        SELECT name, outstanding_amount, posting_date
        FROM `tabSales Invoice`
        WHERE customer = %s
        AND outstanding_amount > 0
        AND docstatus = 1
    """
	#use sql to avoid the cache because it cause problem like get old version of sales invoice
    invoices = frappe.db.sql(query, (customer_name,), as_dict=True)
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
 
 new_pos_invoice.owner = frappe.session.user
new_pos_invoice.user = frappe.session.user
    
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
				'paid_amount'        : outstanding_amount,
				'outstanding_amount' : new_pos_invoice.outstanding_amount,
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
			'paid_amount'        : client_payment_amount,
			'outstanding_amount' : new_pos_invoice.outstanding_amount,
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
		if(float(payment_amount) > float(sales_invoice.outstanding_amount)):
			payAmount = float(sales_invoice.outstanding_amount)
			rest      = float(float(payment_amount) - float(sales_invoice.outstanding_amount))
		else:
			payAmount = float(payment_amount)

		# Create a Payment Entry
		payment_entry = frappe.new_doc('Payment Entry')
		payment_entry.payment_type    = 'Receive'
		payment_entry.party_type      = 'Customer'
		payment_entry.party           = sales_invoice.customer
		payment_entry.received_amount = float(payAmount)
		payment_entry.paid_amount     = float(payAmount)



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

		#payment_entry.paid_to_account_currency = frappe.db.get_value('POS Invoice', default_bank_account, 'account_currency')

		invoices = frappe.db.get_list('POS Invoice',
			filters={
				'consolidated_invoice' : sales_invoice.name
			},
			fields=['name','total'],
		)


		#exchange rate is required
		if payment_entry.company_currency != payment_entry.paid_to_account_currency:
			payment_entry.target_exchange_rate = 1  # Default to 1 or fetch the correct rate
			payment_entry.source_exchange_rate = 1  # Default to 1 or fetch the correct rate

 		# Set Reference No and Reference Date
		payment_entry.reference_no = "AUTO-GEN"  # rayan note : you can replace with actual reference number
		payment_entry.reference_date = frappe.utils.nowdate()  # Set the current date


		# Save and submit the Payment Entry
		payment_entry.save()
		payment_entry.submit()

		if(float(payment_amount) >= float(sales_invoice.outstanding_amount)):
			return {
				'remaining' : rest     ,
				'status'    : 'Paid'   , 
				'invoices'  : invoices ,
			}
		else:
			return {
				'remaining' : rest     ,
				'status'    : 'Partly Paid',
				'invoices'  : invoices ,
			}


	else:
		return {'error': 'This invoice is already fully paid or has no outstanding amount.'}






@frappe.whitelist()
def pay_selected_invoice(invoices, payment_amount):
	selected_invoices = json.loads(invoices)
	remaining_amount = float(payment_amount)

	invoices_state_collection = []

	for invoice in selected_invoices:
		if remaining_amount <= 0:
			break
			
		invoice_name = invoice.get('name')
		invoice_type = invoice.get('type')  # 'Sales Invoice' or 'POS Invoice'
		if invoice_type == "Sales Invoice":
			result = update_sales_invoice_payment(invoice_name, remaining_amount)
			invoices_state_collection.append({
				'invoices': result.get('invoices'),
				'status': result.get('status'),
				'sales_invoice_name': invoice_name
			})
			remaining_amount = result.get('remaining')

	return {
		'remaining': remaining_amount,
		'invoices_state_collection': invoices_state_collection
	}











@frappe.whitelist()
def get_item_prices(company=None):
    """
    Fetches price lists and item prices for the specified company or price lists with no company set.
    Returns both price lists and item prices for easier rendering.
    """
    try:
        # Filter price lists for the specified company or with no company set
        price_lists = frappe.get_all(
            "Price List",
            filters=[
                ["enabled", "=", 1],  # Ensure price list is enabled
                ["custom_company", "in", [company, "", None]]  # Match company or no company set
            ],
            fields=["name"]
        )

        # Filter item prices by the price lists fetched
        item_prices = []
        if price_lists:
            # Extract price list names to filter item prices
            price_list_names = [pl["name"] for pl in price_lists]
            
            item_prices = frappe.get_all(
                "Item Price",
                filters={"price_list": ["in", price_list_names]},  # Filter by price lists
                fields=[
                    "name",
                    "item_code",
                    "price_list_rate",
                    "currency",
                    "price_list",
                    "brand",
                    "modified"
                ]
            )

        # Get all fields from brands
        brands = frappe.get_all(
            "Brand",
            fields=["*"]  # Get all fields
        )

        return {
            "price_lists": price_lists,
            "brands": brands,
            "prices": item_prices
        }

    except Exception as e:
        frappe.log_error(f"Error fetching item prices: {str(e)}")
        return {
            "price_lists": [],
            "brands": [],
            "prices": []
        }




# I created it for nacimo optic (tizi) to get all sold accessories 		
@frappe.whitelist()
def get_saled_item(company=None, pos_opening_entry=None, brand=None):
    try:
        filters_invoice = {"docstatus": 1}  # Include docstatus filter

        # Check if company is provided
        if company:
            filters_invoice["company"] = company
        else:
            return {
                "items": {},
                "error" : str(e)
            }

        # Handle pos_opening_entry filter
        if pos_opening_entry:
            opening_entry = frappe.get_doc("POS Opening Entry", pos_opening_entry)
            start_time = opening_entry.period_start_date

            # If status is Open - Get all after start time
            if opening_entry.status == "Open":
                filters_invoice["posting_date"] = [">=", start_time]
            
            # If status is Closed - Get all between start and end time
            elif opening_entry.status == "Closed":
                closing_entry = frappe.get_doc("POS Closing Entry", opening_entry.pos_closing_entry)
                end_time = closing_entry.period_end_date
                filters_invoice["posting_date"] = ["between", (start_time, end_time)]

        # Get POS Invoices with the applied filters
        posInvoices = frappe.get_all(
            "POS Invoice",
            filters=filters_invoice,
            fields=["name"]
        )

        item_sold = {}

        for invoice in posInvoices:
            invoice_name = invoice["name"]

            filters_item = {
                "docstatus": 1, 
                "parent": invoice_name
            }

            # Add brand filter if provided
            if brand:
                filters_item["brand"] = brand

            pos_items = frappe.get_all(
                "POS Invoice Item", 
                filters=filters_item, 
                fields=["item_code", "qty", "rate", "brand"]
            )

            for item in pos_items:
                if item["item_code"] in item_sold:
                    item_sold[item["item_code"]]["qty"] += item["qty"]
                    item_sold[item["item_code"]]["rate"] += item["qty"] * item["rate"]
                else:
                    item_sold[item["item_code"]] = {
                        "qty": item["qty"],
                        "rate": item["qty"] * item["rate"]
                    }

        return {
            "items": item_sold
        }

    except Exception as e:
        frappe.log_error(f"Error fetching items: {str(e)}")
        return {
            "items": {},
            "error" : str(e)
        }

@frappe.whitelist()
def get_non_consolidated_invoices():
    """
    Get all POS invoices that are not consolidated and filtered by the user's company
    Returns:
        list: List of POS invoices with their details
    """
    company = frappe.defaults.get_user_default("company")
    
    invoices = frappe.get_all(
        "POS Invoice",
        filters={
            "docstatus": 1,  # Submitted documents
            "consolidated_invoice": "",  # Not consolidated
            "company": company,
            "custom_is_shared" : 1
        },
        order_by="posting_date desc"
    )
    
    # Get complete invoice doc for each invoice
    for i, invoice in enumerate(invoices):
        doc = frappe.get_doc("POS Invoice", invoice.name)
        # Ensure creation_time is available for printing
        doc.creation_time = doc.creation
        invoices[i] = doc
    
    return invoices





@frappe.whitelist()
def get_stock_availability(item_code, warehouse):
    if frappe.db.get_value("Item", item_code, "is_stock_item"):
        is_stock_item = True
        bin_qty = get_bin_qty(item_code, warehouse)
        pos_sales_qty = get_pos_reserved_qty(item_code, warehouse)

        return bin_qty - pos_sales_qty, is_stock_item
    else:
        is_stock_item = True
        if frappe.db.exists("Product Bundle", {"name": item_code, "disabled": 0}):
            return get_bundle_availability(item_code, warehouse), is_stock_item
        else:
            is_stock_item = False
		# Is a service item or non_stock item
    return 0, is_stock_item


@frappe.whitelist()
def get_items(warehouse):
            
            
        filters_item = {
            "disabled": 0,
        }
        items = frappe.get_all(
            "Item",
            filters = filters_item,
            fields=["name"]
        )
        for item in items:
            get_stock_availability(item.name, warehouse)
        
        return items
            
             