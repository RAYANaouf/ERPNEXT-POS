pos_ar.PointOfSale.Controller = class {
        constructor(wrapper) {
		//principales variable
	        this.wrapper = $(wrapper).find(".layout-main-section");
	        this.page    = wrapper.page ;


	        this.selectedItemMaps  = new Map()

	        this.selectedItem               = {"name"       : ""   }
        	this.selectedField              = {"field_name" : ""   }
  		this.selectedTab                = {"tabName"    : ""   }
		this.selectedPaymentMethod      = {"methodName" : ""   }
		this.defaultCustomer            = {"name"       : "" , "customer_name" : ""}
		this.defaultPriceList           = {"name"       : ""   }
		this.taxes_and_charges_template = null;
		this.taxes_and_charges          = [];
		this.payment_methods            = []

		//sell invoice
		this.POSOpeningEntry = {}

		this.invoiceData = { netTotal : 0 , grandTotal : 0 , paidAmount : 0 , toChange : 0 , discount : 0}
		this.db          = null;

		this.syncInput = false


		frappe.db.get_list('Customer' , {
			filters : { custom_company : 'Optilens BISKRA' } ,
			fields  : ['name'],
		}).then( record => {
				console.log(" customers ::: " ,record)
		})



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
			await this.appData.getAllData()
			
			//init screen manager
			this.screenManager = new pos_ar.PointOfSale.ScreenManager(this.settings_data);

			this.toggleKeyboardMode(!this.settings_data.settings.showItemDetails);

			this.prepare_container();
			//prepare app data
			await  this.prepare_app_data();

			//proceed with other initialization only if app data are set correctly
			await  this.checkForPOSEntry()
			await  this.prepare_components();
			this.checkUnSyncedPos();
			this.setListeners();

			const openedPos = await this.appData.getAllOpenedPosInvoice()
			this.restorePosInvoices(openedPos)

		}catch(err){
			console.error("halfware POS Err ==> " , err)
		}
	}

	async prepare_app_data(){
		try{

			await this.handleAppData();


			let priceList = this.getCustomerDefaultPriceList(this.defaultCustomer.name)
			if( priceList == "" || priceList  == null || priceList  == undefined){
				priceList = this.defaultPriceList.name
			}


			let new_pos_invoice               = frappe.model.get_new_doc('POS Invoice');
			new_pos_invoice.customer          = this.defaultCustomer.name
			new_pos_invoice.pos_profile       = this.appData.appData.pos_profile.name
			new_pos_invoice.items             = [];
			new_pos_invoice.taxes_and_charges = this.appData.appData.pos_profile.taxes_and_charges
			new_pos_invoice.additional_discount_percentage = 0
			new_pos_invoice.paid_amount       = 0
			new_pos_invoice.base_paid_amount  = 0
			new_pos_invoice.creation_time     = frappe.datetime.now_datetime()
			new_pos_invoice.payments          = this.getPaymentMethods()
			new_pos_invoice.is_pos            = 1
			new_pos_invoice.update_stock      = 1
			new_pos_invoice.docstatus         = 0
			new_pos_invoice.status            = 'Draft'
			new_pos_invoice.priceList         = priceList
			new_pos_invoice.opened            = 1
			//build refNm   posProfile-date-time
			const date = new Date()
			const [year,month,day] = date.toISOString().split('T')[0].split('-')
			const hour    = date.getHours()
			const minutes = date.getMinutes()
			const seconds = date.getMilliseconds()
			new_pos_invoice.refNum            = this.appData.appData.pos_profile.name+"-"+year+'-'+month+'-'+day+'-'+hour+minutes+seconds
			new_pos_invoice.custom_cach_name  = new_pos_invoice.refNum

			this.selectedItemMaps.set("C1" , new_pos_invoice)
			this.selectedTab.tabName = `C1`

		}catch(err){
			console.error("Hlafware POS Error ==> " , err)
			throw err;
		}

    }


	async handleAppData(){
		//check pos profile
		if(this.appData.appData.pos_profile  == null ){
			frappe.set_route("Form", "POS Profile");
			throw new Error("there is no pos profile")
		}

		//check takes and get it if it exist on pos profile
		if(this.appData.appData.pos_profile.taxes_and_charges != null && this.appData.appData.pos_profile.taxes_and_charges != ""){
			this.taxes_and_charges_template = await this.dataHandler.fetchSalesTaxesAndChargesTemplate(this.appData.appData.pos_profile.taxes_and_charges)
			this.taxes_and_charges = this.taxes_and_charges_template.taxes
		}
		//check company and get it if it exist on pos profile
		if(this.appData.appData.pos_profile.company != null && this.appData.appData.pos_profile.company != ''){
			this.company = await this.dataHandler.fetchCompany(this.appData.appData.pos_profile.company)
		}

		//check customer
		if(this.appData.appData.customers.length > 0){
			this.defaultCustomer = structuredClone(this.appData.appData.customers[0])
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
		if(this.appData.appData.price_lists.length > 0){
			this.defaultPriceList.name = this.appData.appData.pos_profile.selling_price_list
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

            this.wrapper.append('<div id="MainContainer" class="rowBoxReverse"></div>');
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
		this.init_debtCart();
		this.init_settingsCart();
		this.init_unsyncedPosCart();
	}

	async checkForPOSEntry(){
		const user       = frappe.session.user
		const posProfile = this.appData.appData.pos_profile.name
		try {
			const response = await frappe.call({
				method: 'pos_ar.pos_ar.doctype.pos_info.pos_info.check_opening_entry',
				args: { user , posProfile}
			});
			const r = response.message;
			if(r.length === 0 ){
				this.create_opening_voucher()
				return false;
			}
			//copy data
			Object.assign(this.POSOpeningEntry ,  r[0])
			this.db.updateCheckInOutSync(this.POSOpeningEntry.period_start_date)
			return true
		} catch (error) {
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
				this.payment_methods = payments
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
				me.db.updateCheckInOutSync(me.POSOpeningEntry.period_start_date)
				me.check_in_out_cart.getAllCheckInOut();
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
        this.$components_wrapper.append('<div id="LeftSection" class="columnBoxReverse"></div>')
        this.$components_wrapper.append('<div id="RightSection" class="columnBox"></div>')

		this.$rightSection = this.$components_wrapper.find("#RightSection")
		this.$leftSection  = this.$components_wrapper.find("#LeftSection")

    }


	init_customer_box(){
		this.customer_box  = new pos_ar.PointOfSale.pos_customer_box(
									this.$leftSection ,
									this.appData.appData.customers,
									this.defaultCustomer ,
									()=>{
										this.screenManager.navigate("home");
									},
									this.onSync.bind(this),
									this.saveCheckInOut.bind(this),
									this.onMenuClick.bind(this),
									()=>{
										this.screenManager.navigate("debt_cart");
									}
								)

		this.screenManager.registerScreen("customer_box" , this.customer_box);
		this.screenManager.customer_box = this.customer_box ; 
	}


    init_item_selector(){

        this.item_selector = new pos_ar.PointOfSale.pos_item_selector(
				this.$leftSection                  ,
				this.appData.appData.items         ,
				this.appData.appData.item_barcodes ,
				this.appData.appData.item_groups   ,
				this.appData.appData.item_prices   ,
				this.settings_data.settings        ,
				this.defaultPriceList              ,
				this.getItemPrice.bind(this)       ,
				this.auto_select.bind(this)        ,
				item => { this.itemClick_selector(item)  }
		)
		
		this.screenManager.registerScreen("item_selector" , this.item_selector);
		this.screenManager.item_selector = this.item_selector ; 
	}

    init_selected_item(){
		this.selected_item_cart  = new pos_ar.PointOfSale.pos_selected_item_cart(
									this.$rightSection    ,
									this.settings_data    ,
									this.selectedItemMaps ,
									this.appData.appData.price_lists ,
									this.appData.appData.customers   ,
									this.appData.brands   ,
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
										this.screenManager.navigate('home')
									},
									(action , key) =>{
										this.onKeyPressed(action , key)
									},
									this.createNewTab.bind(this),
									()=>{
										this.savePosInvoice()
										this.screenManager.navigate("payment_cart");
									},
									this.savePosInvoice.bind(this),
									this.db
								)
		this.screenManager.registerScreen("selected_item_cart" , this.selected_item_cart);
		this.screenManager.selected_item_cart = this.selected_item_cart ; 
	}

	init_item_details(){
		this.item_details = new pos_ar.PointOfSale.pos_item_details(
									this.$leftSection,
									this.appData.appData.pos_profile.warehouse,
									this.appData.appData.price_lists ,
									this.appData.appData.item_prices ,
									this.appData.appData.bins        ,
									this.selectedItem,
									this.selectedField,
									(event , field , value) =>{
										this.onInput(event , field , value);
									},
									()=>{
										this.screenManager.navigate('home');
									}
								)
		this.screenManager.registerScreen("item_details" , this.item_details);
		this.screenManager.item_details = this.item_details ; 
	}


    init_paymentCart(){
		this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
									this.$leftSection,
									this.selectedItemMaps,
									this.selectedTab,
									this.appData.appData,
									this.appData.appData.pos_profile.payments,
									this.selectedPaymentMethod,
									this.invoiceData,
									()=>{
										this.screenManager.navigate('home');
									},
									this.onCompleteOrder.bind(this),
									(event , field , value) =>{
										this.onInput(event , field , value);
									},
								)
		this.screenManager.registerScreen("payment_cart" , this.payment_cart);
		this.screenManager.payment_cart = this.payment_cart ; 
    }

    init_historyCart(){
		this.history_cart = new pos_ar.PointOfSale.pos_history(
									this.wrapper,
									this.db,
									this.appData.appData.pos_profile,
									this.appData,
									this.settings_data,
									this.company,
									this.taxes_and_charges,
									this.historyCartClick.bind(this)
								)
		this.screenManager.registerScreen("history_cart" , this.history_cart);
		this.screenManager.history_cart = this.history_cart ; 
    }

    init_checkInOutCart(){
		this.check_in_out_cart = new pos_ar.PointOfSale.pos_check_in_out(
									this.wrapper,
									this.db
								)
		this.screenManager.registerScreen("check_in_out_cart" , this.check_in_out_cart);
		this.screenManager.check_in_out_cart = this.check_in_out_cart ; 
    }

    init_debtCart(){
		this.debt_cart = new pos_ar.PointOfSale.pos_debt_cart(
									this.wrapper,
									this.appData,
									()=>{
										this.check_in_out_cart.getAllCheckInOut();
									}
								)
		this.screenManager.registerScreen("debt_cart" , this.debt_cart);
		this.screenManager.debt_cart = this.debt_cart ; 
	}


    init_settingsCart(){
		this.settings_cart = new pos_ar.PointOfSale.pos_settings(
									this.wrapper,
									this.settings_data,
									this.appData.appData.pos_profile,
									this.onSettingsChange.bind(this)
								)
		this.screenManager.registerScreen("settings_cart" , this.settings_cart);
		this.screenManager.settings_cart = this.settings_cart ; 
    }

	init_unsyncedPosCart(){
		this.unsynced_pos_cart = new pos_ar.PointOfSale.pos_unsynced_cart(
									this.wrapper,
									this.appData,
									this.db,
									(invoice)=>{
										const tab = this.selected_item_cart.createTabForEditPOS()

										this.selectedItemMaps.set(`C${tab}` , invoice)
										this.selectedTab.tabName = `C${tab}`
							
										this.screenManager.navigate('home')
									},()=>{
										if(this.unsyncedPos >= 1){
											this.customer_box.setSynced();
											this.unsyncedPos = 0
										}else{
											this.unsyncedPos -= 1 ;
											this.customer_box.setNotSynced(this.unsyncedPos);
										}										
									}
								)
		this.screenManager.registerScreen("unsynced_pos_cart" , this.unsynced_pos_cart);
		this.screenManager.unsynced_pos_cart = this.unsynced_pos_cart ; 
    }



    /**************************  callbacks functions ******************************/


	itemClick_selector(item , refresh){

		this.syncInput = false

		const  itemCloned = structuredClone(item);

		itemCloned.discount_amount     = 0;
		itemCloned.discount_percentage = 0;

		Object.assign(this.selectedItem , itemCloned)

		this.addItemToPosInvoice( itemCloned )

		this.selected_item_cart.calculateNetTotal();
		this.selected_item_cart.calculateVAT();
		this.selected_item_cart.calculateQnatity();
		this.selected_item_cart.calculateGrandTotal();
		this.selected_item_cart.refreshSelectedItem();

		if(refresh){
			this.item_selector.refreshItemSelector()
		}

		this.selectedField.field_name = "quantity"
		this.selected_item_cart.makeSelectedButtonHighlighted();

		this.selected_item_cart.scrollToBottom()

		this.savePosInvoice()
	}


	onSelectedItemClick(item){
		this.syncInput = false
		const clonedItem = structuredClone(item)
		Object.assign(this.selectedItem , clonedItem)

		this.selectedField.field_name = "quantity"
		this.selected_item_cart.makeSelectedButtonHighlighted();

		this.screenManager.navigate("item_details");

		//refresh data
		this.item_details.refreshDate(item);
	}


	saveCheckInOut(checkInOut){
		checkInOut.is_sync = 0 ;
		this.appData.saveCheckInOut(
			checkInOut,
			(res)=>{
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
			//recalculate price
			this.selected_item_cart.resetItemRateBaseOnPriceList()
			//redraw
			this.selected_item_cart.refreshSelectedItem()
		}
	}


	savePosInvoice(saveWithZeroRate){
		this.selectedItemMaps.get(this.selectedTab.tabName).synced = false ;
		console.log("savePosInvoice : " , this.selectedItemMaps.get(this.selectedTab.tabName))
		this.appData.savePosInvoice(this.selectedItemMaps.get(this.selectedTab.tabName))

	}


	auto_select(item){
		this.itemClick_selector(item)
		this.item_selector.refresh()
	}



	onMenuClick(menu){
		if(menu == 'recent_pos'){
			this.screenManager.navigate("history_cart");
		}
		else if(menu == 'close_pos'){
			this.onClosePOS()
		}
		else if(menu == 'unsenced_invoices'){
			this.screenManager.navigate("unsynced_pos_cart");
		}
		else if(menu == 'settings'){
			this.screenManager.navigate("settings_cart");
		}
		else if(menu == 'checkInOut'){
			this.screenManager.navigate("check_in_out_cart");
		}
	}

	getDefaultPaymentMethod(){
		let result = null;
		this.appData.appData.pos_profile.payments.forEach(method =>{
			if(method.default){
				result = method
			}
		})

		return result
	}

	getPaymentMethods(){
		let result = [];
		this.appData.appData.pos_profile.payments.forEach(method =>{
			result.push({'mode_of_payment' : method.mode_of_payment , 'default' : method.default , 'amount' : 0})
		})
		return result
	}

	restorePosInvoices(posInvoices){
		posInvoices.forEach((pos)=>{
			const tab = this.selected_item_cart.createTabForEditPOS()
			this.selectedItemMaps.set(`C${tab}` , pos)
			this.selectedTab.tabName = `C${tab}`
		})
		this.screenManager.navigate('home')
	}

	createNewTab(counter){

		let new_pos_invoice = frappe.model.get_new_doc('POS Invoice');
		new_pos_invoice.customer          = this.defaultCustomer.name
		new_pos_invoice.pos_profile       = this.appData.appData.pos_profile.name
		new_pos_invoice.items             = [];
		new_pos_invoice.taxes_and_charges = this.appData.appData.pos_profile.taxes_and_charges
		new_pos_invoice.additional_discount_percentage = 0
		new_pos_invoice.paid_amount       = 0
		new_pos_invoice.base_paid_amount  = 0
		new_pos_invoice.creation_time     = frappe.datetime.now_datetime()
		new_pos_invoice.payments          = this.getPaymentMethods()
		new_pos_invoice.is_pos            = 1
		new_pos_invoice.update_stock      = 1
		new_pos_invoice.docstatus         = 0
		new_pos_invoice.synced            = false
		new_pos_invoice.status            = 'Draft'
		new_pos_invoice.priceList         = this.defaultPriceList.name
		new_pos_invoice.opened            = 1
		//build refNm   posProfile-date-time
		const date = new Date()
		const [year,month,day] = date.toISOString().split('T')[0].split('-')
		const hour    = date.getHours()
		const minutes = date.getMinutes()
		const seconds = date.getMilliseconds()
		new_pos_invoice.refNum            = this.appData.appData.pos_profile.name+"-"+year+'-'+month+'-'+day+'-'+hour+minutes+seconds
		new_pos_invoice.custom_cach_name  = new_pos_invoice.refNum

		this.selectedItemMaps.set(`C${counter}` , new_pos_invoice)
		this.selectedTab.tabName = `C${counter}`

		
		this.screenManager.navigate('home')
	}


	historyCartClick(event , message){
		//go back to edit pos draft
		if(event == 'edit'){
			const tab = this.selected_item_cart.createTabForEditPOS()

			this.selectedItemMaps.set(`C${tab}` , message)
			this.selectedTab.tabName = `C${tab}`

			this.screenManager.navigate('home')
		}else if(event == 'duplicate'){
			const tab = this.selected_item_cart.createTabForEditPOS()

			message.name              = frappe.model.get_new_doc('POS Invoice').name;
			message.pos_profile       = this.appData.appData.pos_profile.name
			message.taxes_and_charges = this.appData.appData.pos_profile.taxes_and_charges
			message.creation_time     = frappe.datetime.now_datetime()
			message.payments          = this.getPaymentMethods()
			message.priceList         = this.defaultPriceList.name
			//build refNm   posProfile-date-time
			const date = new Date()
			const [year,month,day] = date.toISOString().split('T')[0].split('-')
			const hour    = date.getHours()
			const minutes = date.getMinutes()
			const seconds = date.getMilliseconds()
			message.refNum            = this.appData.appData.pos_profile.name+"-"+year+'-'+month+'-'+day+'-'+hour+minutes+seconds
			message.custom_cach_name  = message.refNum

			this.selectedItemMaps.set(`C${tab}` , message)
			this.selectedTab.tabName = `C${tab}`

			this.screenManager.navigate('home')
		}
		else if(event == 'return'){
			const tab = this.selected_item_cart.createTabForEditPOS()

			const returnedPosInvoice = this.makePosInvoiceReturn(message)
			this.selectedItemMaps.set(`C${tab}` , returnedPosInvoice)
			this.selectedTab.tabName = `C${tab}`

			this.screenManager.navigate('home')
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

		this.savePosInvoice()
	}


	onKeyPressed( action  , key){

		if(action == "quantity"){
			this.selectedField.field_name = "quantity"
			this.selected_item_cart.makeSelectedButtonHighlighted();
			//this.item_details.requestFocus("quantity")
		}
		else if(action == "rate"){
			this.selectedField.field_name = "rate"
			this.selected_item_cart.makeSelectedButtonHighlighted();
			//this.item_details.requestFocus("rate")
		}
		else if(action == "minus"){
			this.syncInput = true
			const newValue = parseFloat(this.selectedItem.qty) * -1
			this.selectedItem.qty = parseFloat(newValue);
			this.editPosItemQty(this.selectedItem.name , this.selectedItem.qty);
			//redrawing
			this.selected_item_cart.refreshSelectedItem();
		}
		else if(action == "print"){
			this.history_cart.print_receipt( this.selectedItemMaps.get(this.selectedTab.tabName) )
			//this.item_details.requestFocus("discount_percentage")
		}
		else if(action == "remove"){
			this.syncInput = false;

			this.deleteItemFromPOsInvoice(this.selectedItem.name);

		}
		else if(action == "delete"){


			//check if the details cart is appear
			if(!this.settings_data.settings.showItemDetails){
				if(this.selectedField.field_name == "quantity"){
					const oldValue = parseFloat(this.selectedItem.qty)
					const newValue = `${oldValue}`.slice(0, -1)
					this.selectedItem.qty = parseFloat(newValue) || 0;
				}
				else if(this.selectedField.field_name == "rate"){
					const oldValue = parseFloat(this.selectedItem.rate)
					const newValue = `${oldValue}`.slice(0, -1)

					this.selectedItem.rate = parseFloat(newValue) || 0;

					//recalculate the rate
					let oldRate = this.selectedItem.rate;
					let persont = this.selectedItem.discount_percentage
					let montant = oldRate * (persont / 100)

					this.selectedItem.discount_percentage = persont;
					this.selectedItem.discount_amount     = montant;

					this.editPosItemDiscountAmount(this.selectedItem.name , this.selectedItem.discount_amount);
					this.editPosItemRate(this.selectedItem.name , this.selectedItem.rate);

				}
				else if(this.selectedField.field_name == "discount_percentage"){
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


			let newValue =  parseFloat(this.item_details.deleteCharacter())

			if(this.selectedField.field_name == "quantity"){
				this.selectedItem.qty = newValue;
			}
			else if(this.selectedField.field_name == "rate"){

				this.selectedItem.rate = newValue;

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
					let oldValue = 0
					if(!this.syncInput){
						oldValue = 0
						this.syncInput = true
					}else{
						oldValue = parseFloat(this.selectedItem.qty)
					}
					const newValue = `${oldValue}` + key
					this.selectedItem.qty = parseFloat(newValue);
				}
				else if( this.selectedField.field_name ==  "rate" ){
						let lastValue = 0
						if(!this.syncInput){
							lastValue = 0
							this.syncInput = true
						}else{
							lastValue = parseFloat(this.selectedItem.rate)
						}
						const newValue  = `${lastValue}` + key
						this.selectedItem.rate = parseFloat(newValue);

						//recalculate the rate
						let oldRate = this.selectedItem.rate;
						let persont = this.selectedItem.discount_percentage
						let montant = oldRate * (persont / 100)

						this.selectedItem.discount_percentage = persont;
						this.selectedItem.discount_amount     = montant;

						this.editPosItemDiscountAmount(this.selectedItem.name , this.selectedItem.discount_amount);
						this.editPosItemRate(this.selectedItem.name , this.selectedItem.rate);

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

		this.savePosInvoice()
	}


	onCompleteOrder(){

		this.payment_cart.show_waiting()

		this.savePosInvoice()

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
		let is_return = 1;

		this.selectedItemMaps.get(this.selectedTab.tabName).items.forEach(  item  =>{
			// we still didnt implement the  base_paid_amount and amount_eligible_for_commissionseen
			// value in deafault pos ==>  ["Administrator"]. i think it is an array.
			let newItem = {
				'item_name'               : item.item_name,
				'item_code'               : item.item_code,
				'rate'                    : item.rate,
				'qty'                     : item.qty,
				'description'             : item.description,
				'image'                   : item.image,
				'use_serial_batch_fields' : 1,
				'cost_center'             : this.appData.appData.pos_profile.cost_center,
				'discount_percentage'     : item.discount_percentage,
				'discount_amount'         : item.discount_amount,
				'warehouse'               : this.appData.appData.pos_profile.warehouse,
				'income_account'          : this.appData.appData.pos_profile.income_account,
			}
			items.push(newItem)
			if(item.qty > 0)
				is_return = 0
		})

		this.selectedItemMaps.get(this.selectedTab.tabName).is_return = is_return

		this.selectedItemMaps.get(this.selectedTab.tabName).items = items
		if(items.length ==0)
			return

		let total = 0
		this.selectedItemMaps.get(this.selectedTab.tabName).items.forEach(item =>{
			total += item.rate * item.qty
		})

		if(this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName)) > total){
			this.selectedItemMaps.get(this.selectedTab.tabName).paid_amount            = total
			this.selectedItemMaps.get(this.selectedTab.tabName).base_paid_amount       = total
			this.selectedItemMaps.get(this.selectedTab.tabName).outstanding_amount     = 0
			this.selectedItemMaps.get(this.selectedTab.tabName).total_customer_payment = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName))
		}else{
			this.selectedItemMaps.get(this.selectedTab.tabName).paid_amount            = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName))
			this.selectedItemMaps.get(this.selectedTab.tabName).base_paid_amount       = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName))
			this.selectedItemMaps.get(this.selectedTab.tabName).outstanding_amount     = this.invoiceData.grandTotal - this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName))
			this.selectedItemMaps.get(this.selectedTab.tabName).total_customer_payment = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName))
		}

		this.selectedItemMaps.get(this.selectedTab.tabName).docstatus          = 1

		//set status
		const status = this.checkIfPaid(this.selectedItemMaps.get(this.selectedTab.tabName))
		this.selectedItemMaps.get(this.selectedTab.tabName).status            = status

		//copy the pos is important otherwise it will deleted and the selectedTab change and then it will save the
		//wrong one. because insert take a while after the callback will called.
		//console.log("debuging rayan :::: " , this.selected_item_cart)


		const pos = structuredClone(this.selectedItemMaps.get(this.selectedTab.tabName))


		if(status == 'Unpaid'){
			pos.synced = true
			frappe.db.insert(
				pos
			).then(r =>{

 				this.payment_cart.hide_waiting()

				pos.opened = 0;
				pos.real_name = r.name

				this.history_cart.print_receipt(pos)
				this.appData.updatePosInvoice(pos)

				/*** START : deleting pos when finishing **/
				//print the pos

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
				this.screenManager.navigate('home')
				/*** END   : deleting pos when finishing **/


			}).catch(err=>{
				this.payment_cart.hide_waiting()
				console.log("cant push pos invoice : " , err);
			})
		}
		else{

			this.payment_cart.hide_waiting()
			/*** START : deleting pos when finishing **/
			//print the pos
			this.history_cart.print_receipt(pos)

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
			this.screenManager.navigate('home')
			/*** END : deleting pos when finishing **/


			pos.synced = false ;
			pos.opened = 0;
			this.appData.updatePosInvoice(pos)

			this.unsyncedPos += 1 ;
			this.customer_box.setNotSynced(this.unsyncedPos);
		}
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
						updatedPos.real_name = r.name
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

						//if the last pos save seccessfully then hide the progress bar
						if(counter == allUnsyncedPos.length){
							frappe.hide_progress();
							this.customer_box.setSynced();
							this.unsyncedPos = 0;
						}
						
					})
				})
			},
			(err) =>{
				console.log("cant get the unseced POS from local")
			}
		);


	}


	/***********************************************   tools  *************************************************/

	getCustomerDefaultPriceList(customerId){
		let priceList = ""
		this.appData.appData.customers.forEach(customer => {
			if(customer.name == customerId){
				priceList = customer.default_price_list
			}
		})
		return priceList
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
			frappe.throw(__(`you have  some invoices to sync first.`))
		}
		//otherwise you can close the voucher
		let voucher               = frappe.model.get_new_doc("POS Closing Entry");
		voucher.pos_opening_entry = this.POSOpeningEntry.name;
		voucher.pos_profile       = this.POSOpeningEntry.pos_profile;
		voucher.company           = this.POSOpeningEntry.company ;
		voucher.user              = frappe.session.user  ;
		voucher.posting_date      = frappe.datetime.now_date();
		voucher.posting_time      = frappe.datetime.now_time();

		const unsyncedChecks = this.check_in_out_cart.checkList.filter(check => check.is_sync === 0);
		unsyncedChecks.forEach(check => {
			let child = frappe.model.add_child(voucher, 'check_in_out', 'custom_check_in_out')
			child.check_type    = check.check_type
			child.creation_time = check.creation_time
			child.amount        = check.amount
			child.reason_note   = check.reason_note
			child.user          = check.owner
		})

		//frappe.set_route("Form", "POS Closing Entry", voucher.name);

		frappe.set_route("Form", "POS Closing Entry", voucher.name).then(() => {
			// Block back navigation
			window.addEventListener('popstate', (event) => {
				frappe.set_route("Form", "POS Closing Entry", voucher.name);
			});
		});

		//location.replace(frappe.utils.get_url_to_form("POS Closing Entry", voucher.name));

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

	makePosInvoiceReturn(posInvoice){
		let invoice = structuredClone(posInvoice)

		let new_name = frappe.model.get_new_doc('POS Invoice').name;

		invoice.name           = new_name
		invoice.is_return      = 1;
		invoice.return_against = posInvoice.real_name
		invoice.real_name      = ""
		invoice.consolidated_invoice = null
		invoice.outstanding_amount = 0 ;

		let newItems = []
		invoice.items.forEach(item =>{
			if(item.qty > 0){
				let newItem = structuredClone(item)
				newItem.qty = newItem.qty * -1
				newItem.description = "Returned item"
				newItems.push(newItem)
			}
		})
		invoice.items = newItems


		invoice.pos_profile       = this.appData.appData.pos_profile.name
		invoice.taxes_and_charges = this.appData.appData.pos_profile.taxes_and_charges
		invoice.creation_time     = frappe.datetime.now_datetime()
		invoice.payments          = this.getPaymentMethods()
		invoice.priceList         = this.defaultPriceList.name
		//build refNm   posProfile-date-time
		const date = new Date()
		const [year,month,day] = date.toISOString().split('T')[0].split('-')
		const hour    = date.getHours()
		const minutes = date.getMinutes()
		const seconds = date.getMilliseconds()
		invoice.refNum            = this.appData.appData.pos_profile.name+"-"+year+'-'+month+'-'+day+'-'+hour+minutes+seconds
		invoice.custom_cach_name  = invoice.refNum

		return invoice
	}

	toggleKeyboardMode(active){


		if(active){
			document.addEventListener('keydown', event =>{
				// Check if the user is typing in an input or textarea
				const activeElement = document.activeElement;
				const isInputFocused =
					activeElement.tagName === "INPUT" ||
					activeElement.tagName === "TEXTAREA" ||
					activeElement.isContentEditable;

				// Ignore keydown events if the user is typing in a field
				if (isInputFocused) return;

				if(event.key == "q"){
					this.selectedField.field_name = "quantity"
					this.selected_item_cart.makeSelectedButtonHighlighted();
				}else if(event.key == "p"){
					this.selectedField.field_name = "rate"
					this.selected_item_cart.makeSelectedButtonHighlighted();
				}else if(event.key == "Delete"){
					this.deleteItemFromPOsInvoice(this.selectedItem.name)
					this.selected_item_cart.refreshSelectedItem();
					this.screenManager.navigate('home')

				}else if(event.key == "Backspace"){
					if(this.selectedField.field_name == "quantity"){
						const lastValue = parseFloat(this.selectedItem.qty)
						let newValue    = 0

						// Remove the last character and parse the remaining value
						newValue = parseFloat(`${lastValue}`.slice(0, -1)) || 0;

						this.selectedItem.qty = parseFloat(newValue);
						this.editPosItemQty(this.selectedItem.name , this.selectedItem.qty);
						//redrawing
						this.selected_item_cart.refreshSelectedItem();
					}else if(this.selectedField.field_name == "rate"){
						const lastValue = parseFloat(this.selectedItem.rate)
						let newValue = parseFloat(`${lastValue}`.slice(0,-1)) || 0 ;
						this.selectedItem.rate = parseFloat(newValue);

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
				}else if(this.selectedField.field_name == "quantity"){
					if(parseFloat(event.key) || event.key == "0" ){
						let lastValue = 0
						if(!this.syncInput){
							lastValue      = 0
							this.syncInput = true
						}else{
							lastValue = parseFloat(this.selectedItem.qty)
						}
						const newValue  = `${lastValue}` + event.key
						this.selectedItem.qty = parseFloat(newValue);
						this.editPosItemQty(this.selectedItem.name , this.selectedItem.qty);
						//redrawing
						this.selected_item_cart.refreshSelectedItem();
					}else if(event.key == "-"){
						this.syncInput = true
						const newValue = parseFloat(this.selectedItem.qty) * -1
						this.selectedItem.qty = parseFloat(newValue);
						this.editPosItemQty(this.selectedItem.name , this.selectedItem.qty);
						//redrawing
						this.selected_item_cart.refreshSelectedItem();
					}
				}else if(this.selectedField.field_name == "rate"){
					if(parseFloat(event.key) ||  event.key == "0"){
						let lastValue = 0
						if(!this.syncInput){
							lastValue      = 0
							this.syncInput = true
						}else{
							lastValue = parseFloat(this.selectedItem.rate)
						}
						const newValue  = `${lastValue}` + event.key
						this.selectedItem.rate = parseFloat(newValue);

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
				}
			})

		}else{
			document.removeEventListener('keydown' , event =>{})
		}
	}


	getItemPrice(item , priceList){
		//check the mode
		const mode = this.settings_data.settings.itemPriceBasedOn

		if(mode == 'brand'){
			if(item.brand == null)
				return 0 ;
			const price = this.appData.appData.item_prices.find(itemPrice => itemPrice.brand == item.brand && itemPrice.price_list == priceList)
			return price ? price.price_list_rate  : 0
		}else if(mode == 'priceList'){
			const price = this.appData.appData.item_prices.find(itemPrice => itemPrice.item_code == item.item_name && itemPrice.price_list == priceList)
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
		let clonedItem = structuredClone(clickedItem) ;

		const posInvoice = this.selectedItemMaps.get(this.selectedTab.tabName);
		const posItems   = posInvoice.items;

		let exist = false ;

		posItems.forEach(item => {
			if(item.name == clickedItem.name){
				exist = true;
				item.qty += 1 ;
				const clone = structuredClone(item)
				Object.assign(this.selectedItem , clone)
			}
		})

		if(!exist){
			clonedItem.item_code           = clonedItem.name ;
			clonedItem.discount_amount     = 0 ;
			clonedItem.discount_percentage = 0 ;
			clonedItem.qty                 = 1 ;
			clonedItem.rate                = this.getItemPrice(clickedItem , this.selectedItemMaps.get(this.selectedTab.tabName).priceList);
			posItems.push(clonedItem)

			const clone = structuredClone(clonedItem)
			Object.assign(this.selectedItem , clone)

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

	calculatePaidAmount(posInvoice){
		let paidAmountDA = 0;
		posInvoice.payments.forEach(mode =>{
			paidAmountDA += mode.amount
		})
		return paidAmountDA
	}

};
