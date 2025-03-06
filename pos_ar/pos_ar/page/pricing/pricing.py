import frappe
from frappe import _

from frappe.utils import get_site_url, get_files_path




@frappe.whitelist()
def get_all_item_prices(company=None):
    """
    Fetches price lists and item prices for the specified company.
    Returns both price lists and item prices for easier rendering.
    """
    try:
        # Filter item prices by company if provided
        filters = {"enabled": 1}
        if company:
            filters["custom_company"] = company
            
            
            
        # Get price lists that are linked to the specified company
        price_lists = frappe.get_all(
            "Price List",
            filters=filters
        )
        
        # Extract price list names for filtering item prices
        price_list_names = [pl["name"] for pl in price_lists]
        
        item_prices = frappe.get_all(
            "Item Price",
            fields=[
				"name",
                "item_code",
                "price_list_rate",
                "currency",
                "price_list",
                "brand",
                "modified"
            ],
            filters={
                "price_list": ["in", price_list_names]
            }
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



