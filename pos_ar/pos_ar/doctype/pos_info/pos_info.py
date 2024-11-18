# Copyright (c) 2024, rayan aouf and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class pos_info(Document):
	pass


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
