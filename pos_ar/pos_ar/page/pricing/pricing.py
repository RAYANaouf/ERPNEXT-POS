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
        # Filter price lists for the specified company or with no company set
        price_lists = frappe.get_all(
            "Price List",
            filters=[
                ["enabled", "=", 1],  # Ensure price list is enabled
                ["custom_company", "in", [company, "", None]]  # Match company or no company set
            ],
            fields=["name"]
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
        # Step 1: Update existing item prices using ORM so `modified` is updated (importing because i notice ERPNext need the date of update to fetch the right price on the right date)
        existing_prices = frappe.get_all("Item Price",
            filters={"brand": brand, "price_list": price_list},
            fields=["name"]
        )

        for price in existing_prices:
            doc = frappe.get_doc("Item Price", price.name)
            doc.price_list_rate = new_price
            doc.save(ignore_permissions=True)

        # Step 2: Find items that don’t have a price in the given price list
        items_without_price = frappe.db.sql("""
            SELECT name FROM `tabItem`
            WHERE brand = %s
            AND name NOT IN (
                SELECT item_code FROM `tabItem Price`
                WHERE price_list = %s
            )
        """, (brand, price_list), as_dict=True)

        # Step 3: Create new item prices for missing items
        for item in items_without_price:
            doc = frappe.get_doc({
                "doctype": "Item Price",
                "item_code": item.name,
                "price_list": price_list,
                "price_list_rate": new_price
            })
            doc.insert(ignore_permissions=True)

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
def add_price_for_all_item_by_brand(brand):
    try:
        # Validate the brand parameter
        if not brand:
            frappe.throw(_("Please specify a brand."))

        # Fetch all price lists
        price_lists = [p['name'] for p in frappe.db.sql("SELECT name FROM `tabPrice List`", as_dict=True)]

        # Fetch items for the specified brand
        items = frappe.db.sql("SELECT name FROM `tabItem` WHERE brand = %s", brand, as_dict=True)

        if not items:
            frappe.throw(_("No items found for the specified brand: {0}".format(brand)))

        # Fetch item price for the specified items
        item_prices = frappe.db.sql("SELECT * FROM `tabItem Price` WHERE item_code IN (%s)" % ', '.join([item['name'] for item in items]), as_dict=True)


        # Initialize the maps
        itemCode_priceList = {}
        priceList = {}
        # Populate the maps
        for price in item_prices:
            item_code = price['item_code']
            pricelist_name = price['price_list']
            rate = price['price_list_rate']
            # Create the combined key for itemCode_priceList map
            key = f"{item_code}_{pricelist_name}"
            itemCode_priceList[key] = rate
            # Update priceList map
            priceList[pricelist_name] = rate
            
        for list in price_lists:
            for item in items:
                key = f"{item['name']}_{list}"
                if key not in itemCode_priceList:
                    if list in priceList:
                        frappe.get_doc(
                            doctype="Item Price",
                            item_code=item['name'],
                            price_list=list,
                            price_list_rate=priceList[list]
                        ).insert()
                    else:
                        frappe.get_doc(
                            doctype="Item Price",
                            item_code=item['name'],
                            price_list=list,
                            price_list_rate=0
                        ).insert()
            

    except Exception as e:
        frappe.log_error(f"Error fixing prices for brand {brand}: {str(e)}")
        frappe.throw(_(f"Failed to update prices for brand {brand}. Please check the error log. {str(e)}"))
        
        
@frappe.whitelist()
def add_price_for_all_item_by_brand2(brand):
    try:
        # Validate the brand parameter
        if not brand:
            frappe.throw(_("Please specify a brand."))

        # Fetch all price lists
        price_lists = [p['name'] for p in frappe.db.sql("SELECT name FROM `tabPrice List` where enabled = 1", as_dict=True)]

        # Fetch items for the specified brand using parameterized query correctly
        items = frappe.db.sql("SELECT name FROM `tabItem` WHERE brand = %s", (brand,), as_dict=True)

        if not items:
            frappe.throw(_("No items found for the specified brand: {0}".format(brand)))

        # Fetch item price for the specified items using a safer method
        item_names = [item['name'] for item in items]
        placeholders = ', '.join(['%s'] * len(item_names))
        item_prices = frappe.db.sql(
            f"SELECT * FROM `tabItem Price` WHERE item_code IN ({placeholders})",
            tuple(item_names),
            as_dict=True
        )

        # Initialize the maps
        itemCode_priceList = {}
        priceList = {}

        # Populate the maps
        for price in item_prices:
            item_code = price['item_code']
            pricelist_name = price['price_list']
            rate = price['price_list_rate']
            # Create the combined key for itemCode_priceList map
            key = f"{item_code}_{pricelist_name}"
            itemCode_priceList[key] = rate
            # Update priceList map
            priceList[pricelist_name] = rate

        # Prepare documents for bulk insert
        new_prices = []
        for price_list in price_lists:
            for item in items:
                key = f"{item['name']}_{price_list}"
                if key not in itemCode_priceList:
                    rate = priceList.get(price_list, 0)
                    new_prices.append({
                        "doctype": "Item Price",
                        "item_code": item['name'],
                        "price_list": price_list,
                        "price_list_rate": rate
                    })

        # Bulk insert new item prices if any
        if new_prices:
            for price_doc in new_prices:
                frappe.get_doc(price_doc).insert()

        frappe.db.commit()  # Commit the changes to the database

    except Exception as e:
        frappe.log_error(f"Error fixing prices for brand {brand}: {str(e)}")
        frappe.throw(_(f"Failed to update prices for brand {brand}. Please check the error log. {str(e)}"))

