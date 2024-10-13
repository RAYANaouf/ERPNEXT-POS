
pos_ar.PointOfSale.pos_customer_box = class{

	constructor(
		wrapper,
		customersList,
		onSync,
		onClosePOS,
		onHistoryClick
	){
		this.wrapper          = wrapper ;
		this.customers_list   = customersList ;
		this.on_sync          = onSync ;
		this.on_close_pos     = onClosePOS;
		this.on_history_click = onHistoryClick;

		//local
		this.online  = true    ;
		this.show_menu = false ;
		this.start_work();
	}



	start_work(){
		this.prepare_customer_box();
		this.setCustomersInList();
		this.setListeners();
	}

	prepare_customer_box(){

		this.wrapper.append('<div id="ActionsContainerBox" class="rowBox align_center">');
		this.actionContainer = this.wrapper.find('#ActionsContainerBox');

		this.actionContainer.append('<div id="CustomerBox" class="rowBox align_center">');
		this.actionContainer.append('<div id="MenuBox"     class="rowBox centerItem">');
		this.actionContainer.append('<div id="HomeBox"     class="rowBox centerItem"  style="display:none;">');



		this.home = this.actionContainer.find('#HomeBox')
		this.home.append('<img src="/assets/pos_ar/images/home.png" alt="Home" id="homeBoxIcon" >')

		this.menu = this.actionContainer.find('#MenuBox')
		this.menu.append('<img src="/assets/pos_ar/images/menu.png" alt="Menu" id="MenuBtn" >')
		this.menu.append('<div id="menuItemsContainer"     class="columnBox">');

		this.menuItemsContainer = this.actionContainer.find('#menuItemsContainer')
		this.menuItemsContainer.append('<div id="posInvoiceMenuItem" class="menuItem">Recent POS Invoices</div>')
		this.menuItemsContainer.append('<div id="closePosMenuItem"   class="menuItem">Close the POS</div>')
		this.menuItemsContainer.append('<div id="settingMenuItem"    class="menuItem">Setting</div>')

		this.pos_invoices = this.menuItemsContainer.find('#posInvoiceMenuItem')
		this.close_pos    = this.menuItemsContainer.find('#closePosMenuItem')
		this.setting      = this.menuItemsContainer.find('#settingMenuItem')

		this.customerBox = this.actionContainer.find('#CustomerBox');
		this.customerBox.append('<input list="CustomerList"  id="CustomerInput" name="Customer" placeHolder="Enter the customer">')
		this.customerBox.append('<datalist id="CustomerList"></datalist>')
		this.customerBox.append('<div id="syncBtn" class="Synced">Sync</div>')

		this.sync_btn = this.customerBox.find('#syncBtn')
	}


	setCustomersInList(){

		const customerList_html = document.getElementById("CustomerList");
		customerList_html.innerHTML = "" ;

		this.customers_list.forEach(customer =>{
			const option = document.createElement("option");
			option.value = customer.name;
			option.textContent = customer.customer_name;
			customerList_html.appendChild(option);
		})
	}

	//show and hide
	hideActionBar(){
		this.customerBox.css('display' , 'none');
		this.home.css('display' , 'flex');
		this.actionContainer.css('flex-direction' , 'row-reverse')
	}

	showActionBar(){
		this.customerBox.css('display' , 'flex');
		this.home.css('display' , 'none');
		this.actionContainer.css('flex-direction' , 'row')
	}



	setListeners(){

		this.customerBox.find('#syncBtn').on('click' , (event)=>{
			this.on_sync();
		})

		this.close_pos.on('click' , (event)=>{
			this.on_close_pos();
		})

		this.pos_invoices.on('click' , (event)=>{
			this.on_history_click();
		})

		this.menu.on('click' , (event)=>{

			if(this.show_menu){
				this.show_menu = !this.show_menu
				this.menuItemsContainer.css('visibility' , 'hidden')
				this.menuItemsContainer.css('opacity' , '0')
			}
			else{
				this.show_menu = !this.show_menu
				this.menuItemsContainer.css('visibility' , 'visible')
				this.menuItemsContainer.css('opacity' , '1')
			}

		})

		this.home.on('click' , (event)=>{
			console.log("we should go home!")
		})

	}

	setSynced(){
		this.sync_btn.addClass('Synced')
		this.sync_btn.removeClass('NotSynced')
	}

	setNotSynced(){
		this.sync_btn.addClass('NotSynced')
		this.sync_btn.removeClass('Synced')
	}





}
