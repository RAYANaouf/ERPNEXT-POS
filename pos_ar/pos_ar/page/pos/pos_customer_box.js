
pos_ar.PointOfSale.pos_customer_box = class{

	constructor(
		wrapper          ,
		customersList    ,
		selectedCustomer ,
		backHome         ,
		onSync           ,
		onMenuClick      ,
	){
		this.wrapper           = wrapper          ;
		this.customers_list    = customersList    ;
		this.selected_customer = selectedCustomer ;
		this.back_home         = backHome         ;
		this.on_sync           = onSync           ;
		this.on_menu_click     = onMenuClick      ;
		//local
		this.online  = true    ;
		this.show_menu = false ;
		this.start_work()      ;
	}

	start_work(){
		this.prepare_customer_box();
		this.checkForSync();
		this.setListeners();
	}

	prepare_customer_box(){

		this.wrapper.append('<div id="ActionsContainerBox" class="rowBox align_center">');
		this.actionContainer = this.wrapper.find('#ActionsContainerBox');

		this.actionContainer.append('<div id="SyncBox"     class="rowBox centerItem" >');
		this.actionContainer.append('<div id="HomeBox"     class="rowBox centerItem"  style="display:none;">');
		this.actionContainer.append('<div id="MenuBox"     class="rowBox centerItem">');

		this.sync_btn = this.actionContainer.find('#SyncBox')
		this.sync_btn.append('<div id="syncBoxContent"> Sync </div>')
		this.sync_btn_content = this.sync_btn.find('#syncBoxContent')

		this.home = this.actionContainer.find('#HomeBox')
		this.home.append('<img src="/assets/pos_ar/images/home.png" alt="Home" id="homeBoxIcon">')

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
	}


	//show and hide
	showHomeBar(){
		this.home.css('display' , 'flex');
	}
	hideHomeBar(){
		this.home.css('display' , 'none');
	}
	showSyncBar(){
		this.sync_btn.css('display' , 'flex');
	}
	hideSyncBar(){
		this.sync_btn.css('display' , 'none');
	}


	checkForSync(){
		this.sync_btn.addClass('Synced');
	}

	setListeners(){

		this.sync_btn.on('click' , (event)=>{
			this.on_sync();
		})

		this.close_pos.on('click' , (event)=>{
			this.on_menu_click('close_pos');
		})

		this.pos_invoices.on('click' , (event)=>{
			this.on_menu_click('recent_pos');
		})

		this.setting.on('click' , (event)=>{
			this.on_menu_click('settings');
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
			this.back_home()
		})

	}

	setSynced(){
		this.sync_btn.addClass('Synced')
		this.sync_btn.removeClass('NotSynced')
		this.sync_btn_content.html(`Synced`)
	}

	setNotSynced(counter){
		this.sync_btn.addClass('NotSynced')
		this.sync_btn.removeClass('Synced')
		this.sync_btn_content.html(`Sync (${counter})`)
	}





}
