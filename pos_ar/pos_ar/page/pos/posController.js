
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
                this.selectedTab           = {"tabName"    : "C1"}
		this.selectedPaymentMethod = {"methodName" : ""}
		this.selectedCustomer      = {"name"       : ""}

		//sell invoice
		this.sellInvoices    = new Map();
		this.POSOpeningEntry = {}

		this.grandTotal = 0 ;
		this.paidAmount = 0 ;
		this.toChange   = 0 ;

                this.start_app();
        }

	 async start_app(){
		this.prepare_container();
		await  this.prepare_app_defaults();
		await  this.checkForPOSEntry()
                await  this.prepare_components();
		this.setListeners();
	}


	async refreshApp(){
		console.log("refresh")
		this.$components_wrapper.text('');
		await  this.checkForPOSEntry()
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


		if(this.PosProfileList.length == 0){
			frappe.set_route("Form", "POS Profile");
			return;
		}


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

	prepare_components(){
		this.set_right_and_left_sections();
		this.init_item_selector();
		this.init_customer_box();
		this.init_selected_item();
		this.init_item_details();
		this.init_paymentCart();
		this.init_historyCart();
	}

	async checkForPOSEntry(){

		try{
			const r = await frappe.db.get_list('POS Opening Entry' , {
					filters :{
						'pos_profile' : this.PosProfileList[0].name,
						'status'      : 'Open',
						'user'        : frappe.session.user
					},
					fields  : ['name' , 'pos_profile' ,'period_start_date' , 'company'],
					limit   : 1 // we only need the most recent one
				});
			if(r.length === 0){
				this.create_opening_voucher();
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




	create_opening_voucher() {
		const me = this;
		const table_fields = [
			{
				fieldname: "mode_of_payment",
				fieldtype: "Link",
				in_list_view: 1,
				label: "Mode of Payment",
				options: "Mode of Payment",
				reqd: 1,
			},
			{
				fieldname: "opening_amount",
				fieldtype: "Currency",
				in_list_view: 1,
				label: "Opening Amount",
				options: "company:company_currency",
				change: function () {
					dialog.fields_dict.balance_details.df.data.some((d) => {
						if (d.idx == this.doc.idx) {
							d.opening_amount = this.value;
							dialog.fields_dict.balance_details.grid.refresh();
							return true;
						}
					});
				},
			},
		];

		const fetch_pos_payment_methods = () => {
			const pos_profile = dialog.fields_dict.pos_profile.get_value();
			if (!pos_profile) return;
			frappe.db.get_doc("POS Profile", pos_profile).then(({ payments }) => {
				dialog.fields_dict.balance_details.df.data = [];
				payments.forEach((pay) => {
					const { mode_of_payment } = pay;
					dialog.fields_dict.balance_details.df.data.push({ mode_of_payment, opening_amount: "0" });
				});
				dialog.fields_dict.balance_details.grid.refresh();
			});
		};
		const dialog = new frappe.ui.Dialog({
			title: __("Create POS Opening Entry"),
			static: true,
			fields: [
				{
					fieldtype: "Link",
					label: __("Company"),
					default: frappe.defaults.get_default("company"),
					options: "Company",
					fieldname: "company",
					reqd: 1,
				},
				{
					fieldtype: "Link",
					label: __("POS Profile"),
					options: "POS Profile",
					fieldname: "pos_profile",
					reqd: 1,
					get_query: () => pos_profile_query(),
					onchange: () => fetch_pos_payment_methods(),
				},
				{
					fieldname: "balance_details",
					fieldtype: "Table",
					label: "Opening Balance Details",
					cannot_add_rows: false,
					in_place_edit: true,
					reqd: 1,
					data: [],
					fields: table_fields,
				},
			],
			primary_action: async function ({ company, pos_profile, balance_details }) {
				if (!balance_details.length) {
					frappe.show_alert({
						message: __("Please add Mode of payments and opening balance details."),
						indicator: "red",
					});
					return frappe.utils.play_sound("error");
				}

				// filter balance details for empty rows
				balance_details = balance_details.filter((d) => d.mode_of_payment);

				const method = "erpnext.selling.page.point_of_sale.point_of_sale.create_opening_voucher";
				const res = await frappe.call({
					method,
					args: { pos_profile, company, balance_details },
					freeze: true,
				});
				!res.exc && me.prepare_app_defaults(res.message);

				Object.assign(me.POSOpeningEntry    ,  {'name' : res.message.name , 'pos_profile' : res.message.pos_profile ,  'period_start_date' : res.message.period_start_date , 'company' : res.message.company } )

				dialog.hide();

			},
			primary_action_label: __("Submit"),
		});
		dialog.show();
		const pos_profile_query = () => {
			return {
				query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
				filters: { company: dialog.fields_dict.company.get_value() },
			};
		};
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
									this.onSync.bind(this),
									this.onClosePOS.bind(this),
									this.onHistoryClick.bind(this)
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
									this.grandTotal,
									this.paidAmount,
									this.toChange,
									this.onClose_payment_cart.bind(this),
									this.onCompleteOrder.bind(this),
									(event , field , value) =>{
										this.onInput(event , field , value);
									},
								)
        }

        init_historyCart(){
		console.log("im heeeeeeeeeeeeer @#$%^&*(*&^%$##$%^&*()^%$#@")
		this.history_cart = new pos_ar.PointOfSale.pos_history(
								)
        }



        /*********************  callbacks functions ******************************/


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
		this.selected_item_cart.hideKeyboard();

		//update ui
		this.selected_item_cart.setKeyboardOrientation("portrait");
		this.selected_item_cart.cleanHeighlight();

	}

	onHistoryClick(){

		//hide
		this.payment_cart.hideCart();
		this.item_details.hide_cart();
		this.item_selector.hideCart();
		this.selected_item_cart.hideCart();
		this.customer_box.hideActionBar();

	}

	onInput( event , field , value){
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

			this.selectedItem.discount_percentage = persent;
			this.selectedItem.discount_amount     = montant;
			this.selectedItem.amount              = newRate;

			this.selectedItemMaps.get(this.selectedTab.tabName).set( this.selectedItem.name , Object.assign({},this.selectedItem)  )
			//redrawing
			this.selected_item_cart.refreshSelectedItem();
			this.item_details.refreshDate(this.selectedItem);

		}
		else if( field == "cash"){

			

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
			this.item_details.requestFocus("discount_percentage")
		}
		else if(action == "remove"){
			this.selectedItemMaps.get(this.selectedTab.tabName).delete(this.selectedItem.name)
			this.selected_item_cart.refreshSelectedItem();
		}
		else if(action == "cash"){

		}
		else if(action == "addToField"){
			this.item_details.addToField(this.selectedField.field_name , key)
		}
	}


	onCompleteOrder(){

		let items = []

		this.selectedItemMaps.get(this.selectedTab.tabName).forEach((value,key) =>{
			// we still didnt implement the price_list_rate and base_price_list_rate
			// same thing with actual_qty refering to the stock quantity
			let newItem = {
				'item_name'               : value.name,
				'item_code'               : value.name,
				'rate'                    : value.amount,
				'qty'                     : value.quantity,
				'description'             : value.name,
				'image'                   : value.image,
				'expense_account'         : 'Cost of Goods Sold - MS',
				'use_serial_batch_fields' : 1,
				'discount_percentage'     : value.discount_percentage,
				'discount_amount'         : value.discount_amount,
				'warehouse'               : this.PosProfileList[0].warehouse,
				'income_account'          : this.PosProfileList[0].income_account,
				'item_tax_rate'           : {}
			}

			items.push(newItem)
		})

		if(items.length ==0)
			return

		this.sellInvoices.set(
				this.selectedTab.tabName , {
				"customer"   : this.customersList[0].name,
				"pos_profile": this.PosProfileList[0].name,
				"items"      : items,
				"creation_time": frappe.datetime.now_datetime()
		});

		this.customer_box.setNotSynced();

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

	}


	onSync(){


		if(this.POSOpeningEntry.name == '' ){
			this.checkForPOSEntry();
			return;
		}


		//calculate amount
		let all_tabs = Array.from(this.sellInvoices.keys())

		if(all_tabs.length == 0){

			// with options
			frappe.msgprint({
				title: __('Sync Complete'),
				indicator: 'green',
				message: __('All data is already synchronized.')
			});
			return;

		}

		//progress
		frappe.show_progress('Syncing Invoices...' , 0 , all_tabs.length , 'syncing')

		let counter     = 0  ;
		let failure     = 0  ;
		let seccess     = 0  ;
		let invoicesRef = [] ;

		all_tabs.forEach(tab =>{
			//calculate the paid_amount
			let paid_amount = 0 ;
			let totalQty    = 0 ;
			this.sellInvoices.get(tab).items.forEach(item =>{
				totalQty    += item.qty
				paid_amount += item.rate * item.qty
			})

			// we still didnt implement the  base_paid_amount and amount_eligible_for_commission
			//_seen  value in deafault pos ==>  ["Administrator"]. i think it is an array.
			frappe.db.insert({
				'doctype'      : "POS Invoice",
				'customer'     : this.sellInvoices.get(tab).customer    ,
				'pos_profile'  : this.sellInvoices.get(tab).pos_profile ,
				'items'        : this.sellInvoices.get(tab).items       ,
				'creation_time': this.sellInvoices.get(tab).creation_time,
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

				invoicesRef.push({'pos_invoice' : r.name , 'customer' : r.customer } )
				this.sellInvoices.delete(tab)

				counter += 1 ;

				frappe.show_progress('Syncing Invoices...' , counter , all_tabs.length , 'syncing')

				if(counter == all_tabs.length){
					frappe.hide_progress();
					this.customer_box.setSynced();
				}


			}).catch(err =>{
				counter += 1 ;
				failure += 1 ;
			})

		})
	}



	onClosePOS(){

		let all_tabs = Array.from(this.sellInvoices.keys())
		//check if you still have an invoice to sync
		if(all_tabs.length > 0){
			frappe.throw(__(`you have ${all_tabs.length} invoice to sync first.`))
		}

		//otherwise you can close the voucher
		let voucher               = frappe.model.get_new_doc("POS Closing Entry");
		voucher.pos_opening_entry = this.POSOpeningEntry.name;
		voucher.pos_profile       = this.POSOpeningEntry.pos_profile;
		voucher.company           = this.POSOpeningEntry.company ;
		voucher.user              = frappe.session.user  ;
		voucher.posting_date      = frappe.datetime.now_date();
		voucher.posting_time      = frappe.datetime.now_time();


		frappe.set_route("Form", "POS Closing Entry", voucher.name);

		//delete the open entry because you create the closing entr,
		//that my the user submited it, so when the code find its name empty,
		//it will try to fetch an open pos entry if there is no one opening,
		//it will force the user to create one.
		this.POSOpeningEntry.name = ''


	}


	/****************************  listeners *******************************/

	setListeners(){
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
			return;
		}


		// Register the service worker on window load
 		window.addEventListener('DOMContentLoaded', () => {
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
                                filters: { disabled : 0 }
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
                                filters : { disabled : 0}
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
                                filters : { },
				limit   : 1
                        })
                }
                catch(error){
                        console.error('Error fetching Bin list : ' , error)
                        return [];
                }
        }

};
