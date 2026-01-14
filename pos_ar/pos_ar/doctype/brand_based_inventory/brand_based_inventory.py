# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt



import frappe
from frappe.model.document import Document


class BrandBasedInventory(Document):
	pass



@frappe.whitelist()
def get_items_from_cartons(cartons):
    # Parse the JSON list of cartons sent from the client
    if isinstance(cartons, str):
        import json
        cartons = json.loads(cartons)
    
    if not cartons:
        return []

    # Fetch items from the 'Carton Item' child table belonging to these parents
    # Adjust 'parent' and 'item_code', 'qty' to match your actual field names
    items = frappe.get_all("Carton Item", 
        filters={
            "parent": ["in", cartons]
        }, 
        fields=["item", "qty", "parent as carton_origin"]
    )
    
    return items




To achieve a structured response grouped by brand, we need to modify the Python function to accept a list of brands and then iterate through the items to build a nested dictionary.

Since the "hmc -0.00 -0.00" format in your example looks like a combination of a prefix and some values (likely price or stock), I have included placeholders for those fields.

1. Updated Python Function (brand_based_inventory.py)
This function accepts a list of brands, fetches the related items, and organizes them into the specific JSON structure you requested.

Python

import frappe
import json
from frappe.model.document import Document

class BrandBasedInventory(Document):
    pass

@frappe.whitelist()
def get_items_by_brand(brands):
    """
    Accepts a list of brands and returns a grouped dictionary.
    Example input: ["Brand A", "Brand B"] or json string '["Brand A"]'
    """
    if isinstance(brands, str):
        brands = json.loads(brands)
    
    if not brands:
        return {}

    # Initialize the result dictionary
    result = {}

    for brand in brands:
        # Fetch items linked to this brand
        # Replace 'custom_field_1' etc., with actual fields like 'standard_rate' if needed
        items = frappe.get_all("Item",
            filters={"brand": brand, "disabled": 0},
            fields=["name"]
        )

        result[brand] = {
            "total": len(items),
            "items": item_details
        }
    
    return result