pos_ar.PointOfSale.FetchHandler = class FetchHandler{

	constructor(
		db
	){
		this.db = db;
	}


	async fetchCustomers() {
		try {
			return await frappe.db.get_list('Customer', {
                                fields: ['name', 'customer_name' ],
				filters: { disabled : 0},
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching customers:', error);
			return []
		}
	}


	async fetchBrands() {
		try {
			return await frappe.db.get_list('Brand', {
				fields: ['brand' ],
				filters: {},
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching customers:', error);
			return []
		}
	}

	async fetchItemGroups() {
		try {
			return await frappe.db.get_list('Item Group', {
				fields: ['name', 'item_group_name' , 'parent_item_group' , 'is_group' ],
				filters: {},
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}


	async fetchItems() {
		try {
			return await frappe.db.get_list('Item', {
				fields: ['name', 'item_name' , 'image' , 'brand' ,'item_group' , 'description' , 'stock_uom' ],
				filters: { disabled : 0 },
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}



	async fetchItemPrice() {
		try {
			return await frappe.db.get_list('Item Price', {
				fields: ['name', 'item_code' , 'item_name' , 'price_list', 'price_list_rate' , 'brand'],
				filters: {},
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}


	async fetchPriceList() {
		try {
			return await frappe.db.get_list('Price List', {
				fields: ['name', 'price_list_name' , 'currency' ],
				filters: {selling : 1 },
				limit : 100000
			})
		} catch (error) {
			console.error('Error fetching Item Group :', error);
			return []
		}
	}


	async fetchWarehouseList(){
		try{
			return await frappe.db.get_list('Warehouse' , {
				fields  : ['name' , 'warehouse_name'],
				filters : {},
				limit : 100000
			})
		}
		catch(error){
			console.error('Error fetching Warehouse list : ' , error)
			return [];
		}
	}


	async fetchPosProfileList(){
		try{
			return await frappe.db.get_list('POS Profile' , {
				fields  : ['name' , 'warehouse' , 'company' , 'selling_price_list' , 'income_account' , 'cost_center' , 'write_off_account' , 'write_off_cost_center' , 'taxes_and_charges' , 'tax_category'],
				filters : { disabled : 0},
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

	async fetchBinList(){
		try{
			return await frappe.db.get_list('Bin' , {
				fields  : ['actual_qty' , 'item_code' , 'warehouse'],
				filters : { },
				limit   : 1
			})
		}
		catch(error){
			console.error('Error fetching Bin list : ' , error)
			return [];
		}
	}



}
