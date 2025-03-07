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

@frappe.whitelist()
def fix_prices(brand, price_list, new_price):
    try:
        # Update all item prices for this brand and price list
        frappe.db.sql("""
            UPDATE `tabItem Price`
            SET price_list_rate = %s
            WHERE brand = %s AND price_list = %s
        """, (new_price, brand, price_list))
        
        frappe.db.commit()
        return True
        
    except Exception as e:
        frappe.log_error(f"Error fixing prices: {str(e)}")
        frappe.throw(_("Failed to update prices. Please check the error log."))



@frappe.whitelist()
def add_price_for_all_item():
    try:
        # Get all price lists and items
        price_lists = frappe.db.sql("SELECT name FROM `tabPrice List`", as_dict=True)
        items = frappe.db.sql("SELECT name, brand FROM `tabItem`", as_dict=True)

        # Iterate over each price list and item
        for price_list in price_lists:
            for item in items:
                # Check if item price already exists for this item and price list
                item_price_exists = frappe.db.sql("""
                    SELECT name FROM `tabItem Price`
                    WHERE item_code = %s AND price_list = %s
                """, (item['name'], price_list['name']))

                if not item_price_exists:
                    # Check if item price exists for the same brand and price list
                    brand_price = frappe.db.sql("""
                        SELECT price_list_rate FROM `tabItem Price`
                        WHERE item_code IN (
                            SELECT name FROM `tabItem` WHERE brand = %s
                        ) AND price_list = %s LIMIT 1
                    """, (item['brand'], price_list['name']), as_dict=True)

                    # Determine the price to set
                    price_to_set = brand_price[0]['price_list_rate'] if brand_price else 0

                    # Create and insert item price document using ERPNext ORM
                    item_price_doc = frappe.get_doc({
                        "doctype": "Item Price",
                        "item_code": item['name'],
                        "price_list": price_list['name'],
                        "price_list_rate": price_to_set
                    })
                    item_price_doc.insert(ignore_permissions=True)  # Insert item price using ORM

        frappe.db.commit()  # Commit all changes
        return True

    except Exception as e:
        frappe.log_error(f"Error fixing prices: {str(e)}")
        frappe.throw(_(f"Failed to update prices. Please check the error log. {str(e)}"))
        
  @frappe.whitelist()
def add_price_for_all_item2():
    try:
        # Fetch all required data in bulk to minimize database calls
        price_lists = [p['name'] for p in frappe.db.sql("SELECT name FROM `tabPrice List`", as_dict=True)]
        items = frappe.db.sql("SELECT name, brand FROM `tabItem`", as_dict=True)

        # Fetch existing item prices to avoid duplicate checks
        existing_prices = frappe.db.sql("""
            SELECT item_code, price_list FROM `tabItem Price`
        """, as_dict=True)
        existing_prices_set = {(p['item_code'], p['price_list']) for p in existing_prices}

        # Fetch brand-based prices in bulk
        brand_prices = frappe.db.sql("""
            SELECT ip.price_list_rate, i.brand, ip.price_list
            FROM `tabItem Price` ip
            INNER JOIN `tabItem` i ON i.name = ip.item_code
        """, as_dict=True)
        
        # Create a dictionary for quick lookup of brand prices
        brand_price_map = {}
        for bp in brand_prices:
            key = (bp['brand'], bp['price_list'])
            if key not in brand_price_map:
                brand_price_map[key] = bp['price_list_rate']

        # Prepare a list for new item prices to insert
        new_item_prices = []

        # Iterate over each price list and item
        for price_list in price_lists:
            for item in items:
                # Check if item price already exists
                if (item['name'], price_list) not in existing_prices_set:
                    # Determine the price to set
                    price_to_set = brand_price_map.get((item['brand'], price_list), 0)

                    # Create a new item price document
                    item_price_doc = frappe.get_doc({
                        "doctype": "Item Price",
                        "item_code": item['name'],
                        "price_list": price_list,
                        "price_list_rate": price_to_set
                    })
                    new_item_prices.append(item_price_doc)

        # Insert new item prices efficiently
        for doc in new_item_prices:
            doc.insert(ignore_permissions=True)

        frappe.db.commit()  # Commit all changes
        return True

    except Exception as e:
        frappe.log_error(f"Error fixing prices: {str(e)}")
        frappe.throw(_(f"Failed to update prices. Please check the error log. {str(e)}"))
