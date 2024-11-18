pos_ar.PointOfSale.FetchHandler = class FetchHandler{

	constructor(){

	}


	async fetchCustomers(since) {
		try {
			const filter = { disabled : 0}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Customer', {
                                fields: ['name', 'customer_name' ],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching customers:', error);
			return []
		}
	}


	async fetchBrands(since) {
		try {
			const filter = {}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Brand', {
				fields: ['brand' ],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching customers:', error);
			return []
		}
	}

	async fetchItemGroups(since) {
		try {
			const filter = {}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Item Group', {
				fields: ['name', 'item_group_name' , 'parent_item_group' , 'is_group' ],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}


	async fetchItems(since) {
		try {
			const filter = {disabled : 0}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Item', {
				fields: ['name', 'item_name' , 'image' , 'brand' ,'item_group' , 'description' , 'stock_uom' , 'barcodes' ],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}

/*	async fetchItemBarCodes(since) {
		try {
			const filter = {parenttype:"Item"}
			if(since){
				filter.modified = ['>',since]
			}
			return await frappe.db.get_list('Item Barcode', {
				fields: ['name', 'barcode_type'  ,'parent' , 'uom' , 'barcode' ],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
		return []
	}
*/
	async fetchItemBarCodes() {
		try {
			const response = await frappe.call({
				method: 'pos_ar.pos_ar.doctype.pos_info.pos_info.get_item_barcodes',
				args: { since }
			});
			return response.message;  // The fetched item barcodes
		} catch (error) {
			console.error('Error fetching Item Barcodes:', error);
			return [];
		}
	}



	async fetchItemPrice(since) {
		try {
			const filter = {}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Item Price', {
				fields: ['name', 'item_code' , 'item_name' , 'price_list', 'price_list_rate' , 'brand'],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}


	async fetchPriceList(since) {
		try {
			const filter = {selling : 1}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Price List', {
				fields: ['name', 'price_list_name' , 'currency' ],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}


	async fetchWarehouseList(since){
		try{
			const filter = {}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Warehouse' , {
				fields  : ['name' , 'warehouse_name'],
				filters : filter,
				limit : 100000
			})
		}
		catch(error){
			console.error('Error fetching Warehouse list : ' , error)
			return [];
		}
	}


	async fetchPosProfileList(since){
		try{
			const filter = {disabled : 0}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('POS Profile' , {
				fields  : ['name' , 'warehouse' , 'company' , 'selling_price_list' , 'warehouse' , 'income_account' , 'cost_center' , 'write_off_account' , 'write_off_cost_center' , 'taxes_and_charges' , 'tax_category'],
				filters : filter,
				limit : 100
			})
		}
		catch(error){
			console.error('Error fetching pos profile list : ' , error)
			return [];
		}
	}


	async fetchCompany(companyId){
		try{
			return await frappe.db.get_doc('Company' , companyId)
		}
		catch(error){
			console.error('Error fetching company by companyId from the profile list : ' , error)
			return [];
		}
	}

	async fetchSalesTaxesAndChargesTemplate(templateId){
		try{
			return await frappe.db.get_doc('Sales Taxes and Charges Template' , templateId)
		}
		catch(error){
			console.error('Error fetching Warehouse list : ' , error)
			return [];
		}
	}

	async fetchBinList(since){
		try{
			const filter = {}
			/*if(since){
				filter.modified = ['>',since]
			}*/
			return await frappe.db.get_list('Bin' , {
				fields  : ['name' , 'actual_qty' , 'item_code' , 'warehouse'],
				filters : filter,
				limit   : 1
			})
		}
		catch(error){
			console.error('Error fetching Bin list : ' , error)
			return [];
		}
	}

	async fetchDeletedDocs(since) {
		try {
			const filter = {}
			if(since){
				filter.modified = ['>',since]
			}
			return await frappe.db.get_list('Deleted Document', {
				fields: ['name', 'deleted_name'  ,'deleted_doctype' , 'restored' ],
				filters: filter,
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching deleted documents :', error);
			return []
		}
		return []
	}


}
