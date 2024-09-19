
frappe.provide("pos_ar.PointOfSale");

frappe.require([
	"/assets/pos_ar/js/pos_item_selector.js"
	], function() {});

pos_ar.PointOfSale.Controller = class {
        constructor(wrapper) {
		//principales variable
		this.wrapper = $(wrapper).find(".layout-main-section");
		this.page    = wrapper.page ;
		//logic variable
		this.customersList    = []
		this.itemGroupList    = []
		this.itemList         = []
		this.itemPrices       = []
		this.priceLists       = []
		this.selectedItemMap  = new Map();
		this.warehouseList    = []
		this.PosProfileList   = []
		this.binList          = []
		this.tabList          = ["C1"]

		this.selectedItem     = null
		this.selectedField    = null
		this.selectedTab      = this.tabList[0]

		//prevent set listener multiple times
		this.detailsItemFieldsListeners = false
		this.detailsItemKeysListeners   = false



        	this.prepare_app_defaults();
		this.prepare_container();
		this.prepare_components();
	}

	async prepare_app_defaults(){
		this.customersList  = await this.fetchCustomers()
        	this.itemGroupList  = await this.fetchItemGroups()
        	this.itemList       = await this.fetchItems()
		this.itemPrices     = await this.fetchItemPrice()
		this.priceLists     = await this.fetchPriceList()
		this.warehouseList  = await this.fetchWarehouseList()
		this.PosProfileList = await this.fetchPosProfileList()
		this.binList        = await this.fetchBinList()

	        console.log("customersList : " , this.customersList )
	        console.log("itemGroupList : " , this.itemGroupList )
	        console.log("itemList : "      , this.itemList      )
	        console.log("itemPrices : "    , this.itemPrices    )
		console.log("priceLists : "    , this.priceLists    )
		console.log("warehouseList : " , this.warehouseList )
		console.log("POSProfileList : ", this.PosProfileList)
		console.log("bin list : "      , this.binList       )
		console.log("tabList  : "      , this.tabList       )
		console.log("selected Tab : "  , this.selectedTab   )
	}



	/***********************  ui ******************************************/

	prepare_container(){
		//append css styles
		this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/selectorBox.css">')
		this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/itemDetailsCart.css">')
		this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/paymentMethodCart.css">')
		this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/customerBox.css">')
		this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/cartBox.css">')

		this.wrapper.append('<div id="MainContainer" class="rowBox"></div>');

		this.$components_wrapper = this.wrapper.find("#MainContainer");
	}

	prepare_components(){
		this.set_right_and_left_sections();
		this.init_item_selector();
		this.init_item_details();
		this.init_paymentCart();
	}

	set_right_and_left_sections(){
		this.$components_wrapper.append('<div id="LeftSection" class="columnBox"></div>')
		this.$components_wrapper.append('<div id="RightSection" class="columnBox">')
	}

	init_item_selector(){
		this.item_selector = new pos_ar.PointOfSale.pos_item_selector(this.$components_wrapper)
	}

	init_item_details(){
		
	}

	init_paymentCart(){
		
	}


	/*********************  get data functions ******************************/


	async  fetchCustomers() {
		try {
			return await frappe.db.get_list('Customer', {
                        	fields: ['name', 'customer_name' ],
                        	filters: {}
                	})
    		} catch (error) {
        		console.error('Error fetching customers:', error);
        		return []
    		}
	}

	async fetchItemGroups() {
    		try {
        		return await frappe.db.get_list('Item Group', {
                        	fields: ['name', 'item_group_name' ],
                        	filters: {}
                	})
    		} catch (error) {
        		console.error('Error fetching Item Group :', error);
        		return []
    		}
	}

	async fetchItems() {
    		try {
        		return await frappe.db.get_list('Item', {
                        	fields: ['name', 'item_name' , 'image' , 'item_group' , 'stock_uom'  ],
                        	filters: {}
                	})
    		} catch (error) {
        		console.error('Error fetching Item Group :', error);
        		return []
    		}
	}

	async fetchItemPrice() {
    		try {
        		return await frappe.db.get_list('Item Price', {
                        	fields: ['name', 'item_code' , 'item_name' , 'price_list', 'price_list_rate' ],
                        	filters: { price_list : "Standard Selling"}
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
                        	filters: {selling : 1 }
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
                        	filters : {}
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
                        	fields  : ['name' , 'warehouse'],
                        	filters : {}
                	})
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
                        	filters : {}
                	})
        	}
        	catch(error){
                	console.error('Error fetching Bin list : ' , error)
                	return [];
        	}
	}

};
