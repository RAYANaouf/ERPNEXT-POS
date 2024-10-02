

pos_ar.PointOfSale.Controller = class {
        constructor(wrapper) {
		//principales variable
                this.wrapper = $(wrapper).find(".layout-main-section");
                this.page    = wrapper.page ;

		//logic variable
                this.customersList     = []
                this.itemGroupList     = []
                this.itemList          = []
                this.itemPrices        = []
                this.priceLists        = []
                this.selectedItemMaps  = new Map([
							["C1" , new Map()]
						])
                this.warehouseList     = []
                this.PosProfileList    = []
                this.binList           = []

                this.selectedItem          = {}
                this.selectedField         = {}
                this.selectedTab           = {"tabName" : "C1"}
		this.selectedPaymentMethod = {"methodName" : ""}

		//sell invoice
		this.sellInvoices    = new Map();
		this.POSOpeningEntry = {}

                this.start_app();
        }

	 async start_app(){
		await  this.prepare_app_defaults();
		this.prepare_container();
                await  this.prepare_components();
		this.setListeners();
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

                console.log("customersList => " , this.customersList )
                console.log("itemGroupList => " , this.itemGroupList )
                console.log("itemList      => " , this.itemList      )
                console.log("itemPrices    => " , this.itemPrices    )
                console.log("priceLists    => " , this.priceLists    )
                console.log("warehouseList => " , this.warehouseList )
                console.log("POSProfileList => ", this.PosProfileList)
                console.log("bin list       => ", this.binList       )
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

        async prepare_components(){
		const hasPOSEntry = await this.checkForPOSEntry();

		console.log("debug : " , hasPOSEntry , "the condition ==> " , hasPOSEntry == false);
		if( hasPOSEntry == false ){
			console.log("at if  : " , hasPOSEntry);
			return;
		}
		else{
			console.log("at else  : " , hasPOSEntry);

	                this.set_right_and_left_sections();
        	        this.init_item_selector();
			this.init_customer_box();
			this.init_selected_item();
			this.init_item_details();
                	this.init_paymentCart();
		}
        }

	async checkForPOSEntry(){

		try{
			const r = await frappe.db.get_list('POS Opening Entry' , {
					filters :{
						'pos_profile' : this.PosProfileList[0].name,
						'status'      : 'Open',
						'user'        : frappe.session.user
					},
					fields  : ['name' , 'status'],
					limit   : 1 // we only need the most recent one
				});
			if(r.length === 0){
				frappe.throw('No POS Opening Emtry found for that POS Profile for the current user. ')
				return false;
			}
			//copy data
			Object.assign(this.POSOpeningEntry ,  r[0])
			console.log("==> " , this.POSOpeningEntry)

			return true;

		}catch(error){
			console.error('error occured : ' , error);
			frappe.throw('Error checking for POS Opening Entry.')
			return false;
		}

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
									this.$rightSection ,
									this.customersList ,
									this.onSync.bind(this)
									)
	}
        init_selected_item(){
		this.selected_item_cart  = new pos_ar.PointOfSale.pos_selected_item_cart(
									this.$rightSection ,
									this.selectedItemMaps,
									this.selectedTab  ,
									this.selectedItem ,
									this.selectedField,
									item => {
										this.onSelectedItemClick(item)
									},
									tab =>{
										this.onClose_details();
									},
									(action , key) =>{
										this.onKeyPressed(action , key)
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
									this.selectedField,
									(event , field , value) =>{
										this.onInput(event , field , value);
									},
									this.onClose_details.bind(this)
								)
	}

        init_paymentCart(){
		console.log("im heeeeeeeeeeeeer @#$%^&*(*&^%$##$%^&*()^%$#@")
		this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
									this.$leftSection,
									this.selectedItemMaps,
									this.selectedTab,
									this.selectedPaymentMethod,
									this.onClose_payment_cart.bind(this),
									this.onCompleteOrder.bind(this)
								)
        }



        /*********************  callbacks functions ******************************/discount_percentage

	itemClick_selector(item){

		const itemCloned = { ...item }

		console.log("old ===> " , this.selectedItemMaps )

		console.log("updated ===> " , this.selectedItemMaps.get(this.selectedTab.tabName).has(itemCloned.name) )


		if(!this.selectedItemMaps.get(this.selectedTab.tabName).has(itemCloned.name)){
			itemCloned.quantity = 1 ;
			itemCloned.amount   = this.getItemPrice(itemCloned.name);
			this.selectedItemMaps.get(this.selectedTab.tabName).set( itemCloned.name , itemCloned )
		}
		else{
			const existingItem = this.selectedItemMaps.get(this.selectedTab.tabName).get(itemCloned.name);
			console.log("quantity ===> " , existingItem.quantity);
			existingItem.quantity += 1 ;
			this.selectedItemMaps.get(this.selectedTab.tabName).set( itemCloned.name , existingItem);
		}


		console.log("updated ===> " , this.selectedItemMaps )


		this.selected_item_cart.calculateNetTotal();
		this.selected_item_cart.calculateQnatity();
		this.selected_item_cart.calculateGrandTotal();
		this.selected_item_cart.refreshSelectedItem();


	}

	onSelectedItemClick(item){

		Object.assign(this.selectedItem , item)


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

	}

	onCheckout(){
		console.log("here we are on callback 02 " , this.item_details)

		//show
		this.payment_cart.showCart();

		//hide
		this.item_selector.hideCart();
		this.item_details.hide_cart();

		//change displayk
		this.payment_cart.calculateGrandTotal()
		this.selected_item_cart.setKeyboardOrientation("landscape");
		this.selected_item_cart.cleanHeighlight();
		this.selected_item_cart.showKeyboard();

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

		//show
		this.item_selector.showCart();

		//hide
		this.item_details.hide_cart();
		this.payment_cart.hideCart();

		//update ui
		this.selected_item_cart.setKeyboardOrientation("portrait");
		this.selected_item_cart.cleanHeighlight();
		this.selected_item_cart.hideKeyboard()

	}


	onInput( event , field , value){
		console.log("field : " , field)
		//console.log("item " , this.selectedItem )
		if(event == "focus" || event == "blur"){
			if(event == "focus")
				Object.assign(this.selectedField , {field_name : field})
			if(event == "blur")
				Object.assign(this.selectedField , {field_name : null})

			this.item_details.makeSelectedFieldHighlighted()
			this.selected_item_cart.makeSelectedButtonHighlighted();

			return;
		}

		if( field ==  "quantity" ){
			this.selectedItem.quantity = value;
			this.selectedItemMaps.get(this.selectedTab.tabName).set( this.selectedItem.name , Object.assign({},this.selectedItem) )
			//redrawing
			this.selected_item_cart.refreshSelectedItem();
		}
		else if( field ==  "rate" ){
			this.selectedItem.amount = value;
			this.selectedItemMaps.get(this.selectedTab.tabName).set( this.selectedItem.name , Object.assign({},this.selectedItem)  )
			//redrawing
			this.selected_item_cart.refreshSelectedItem();
		}
		else if( field == "discount_percentage"){

			//recalculate the rate
			let oldRate = this.getItemPrice(this.selectedItem.name);
			let montant = oldRate * (value / 100)
			let newRate = oldRate - montant

			console.log("old price : " , oldRate , "discount % : " , value , "discount montant : "  , montant , " new Price " , newRate )
			this.selectedItem.discount_percentage = value;
			this.selectedItem.discount_amount     = montant;
			this.selectedItem.amount              = newRate;

			this.selectedItemMaps.get(this.selectedTab.tabName).set( this.selectedItem.name , Object.assign({},this.selectedItem)  )
			//redrawing
			this.selected_item_cart.refreshSelectedItem();
			this.item_details.refreshDate(this.selectedItem);
		}
		else if( field == "discount_amount"){

			//recalculate the rate
			let oldRate = this.getItemPrice(this.selectedItem.name);
			let persent = ((value * 100) / oldRate).toFixed(2);
			let montant = value;

			//prevent negatif result
			if(persent > 100){
				persent = 100 ;
			}
			if(value > oldRate){
				montant = oldRate;
			}
			let newRate = oldRate - montant

			console.log("old price : " , oldRate , "discount % : " , persent , "discount montant : "  , montant , " new Price " , newRate )
			this.selectedItem.discount_percentage = persent;
			this.selectedItem.discount_amount     = montant;
			this.selectedItem.amount              = newRate;

			this.selectedItemMaps.get(this.selectedTab.tabName).set( this.selectedItem.name , Object.assign({},this.selectedItem)  )
			//redrawing
			this.selected_item_cart.refreshSelectedItem();
			this.item_details.refreshDate(this.selectedItem);

		}
	}

	onKeyPressed( action  , key){
		if(action == "quantity"){
			this.item_details.requestFocus("quantity")
		}
		else if(action == "rate"){
			this.item_details.requestFocus("rate")
		}
		else if(action == "discount"){
			this.item_details.requestFocus("discount")
		}
		else if(action == "remove"){
			this.selectedItemMaps.get(this.selectedTab.tabName).delete(this.selectedItem.name)
			this.selected_item_cart.refreshSelectedItem();
		}
		else if(action == "addToField"){
			this.item_details.addToField(this.selectedField.field_name , key)
		}
	}


	onCompleteOrder(){

		let items = []

		this.selectedItemMaps.get(this.selectedTab.tabName).forEach((value,key) =>{
			console.log("the key ==> " , key , " value ==> " , value)
			let newItem = {
				'item_name'           : value.name,
				'rate'                : value.amount,
				'qty'                 : value.quantity,
				'description'         : "empty",
				'discount_percentage' : value.discount_percentage,
				'discount_amount'     : value.discount_amount,
				'warehouse'           : this.PosProfileList[0].warehouse,
				'income_account'      : this.PosProfileList[0].income_account
			}

			items.push(newItem)
		})

		if(items.length ==0)
			return

		this.sellInvoices.set(
				this.selectedTab.tabName , {
				"customer"   : this.customersList[0].name,
				"pos_profile": this.PosProfileList[0].name,
				"items"      : items
		});

		this.selectedItemMaps.delete(this.selectedTab.tabName)

		//tabs
		let tabs = Array.from(this.selectedItemMaps.keys())

		//if there are still tabs it will just set the first as selected
		//otherwise it will create one using the selected_item_cart class and set it as selected
		if(tabs.length > 0){
			this.selectedTab.tabName = tabs[0]
			this.selected_item_cart.refreshTabs();
			this.selected_item_cart.refreshSelectedItem();
		}
		else{
			this.selected_item_cart.createNewTab();
		}

		this.onClose_payment_cart()

		console.log("posInvoice ==> " , this.sellInvoices);
	}


	onSync(){

		//calculate amount
		let all_tabs = Array.from(this.sellInvoices.keys())

		if(all_tabs.length == 0){
			frappe.throw('nothing to sync')
			return;

		}
		try{
			//progress
			frappe.show_progress('Syncing Invoices...' , 0 , all_tabs.length , 'syncing')

			let counter = 0 ;
			let failure = 0 ;
			let seccess = 0 ;

			all_tabs.forEach(tab =>{
				//calculate the paid_amount
				let paid_amount = 0 ;
				this.sellInvoices.get(tab).items.forEach(item =>{
					paid_amount += item.rate * item.qty
				})

				console.log("paid" , paid_amount)

				frappe.db.insert({
					'doctype'      : "POS Invoice",
					'customer'     : this.sellInvoices.get(tab).customer    ,
					'pos_profile'  : this.sellInvoices.get(tab).pos_profile ,
					'items'        : this.sellInvoices.get(tab).items       ,
					'paid_amount'  : paid_amount,
					'amount_eligible_for_commission' : paid_amount,
					'write_off_account': this.PosProfileList[0].write_off_account,
					'write_off_cost_center': this.PosProfileList[0].write_off_cost_center,
					'outstanding_amount' : 0 ,
					'is_pos'       : 1       ,
					'payments'     :[{
						'mode_of_payment' : 'Cash',
						'amount'          : paid_amount
					}],
					'update_stock' : 1       ,
					'docstatus'    : 1
				}).then(r => {
					this.sellInvoices.delete(tab)

					counter += 1 ;
					seccess += 1 ;

					frappe.show_progress('Syncing Invoices...' , counter , all_tabs.length , 'syncing')


					if(counter == all_tabs.length){
						frappe.hide_progress();
						if(failure == 0){
							frappe.show_alert({
									message:__(`Hi, Sync process is done ${seccess}/${counter}`),
									indicator:'green'
								},
								5);
						}
						else{
							frappe.throw(`Sync process : ${failure} out of ${counter}. Process incomplete.`)
						}
					}



				}).catch(err =>{
					counter += 1 ;
					failure += 1 ;
					console.log(err)
				})

			})
		}
		catch(err){
			console.log("err ==> " , err)
		}

		console.log("we are here now")
	}

	/****************************  listeners *******************************/

	setListeners(){
		console.log("test (window) ==> " , window)
		window.addEventListener('offline' , function(){
			frappe.msgprint('you lose the connection (offline mode)')
		})

		window.addEventListener('online' , function(){
			frappe.msgprint('the connection is back (online mode)')
		})
	}
	/*****************************  tools  **********************************/
	getItemPrice(itemId){
		const price = this.itemPrices.find(itemPrice => itemPrice.item_code == itemId)
		return price ? price.price_list_rate  : 0
        }

	checkServiceWorker(){

		// Check if service workers are supported
		if (!('serviceWorker' in navigator)) {
			console.log("Service Worker isn't supported!");
			return;
		}

		console.log("Service Worker supported");

		// Register the service worker on window load
 		window.addEventListener('DOMContentLoaded', () => {
		console.log("Window loaded!");
		navigator.serviceWorker
			.register('./sw.js')
			.then(reg => console.log("Service Worker registered successfully."))
			.catch(err => console.log(`Service Worker registration failed: ${err}`));
		});


		this.sw = new pos_ar.PointOfSale.Sw()

		// Additionally, check if DOM is already loaded
		if (document.readyState === 'complete') {
			console.log("DOM was already loaded");
			navigator.serviceWorker
				.register('../assets/pos_ar/public/js/sw.js')
				.then(reg => console.log("Service Worker registered successfully."))
				.catch(err => console.log(`Service Worker registration failed: ${err}`));
		}


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
                                fields: ['name', 'item_group_name' , 'parent_item_group' , 'is_group' ],
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
                                fields: ['name', 'item_name' , 'image' , 'item_group' , 'stock_uom' ],
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
                                fields  : ['name' , 'warehouse' , 'income_account' , 'write_off_account' , 'write_off_cost_center'],
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
