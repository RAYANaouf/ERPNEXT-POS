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
                this.warehouseList     = []
                this.PosProfileList    = []
                this.binList           = []

                this.selectedItemMaps  = new Map()

                this.selectedItem               = {"name"       : ""   }
                this.selectedField              = {"field_name" : ""   }
                this.selectedTab                = {"tabName"    : ""   }
		this.selectedPaymentMethod      = {"methodName" : ""   }
		this.defaultCustomer            = {"name"       : "" , "customer_name" : ""}
		this.selectedPosProfile         = {"name"       : ""   }
		this.defaultPriceList           = {"name"       : ""   }
		this.taxes_and_charges_template = null;
		this.taxes_and_charges          = [];

		//sell invoice
		this.POSOpeningEntry = {}

		this.invoiceData = { netTotal : 0 , grandTotal : 0 , paidAmount : 0 , toChange : 0 , discount : 0}
		this.db          = null;



		//test
		this.sw = new pos_ar.PointOfSale.Sw()

                this.start_app();
        }

	 async start_app(){
		try{
			//init db
			this.db            = await pos_ar.PointOfSale.pos_db.openDatabase();
			//data classes
			this.settings_data = new pos_ar.PointOfSale.posSettingsData(this.db)
			//api fetch handler
			this.dataHandler   = new pos_ar.PointOfSale.FetchHandler()
			//local app data
			this.appData       = new pos_ar.PointOfSale.posAppData(this.db , this.dataHandler)

			this.prepare_container();
			//prepare app data
			await  this.prepare_app_data();

			//proceed with other initialization only if app data are set correctly
			await  this.checkForPOSEntry()
			await  this.prepare_components();
			this.checkUnSyncedPos();
			this.setListeners();
		}catch(err){
			console.error("halfware POS Err ==> " , err)
		}
	}

	async prepare_app_data(){
		try{
			this.customersList    = await this.dataHandler.fetchCustomers()
			this.brandsList       = await this.dataHandler.fetchBrands()
			this.itemGroupList    = await this.dataHandler.fetchItemGroups()
        	        this.itemList         = await this.dataHandler.fetchItems()
        	        this.itemPrices       = await this.dataHandler.fetchItemPrice()
			this.priceLists       = await this.dataHandler.fetchPriceList()
			this.warehouseList    = await this.dataHandler.fetchWarehouseList()
			this.PosProfileList   = await this.dataHandler.fetchPosProfileList()
			this.binList          = await this.dataHandler.fetchBinList()
			await this.handleAppData();

			console.log("the app data : ",this.itemList)

			let new_pos_invoice = frappe.model.get_new_doc('POS Invoice');
			new_pos_invoice.customer          = this.defaultCustomer.name
			new_pos_invoice.pos_profile       = this.selectedPosProfile.name
			new_pos_invoice.items             = [];
			new_pos_invoice.taxes_and_charges = this.selectedPosProfile.taxes_and_charges
			new_pos_invoice.additional_discount_percentage = this.invoiceData.discount
			new_pos_invoice.paid_amount       = 0
			new_pos_invoice.base_paid_amount  = 0
			new_pos_invoice.creation_time     = frappe.datetime.now_datetime()
			new_pos_invoice.payments          = [{'mode_of_payment' : 'Cash' , 'amount' : 0}]
			new_pos_invoice.is_pos            = 1
			new_pos_invoice.update_stock      = 1
			new_pos_invoice.docstatus         = 0
			new_pos_invoice.status            = 'Draft'
			new_pos_invoice.priceList         = this.defaultPriceList.name

			this.selectedItemMaps.set("C1" , new_pos_invoice)
			this.selectedTab.tabName = `C1`
		}catch(err){
			console.error("Hlafware POS Error ==> " , err)
			throw err;
		}
        }


	async handleAppData(){
		//check pos profile
		if(this.PosProfileList.length == 0){
			frappe.set_route("Form", "POS Profile");
			throw new Error("there is no pos profile")
		}
		//set default val
		Object.assign(this.selectedPosProfile , this.PosProfileList[0])
		//check takes and get it if it exist on pos profile
		if(this.selectedPosProfile.taxes_and_charges != null){
			this.taxes_and_charges_template = await this.dataHandler.fetchSalesTaxesAndChargesTemplate(this.selectedPosProfile.taxes_and_charges)
			this.taxes_and_charges = this.taxes_and_charges_template.taxes
		}
		//check company and get it if it exist on pos profile
		if(this.selectedPosProfile.company != null && this.selectedPosProfile.company != ''){
			this.company = await this.dataHandler.fetchCompany(this.selectedPosProfile.company)
		}

		//check customer
		if(this.customersList.length > 0){
			this.defaultCustomer = structuredClone(this.customersList[0])
		}else{
			frappe.warn(
					'You dont have a customer',
					'please create a customer to continue',
					()=>{
						frappe.set_route("Form", "Customer");
					},
					'Create',
					false
			)
			throw new Error("there is no customer")
		}
		//check price list
		if(this.priceLists.length > 0){
			this.defaultPriceList.name = this.selectedPosProfile.selling_price_list
		}else{
			frappe.warn(
					'You dont have a single price list',
					'please create a priceList to continue',
					()=>{
						frappe.set_route("Form", "Price List");
					},
					'Create',
					false
			)
			throw new Error("there is no price list")
		}
	}

        /***********************  ui ******************************************/

        prepare_container(){
                //append css styles
                this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/selectorBox.css">')
                this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/checkInOutCart.css">')
                this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/itemDetailsCart.css">')
                this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/paymentMethodCart.css">')
                this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/customerBox.css">')
                this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/cartBox.css">')
                this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/historyCarts.css">')

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
		this.init_checkInOutCart();
		this.init_settingsCart();
	}

	async checkForPOSEntry(){
		try{
			const r = await frappe.db.get_list('POS Opening Entry' , {
					filters :{
						'pos_profile' : this.selectedPosProfile.name,
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
				!res.exc && me.prepare_app_data(res.message);

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

                this.item_selector = new pos_ar.PointOfSale.pos_item_selector(
						this.$leftSection      ,
						this.itemList          ,
						this.itemGroupList     ,
						this.itemPrices        ,
						this.defaultPriceList  ,
						this.getItemPrice.bind(this),
						item => { this.itemClick_selector(item)  }
					)
	}

	init_customer_box(){
		this.customer_box  = new pos_ar.PointOfSale.pos_customer_box(
									this.$rightSection ,
									this.customersList    ,
									this.defaultCustomer ,
									this.backHome.bind(this),
									this.onSync.bind(this),
									this.saveCheckInOut.bind(this),
									this.onMenuClick.bind(this)
								)
	}
        init_selected_item(){
		this.selected_item_cart  = new pos_ar.PointOfSale.pos_selected_item_cart(
									this.$rightSection    ,
									this.settings_data    ,
									this.selectedItemMaps ,
									this.priceLists       ,
									this.customersList    ,
									this.brandsList       ,
									this.taxes_and_charges,
									this.invoiceData      ,
									this.selectedTab      ,
									this.selectedItem     ,
									this.selectedField    ,
									this.getItemPrice.bind(this),
									item => {
										this.onSelectedItemClick(item)
									},
									tab =>{
										this.onClose_details();
									},
									(action , key) =>{
										this.onKeyPressed(action , key)
									},
									this.createNewTab.bind(this),
									this.onCheckout.bind(this)
								)
	}

	init_item_details(){
		this.item_details = new pos_ar.PointOfSale.pos_item_details(
									this.$leftSection,
									this.selectedPosProfile.warehouse,
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
		this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
									this.$leftSection,
									this.selectedItemMaps,
									this.selectedTab,
									this.selectedPaymentMethod,
									this.invoiceData,
									this.onClose_payment_cart.bind(this),
									this.onCompleteOrder.bind(this),
									(event , field , value) =>{
										this.onInput(event , field , value);
									},
								)
        }

        init_historyCart(){
		this.history_cart = new pos_ar.PointOfSale.pos_history(
									this.wrapper,
									this.db,
									this.selectedPosProfile,
									this.company,
									this.taxes_and_charges,
									this.historyCartClick.bind(this)
								)
        }

        init_checkInOutCart(){
		this.check_in_out_cart = new pos_ar.PointOfSale.pos_check_in_out(
									this.wrapper,
									this.db
								)
        }


        init_settingsCart(){
		this.settings_cart = new pos_ar.PointOfSale.pos_settings(
									this.wrapper,
									this.settings_data,
									this.PosProfileList,
									this.selectedPosProfile,
									this.onSettingsChange.bind(this)
								)
        }



        /*********************  callbacks functions ******************************/


	itemClick_selector(item){
		const  itemCloned = structuredClone(item);
		itemCloned.discount_amount     = 0;
		itemCloned.discount_percentage = 0;
		this.addItemToPosInvoice( item )

		this.selected_item_cart.calculateNetTotal();
		this.selected_item_cart.calculateVAT();
		this.selected_item_cart.calculateQnatity();
		this.selected_item_cart.calculateGrandTotal();
		this.selected_item_cart.refreshSelectedItem();
	}

	onSelectedItemClick(item){
		this.selectedItem = structuredClone(item)
		//show
		this.item_details.show_cart();
		this.selected_item_cart.showKeyboard();
		//close
		this.item_selector.hideCart();
		this.payment_cart.hideCart();
		this.settings_cart.hideCart();
		//change display
		this.selected_item_cart.setKeyboardOrientation("landscape");
		//refresh data
		this.item_details.refreshDate(item);
	}

	saveCheckInOut(checkInOut){
		this.appData.saveCheckInOut(
			checkInOut,
			(res)=>{
				console.log('res : ' , res)
				this.check_in_out_cart.getAllCheckInOut();
			},(err)=>{
				console.log('err to save checkInOut : ' , err)
			}
		)
	}


	onSettingsChange(settingName){
		if(settingName == "itemPriceBasedOn"){
			//refreshing selected_item_cart and item_selector_cart
			this.item_selector.refreshItemSelector();
		}
	}


	onCheckout(){
		if(this.checkIfRateZero(this.selectedItemMaps.get(this.selectedTab.tabName))){
			frappe.throw("Item with rate equal 0")
			return ;
		}
		this.selectedItemMaps.get(this.selectedTab.tabName).synced = false ;
		this.appData.savePosInvoice(this.selectedItemMaps.get(this.selectedTab.tabName))
		//show
		this.payment_cart.showCart();
		//hide
		this.item_selector.hideCart();
		this.item_details.hide_cart();
		this.settings_cart.hideCart();
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
		this.payment_cart.hideCart() ;
		this.item_details.hide_cart();
		this.selected_item_cart.hideKeyboard();
		this.settings_cart.hideCart();
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
		this.settings_cart.hideCart();
		//update ui
		this.selected_item_cart.setKeyboardOrientation("portrait");
		this.selected_item_cart.cleanHeighlight();
	}

	onMenuClick(menu){
		if(menu == 'recent_pos'){
			//show
			this.history_cart.show_cart()
			this.customer_box.showHomeBar();
			//hide
			this.payment_cart.hideCart();
			this.item_details.hide_cart();
			this.item_selector.hideCart();
			this.selected_item_cart.hideCart();
			this.customer_box.hideSyncBar();
			this.settings_cart.hideCart();
			this.check_in_out_cart.hideCart();
		}
		else if(menu == 'close_pos'){
			this.onClosePOS()
		}
		else if(menu == 'settings'){
			//show settings
			this.settings_cart.showCart()
			this.customer_box.showHomeBar();
			//hide
			this.item_selector.hideCart();
			this.selected_item_cart.hideCart();
			this.item_details.hide_cart() ;
			this.payment_cart.hideCart()  ;
			this.history_cart.hide_cart() ;
			this.check_in_out_cart.hideCart();
			//hide section
			this.customer_box.hideSyncBar();
		}
		else if(menu == 'checkInOut'){
			//show
			this.check_in_out_cart.showCart();
			this.customer_box.showHomeBar();

			//hide
			this.item_selector.hideCart();
			this.selected_item_cart.hideCart();
			this.item_details.hide_cart() ;
			this.payment_cart.hideCart()  ;
			this.history_cart.hide_cart() ;
			this.settings_cart.hideCart() ;
			//hide section
			this.customer_box.hideSyncBar();
		}
	}

	backHome(){
		//show
		this.item_selector.showCart()      ;
		this.customer_box.showSyncBar()    ;
		this.selected_item_cart.showCart() ;

		//hide
		this.payment_cart.hideCart()   ;
		this.customer_box.hideHomeBar();
		this.item_details.hide_cart()  ;
		this.history_cart.hide_cart()  ;
		this.settings_cart.hideCart()  ;
		this.check_in_out_cart.hideCart();
	}

	createNewTab(counter){
		let new_pos_invoice = frappe.model.get_new_doc('POS Invoice');
		new_pos_invoice.customer          = this.defaultCustomer.name
		new_pos_invoice.pos_profile       = this.selectedPosProfile.name
		new_pos_invoice.items             = [];
		new_pos_invoice.taxes_and_charges = this.selectedPosProfile.taxes_and_charges
		new_pos_invoice.additional_discount_percentage = this.invoiceData.discount
		new_pos_invoice.paid_amount       = 0
		new_pos_invoice.base_paid_amount  = 0
		new_pos_invoice.creation_time     = frappe.datetime.now_datetime()
		new_pos_invoice.payments          = [{'mode_of_payment' : 'Cash' , 'amount' : 0}]
		new_pos_invoice.is_pos            = 1
		new_pos_invoice.update_stock      = 1
		new_pos_invoice.docstatus         = 0
		new_pos_invoice.status            = 'Draft'
		new_pos_invoice.priceList         = this.defaultPriceList.name


		this.selectedItemMaps.set(`C${counter}` , new_pos_invoice)
		this.selectedTab.tabName = `C${counter}`

	}


	historyCartClick(event , message){
		//go back to edit pos draft
		if(event == 'edit'){
			const tab = this.selected_item_cart.createTabForEditPOS()

			this.selectedItemMaps.set(`C${tab}` , message)
			this.selectedTab.tabName = `C${tab}`

			//show
			this.item_selector.showCart();
			this.customer_box.showHomeBar();
			this.selected_item_cart.showCart()

			//hide
			this.item_details.hide_cart() ;
			this.payment_cart.hideCart()  ;
			this.history_cart.hide_cart() ;
			this.settings_cart.hideCart();

			//refresh the data :
			this.selected_item_cart.refreshTabs()
                        this.selected_item_cart.refreshSelectedItem()
		}
		else if(event == 'return'){
			this.backHome();
		}
	}

	onInput( event , field , value){


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
			this.selectedItem.qty = parseFloat(value);
			this.editPosItemQty(this.selectedItem.name , this.selectedItem.qty);

			//redrawing
			this.selected_item_cart.refreshSelectedItem();
		}
		else if( field ==  "rate" ){
			this.selectedItem.rate = parseFloat(value);

			//recalculate the rate
			let oldRate = this.selectedItem.rate;
			let persont = this.selectedItem.discount_percentage
			let montant = oldRate * (persont / 100)

			this.selectedItem.discount_percentage = persont;
			this.selectedItem.discount_amount     = montant;

			this.editPosItemDiscountAmount(this.selectedItem.name , this.selectedItem.discount_amount);
			this.editPosItemRate(this.selectedItem.name , this.selectedItem.rate);

			//redrawing
			this.selected_item_cart.refreshSelectedItem();
			this.item_details.refreshDate(this.selectedItem);

		}
		else if( field == "discount_percentage"){

			//recalculate the rate
			let oldRate = this.selectedItem.rate;
			let montant = oldRate * (parseFloat(value) / 100)

			this.selectedItem.discount_percentage = parseFloat(value);
			this.selectedItem.discount_amount     = montant;

			this.editPosItemDiscountAmount(this.selectedItem.name , this.selectedItem.discount_amount);
			this.editPosItemDiscountPercentage(this.selectedItem.name ,  this.selectedItem.discount_percentage);

			//redrawing
			this.selected_item_cart.refreshSelectedItem();
			this.item_details.refreshDate(this.selectedItem);
		}
		else if( field == "discount_amount"){

			//recalculate the rate
			let oldRate = this.selectedItem.rate;
			let persent = ((parseFloat(value) * 100) / oldRate).toFixed(2);
			let montant = parseFloat(value);

			//prevent negatif result
			if(persent > 100){
				persent = 100 ;
			}
			if(parseFloat(value) > oldRate){
				montant = oldRate;
			}

			this.selectedItem.discount_percentage = parseFloat(persent);
			this.selectedItem.discount_amount     = montant;

			this.editPosItemDiscountAmount(this.selectedItem.name , this.selectedItem.discount_amount);
			this.editPosItemDiscountPercentage(this.selectedItem.name , this.selectedItem.discount_percentage);

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
			this.item_details.requestFocus("discount_percentage")
		}
		else if(action == "remove"){
			this.deleteItemFromPOsInvoice(this.selectedItem.name)
			this.selected_item_cart.refreshSelectedItem();
			this.onClose_details()
		}
		else if(action == "delete"){

			let newValue =  parseFloat(this.item_details.deleteCharacter())

			if(this.selectedField.field_name == "quantity"){
				this.selectedItem.qty = newValue;
				const posItems = this.selectedItemMaps.get(this.selectedTab.tabName)
			}
			else if(this.selectedField.field_name == "rate"){

				this.selectedItem.rate = newValue;
				const posItems = this.selectedItemMaps.get(this.selectedTab.tabName)

				//recalculate the rate
				let oldRate = this.selectedItem.rate;
				let persont = this.selectedItem.discount_percentage
				let montant = oldRate * (persont / 100)

				this.selectedItem.discount_amount     = montant;

			}
			else if(this.selectedField.field_name == "discount_percentage"){
				//recalculate the rate
				let oldRate = this.selectedItem.rate;
				let montant = oldRate * (newValue / 100)

				this.selectedItem.discount_percentage = newValue;
				this.selectedItem.discount_amount     = montant;

			}
			else if(this.selectedField.field_name == "discount_percentage"){
				//recalculate the rate
				let oldRate = this.selectedItem.rate;
				let montant = oldRate * (newValue / 100)

				//asign the values to the selectedItem refrence
				this.selectedItem.discount_percentage = newValue;
				this.selectedItem.discount_rate       = montant;

			}
			else if(this.selectedField.field_name == "cash"){
				this.payment_cart.deleteKeyPress();
			}



		}
		else if(action == "addToField"){

			if(this.selectedField.field_name == "cash"){
				this.payment_cart.handleInput(key);
			}
			else{

				if( this.selectedField.field_name ==  "quantity" ){
					const newVal = this.selectedItem.qty + key
					this.selectedItem.qty = parseFloat(newVal);
				}
				else if( this.selectedField.field_name ==  "rate" ){
					const newVal = this.selectedItem.rate + key
					this.selectedItem.rate = parseFloat(newVal);

				}
				else if( this.selectedField.field_name ==  "discount_percentage" ){
					//recalculate the rate
					let oldRate        = this.selectedItem.rate;
					let old_percentage = this.selectedItem.discount_percentage ?? 0;
					let input          = `${old_percentage}` + key ;
					let discount_percentage = parseFloat(input);
					if(discount_percentage > 100){
						discount_percentage = 100;
					}
					let montant = oldRate * ( discount_percentage / 100)
					let newRate = oldRate - montant


					this.selectedItem.discount_percentage = (discount_percentage);
					this.selectedItem.discount_amount     = montant;

				}

			}


		}

		//update the posInvoice
		this.editPosItemDiscountAmount(this.selectedItem.name , this.selectedItem.discount_amount);
		this.editPosItemRate(this.selectedItem.name , this.selectedItem.rate);
		this.editPosItemQty(this.selectedItem.name , this.selectedItem.qty);

		//update the ui
		this.selected_item_cart.refreshSelectedItem()
		this.item_details.refreshDate(this.selectedItem);


	}


	onCompleteOrder(){
		//check if they set a customer
		if(this.defaultCustomer.name == ""){
			frappe.warn(
					'Customer didnt selected!',
					'you have to select a customer',
					()=>{
					},
					'Done',
					false
			)
			return ;
		}
		let items = []
		this.selectedItemMaps.get(this.selectedTab.tabName).items.forEach(  item  =>{
			// we still didnt implement the price_list_rate and base_price_list_rate
			// same thing with actual_qty refering to the stock quantity
			let newItem = {
				'item_name'               : item.name,
				'item_code'               : item.name,
				'rate'                    : item.rate,
				'qty'                     : item.qty,
				'description'             : item.name,
				'image'                   : item.image,
				'use_serial_batch_fields' : 1,
				'cost_center'             : this.selectedPosProfile.cost_center,
				'discount_percentage'     : item.discount_percentage,
				'discount_amount'         : item.discount_amount,
				'warehouse'               : this.selectedPosProfile.warehouse,
				'income_account'          : this.selectedPosProfile.income_account,
			}
			items.push(newItem)
		})
		this.selectedItemMaps.get(this.selectedTab.tabName).items = items
		if(items.length ==0)
			return

		this.selectedItemMaps.get(this.selectedTab.tabName).paid_amount       = this.invoiceData.paidAmount
		this.selectedItemMaps.get(this.selectedTab.tabName).base_paid_amount  = this.invoiceData.paidAmount
		this.selectedItemMaps.get(this.selectedTab.tabName).payments          = [{'mode_of_payment' : 'Cash' , 'amount' : this.invoiceData.paidAmount}]
		this.selectedItemMaps.get(this.selectedTab.tabName).docstatus         = 1

		//set status
		const status = this.checkIfPaid(this.selectedItemMaps.get(this.selectedTab.tabName))
		this.selectedItemMaps.get(this.selectedTab.tabName).status            = status

		//copy the pos is important otherwise it will deleted and the selectedTab change and then it will save the
		//wrong one. because insert take a while after the callback will called.
		const pos = structuredClone(this.selectedItemMaps.get(this.selectedTab.tabName))
		console.log("sync : " , pos)


		if(status == 'Unpaid'){
			pos.synced = true
			frappe.db.insert(
				pos
			).then(r =>{
				this.appData.updatePosInvoice(pos)
			}).catch(err=>{
				console.log("cant push pos invoice : " , err);
			})
		}
		else{
			pos.synced = false ;
			this.appData.updatePosInvoice(pos)
			this.unsyncedPos += 1 ;
			this.customer_box.setNotSynced(this.unsyncedPos);
		}
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

		//check if there is a pos to sync
		if(this.unsyncedPos == 0){
			// with options
			frappe.msgprint({
				title: __('Sync Complete'),
				indicator: 'green',
				message: __('All data is already synchronized.')
			});
			return;
		}

		let counter     = 0  ;
		let failure     = 0  ;
		let seccess     = 0  ;

		this.appData.getNotSyncedPos(
			(allUnsyncedPos) =>{
				//create progress bar
				frappe.show_progress('Syncing Invoices...' , 0 , allUnsyncedPos.length , 'syncing')
				allUnsyncedPos.forEach(pos=>{
					// we still didnt implement the  base_paid_amount and amount_eligible_for_commissionseen
					// value in deafault pos ==>  ["Administrator"]. i think it is an array.
					frappe.db.insert(
						pos
					).then(r =>{
						const updatedPos = structuredClone(pos)
						updatedPos.synced = true;
						this.appData.updatePosInvoice(updatedPos)
						counter += 1 ;
						frappe.show_progress('Syncing Invoices...' , counter , allUnsyncedPos.length , 'syncing')
						//if the last pos save seccessfully then hide the progress bar
						if(counter == allUnsyncedPos.length){
							frappe.hide_progress();
							this.customer_box.setSynced();
							this.unsyncedPos = 0;
						}
					}).catch(err =>{
						counter += 1 ;
						failure += 1 ;
					})
				})
			},
			(err) =>{
				console.log("cant get the unseced POS from local")
			}
		);


	}


	checkIfPaid(pos){

		let netTotal   = 0 ;
		let grandTotal = 0 ;
		let allTaxes   = 0 ;
		let discount   = 0 ;

		//net total
		pos.items.forEach( item => {
			netTotal += item.qty * item.rate
		})

		this.taxes_and_charges.forEach(tax =>{
			allTaxes += (tax.rate / 100) * netTotal
		})

		//discount
		discount = (pos.additional_discount_percentage / 100) * netTotal

		grandTotal  = netTotal + allTaxes - discount

		if(pos.paid_amount == 0){
			return "Unpaid"
		}
		else if(pos.paid_amount < grandTotal){
			return "Unpaid"
		}
		else{
			return "Paid"
		}

	}


	checkIfRateZero(pos){
		return pos.items.some(item => item.rate == 0)
	}


	onClosePOS(){
		//check if you still have an invoice to sync
		if(this.unsyncedPos > 0){
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


		this.check_in_out_cart.checkList.forEach(check =>{
			let child = frappe.model.add_child(voucher , 'check_in_out' , 'custom_check_in_out' )
			child.check_type    = check.check_type
			child.creation_time = check.creation_time
			child.amount        = check.amount
			child.reason        = check.reason
			child.user          = check.owner
		})

		frappe.set_route("Form", "POS Closing Entry", voucher.name);
		//delete the open entry because you create the closing entr,
		//that my the user submited it, so when the code find its name empty,
		//it will try to fetch an open pos entry if there is no one opening,
		//it will force the user to create one.
		this.POSOpeningEntry.name = '' ;
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
	getItemPrice(item , priceList){
		console.log("debug getItemPrice function : " , item , priceList)
		//check the mode
		const mode = this.settings_data.settings.itemPriceBasedOn
		if(mode == 'brand'){
			if(item.brand == null)
				return 0 ;
			const price = this.itemPrices.find(itemPrice => itemPrice.brand == item.brand && itemPrice.price_list == priceList)
			return price ? price.price_list_rate  : 0
		}else if(mode == 'priceList'){
			const price = this.itemPrices.find(itemPrice => itemPrice.item_code == item.item_name && itemPrice.price_list == priceList)
			return price ? price.price_list_rate  : 0
		}
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
			navigator.serviceWorker
				.register('../assets/pos_ar/public/js/sw.js')
				.then(reg => console.log("Service Worker registered successfully."))
				.catch(err => console.log(`Service Worker registration failed: ${err}`));
		}


	}

	checkUnSyncedPos(){
		this.appData.getNotSyncedPosNumber(
			(result)=>{
				console.log(`there are ${result} POS to sync`)
				this.unsyncedPos = result
				if(this.unsyncedPos == 0){
					this.customer_box.setSynced(result);
				}
				else{
					this.customer_box.setNotSynced(result);
				}
			},
			(err)=>{
				console.log(`error occured when check unSynced POS : ${err} `)
			}
		)
	}

	addItemToPosInvoice( clickedItem ){
		let clonedItem = {} ;
		Object.assign(clonedItem , clickedItem)

		const posInvoice = this.selectedItemMaps.get(this.selectedTab.tabName);
		const posItems   = posInvoice.items;

		let exist = false ;

		posItems.forEach(item => {
			if(item.name == clickedItem.name){
				exist = true;
				item.qty += 1 ;
			}
		})

		if(!exist){
			clonedItem.discount_amount     = 0 ;
			clonedItem.discount_percentage = 0 ;
			clonedItem.qty                 = 1 ;
			clonedItem.rate                = this.getItemPrice(clickedItem , this.selectedItemMaps.get(this.selectedTab.tabName).priceList);
			posItems.push(clonedItem)
		}


	}

	deleteItemFromPOsInvoice( itemId ){
		const posInvoice = this.selectedItemMaps.get(this.selectedTab.tabName);
		const posItems   = posInvoice.items ;

		posInvoice.items  = posItems.filter( item => item.name != itemId )

		this.selectedItem = structuredClone({ name : ""})
	}

	editPosItemQty(itemName , qty){
		let items = this.selectedItemMaps.get(this.selectedTab.tabName).items
		items.forEach(item => {
			if(item.name == itemName){
				item.qty = qty
			}
		})
	}
	editPosItemRate(itemName , rate){
		let items = this.selectedItemMaps.get(this.selectedTab.tabName).items
		items.forEach(item => {
			if(item.name == itemName){
				item.rate = rate
			}
		})
	}
	editPosItemDiscountPercentage(itemName , discountPercentage){
		let items = this.selectedItemMaps.get(this.selectedTab.tabName).items
		items.forEach(item => {
			if(item.name == itemName){
				item.discount_percentage = discountPercentage
			}
		})
	}
	editPosItemDiscountAmount(itemName , discountAmount){
		let items = this.selectedItemMaps.get(this.selectedTab.tabName).items
		items.forEach(item => {
			if(item.name == itemName){
				item.discount_amount = discountAmount
			}
		})
	}


};
