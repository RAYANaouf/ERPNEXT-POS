

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

                this.selectedItem     = {}
                this.selectedField    = null
                this.selectedTab      = this.tabList[0]

                //prevent set listener multiple times
                this.detailsItemFieldsListeners = false
                this.detailsItemKeysListeners   = false



                this.start_app();
        }

	 async start_app(){
		await  this.prepare_app_defaults();
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
		this.init_customer_box();
		this.init_selected_item();
		this.init_item_details();
                this.init_paymentCart();
        }

        set_right_and_left_sections(){
                this.$components_wrapper.append('<div id="LeftSection" class="columnBox"></div>')
                this.$components_wrapper.append('<div id="RightSection" class="columnBox"></div>')

		this.$rightSection = this.$components_wrapper.find("#RightSection")
		this.$leftSection  = this.$components_wrapper.find("#LeftSection")

        }

        init_item_selector(){
		console.log("item list from controller : " , this.itemList)
                this.item_selector = new pos_ar.PointOfSale.pos_item_selector(
						this.$leftSection  ,
						this.itemList      ,
						this.itemGroupList ,
						this.itemPrices    ,
						item => { this.itemClick_selector(item)  }
					)
	}

	init_customer_box(){
		this.customer_box  = new pos_ar.PointOfSale.pos_customer_box(
									this.$rightSection
									)
	}
        init_selected_item(){
		this.selected_item_cart  = new pos_ar.PointOfSale.pos_selected_item_cart(
									this.$rightSection ,
									this.selectedItemMap,
									item => {
										this.onSelectedItemClick(item)
									},
									this.onCheckout.bind(this)
									)
	}

	init_item_details(){
		console.log("warehouse ==> " , this.PosProfileList[0].warehouse)
		this.item_details = new pos_ar.PointOfSale.pos_item_details(
									this.$leftSection,
									this.PosProfileList[0].warehouse,
									this.priceLists,
									this.itemPrices,
									this.binList,
									this.selectedItem,
									(field , value) =>{
										this.onInput(field , value);
									},
									this.onClose_details.bind(this)
								)
	}

        init_paymentCart(){
		this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
									this.$leftSection,
									this.onClose_payment_cart.bind(this)
								)
        }



        /*********************  callbacks functions ******************************/

	itemClick_selector(item){

		if(!this.selectedItemMap.has(item.name)){
			item.quantity = 1 ;
			item.amount   = this.getItemPrice(item.name);
			this.selectedItemMap.set( item.name  , item);
		}
		else{
			const existingItem = this.selectedItemMap.get(item.name);
			existingItem.quantity += 1 ;
			this.selectedItemMap.set( item.name  , existingItem);
		}

		this.selected_item_cart.calculateNetTotal();
		this.selected_item_cart.calculateQnatity();
		this.selected_item_cart.calculateGrandTotal();
		this.selected_item_cart.refreshSelectedItem();


	}

	onSelectedItemClick(item){
		console.log("item in controller 12 " , this.selectedItem)
		console.log("item in class 12 " , this.item_details.selected_item)

		//show
		this.item_details.show_cart();
		this.selected_item_cart.showKeyboard();

		//close
		this.item_selector.hideCart();
		this.payment_cart.hideCart();

		//change display
		this.selected_item_cart.setKeyboardOrientation("landscape");


		//refresh data
		this.item_details.refreshDate(item);
		console.log("done!")
	}

	onCheckout(){
		console.log("here we are on callback 02 " , this.item_details)

		//show
		this.payment_cart.showCart();

		//hide
		this.item_selector.hideCart();
		this.item_details.hide_cart();
		this.selected_item_cart.hideKeyboard();

		//change display
		this.selected_item_cart.setKeyboardOrientation("landscape");

	}

	onClose_details(){
		console.log("onClose callback 002")

		//show
		this.item_selector.showCart();

		//hide
		this.payment_cart.hideCart();
		this.item_details.hide_cart();
		this.selected_item_cart.hideKeyboard();

		//change display
		this.selected_item_cart.setKeyboardOrientation("portrait");
		this.selected_item_cart.cleanHeighlight();



	}

	onClose_payment_cart(){
		this.item_selector.showCart();
		this.item_details.hide_cart();
		this.payment_cart.hideCart();
	}


	onInput(field , value){
		console.log("the field => " , field  , "change with value ::: " , value);


		console.log(" item => " ,this.selectedItem)

		this.selectedItem.quantity = value;
		this.selectedItemMap.set(this.selectedItem.name , this.selectedItem)

		console.log("the new data. item => " , this.selectedItem , "the map => " , this.selectedItemMap)
		//redraw what should be redrawed
		//this.selected_item_cart.refreshSelectedItem();
	}


	/*****************************  tools  **********************************/
	getItemPrice(itemId){
		const price = this.itemPrices.find(itemPrice => itemPrice.item_code == itemId)
		return price ? price.price_list_rate  : 0
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
