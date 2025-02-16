import frappe
from frappe import _
import pandas as pd
from frappe.utils import get_site_url, get_files_path
import os

@frappe.whitelist()
def export_pricing_data(company):
    try:
        # Get the pricing data
        items = frappe.get_all(
            "Item",
            fields=["name", "item_name", "item_code", "brand"],
            filters={"disabled": 0},
            order_by="item_name"
        )
        
        # Get all price lists for the company
        price_lists = frappe.get_all(
            "Price List",
            fields=["name"],
            filters={"company": company, "enabled": 1},
            order_by="name"
        )
        
        # Prepare data for Excel
        data = []
        for item in items:
            row = {
                "Item Code": item.item_code,
                "Item Name": item.item_name,
                "Brand": item.brand
            }
            
            # Get prices for each price list
            for pl in price_lists:
                price = frappe.get_all(
                    "Item Price",
                    fields=["price_list_rate"],
                    filters={
                        "item_code": item.item_code,
                        "price_list": pl.name,
                        "selling": 1
                    },
                    limit=1
                )
                row[pl.name] = price[0].price_list_rate if price else ""
            
            data.append(row)
        
        # Create DataFrame and export to Excel
        df = pd.DataFrame(data)
        
        # Create the export directory if it doesn't exist
        export_dir = os.path.join(get_files_path(), "pricing_exports")
        if not os.path.exists(export_dir):
            os.makedirs(export_dir)
            
        # Generate file path
        file_name = f"pricing_data_{company.replace(' ', '_')}_{frappe.utils.now().replace(' ', '_').replace(':', '-')}.xlsx"
        file_path = os.path.join(export_dir, file_name)
        
        # Export to Excel
        df.to_excel(file_path, index=False, engine='openpyxl')
        
        # Get the URL for download
        site_url = get_site_url(frappe.local.site)
        file_url = f"/files/pricing_exports/{file_name}"
        
        return file_url
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Pricing Export Error"))
        frappe.throw(_("Error during export: {0}").format(str(e)))
