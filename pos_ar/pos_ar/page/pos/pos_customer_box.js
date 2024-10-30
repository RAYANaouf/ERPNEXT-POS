pos_ar.PointOfSale.pos_customer_box = class{

	constructor(
		wrapper          ,
		customersList    ,
		selectedCustomer ,
		backHome         ,
		onSync           ,
		saveCheckInOut   ,
		onMenuClick      ,
	){
		this.wrapper           = wrapper          ;
		this.customers_list    = customersList    ;
		this.selected_customer = selectedCustomer ;
		this.back_home         = backHome         ;
		this.on_sync           = onSync           ;
		this.on_menu_click     = onMenuClick      ;
		this.save_check_in_out = saveCheckInOut   ;

		//local
		this.online       = true  ;
		this.show_menu    = false ;

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
		this.actionContainer.append('<div id="exchangeBtn" class="rowBox centerItem" style="margin-right:16px;" >  <img src="/assets/pos_ar/images/exchange.png">  </div>');
		this.actionContainer.append('<div id="MenuBox"     class="rowBox centerItem">');

		//sync btn
		this.sync_btn = this.actionContainer.find('#SyncBox')
		this.sync_btn.append('<div id="syncBoxContent"> Sync </div>')
		this.sync_btn_content = this.sync_btn.find('#syncBoxContent')
		//exchange btn
		this.exchange_btn = this.actionContainer.find('#exchangeBtn')
		//home btn
		this.home = this.actionContainer.find('#HomeBox')
		this.home.append('<img src="/assets/pos_ar/images/home.png" alt="Home" id="homeBoxIcon">')
		//menu btn
		this.menu = this.actionContainer.find('#MenuBox')
		this.menu.append('<img src="/assets/pos_ar/images/menu.png" alt="Menu" id="MenuBtn" >')
		this.menu.append('<div id="menuItemsContainer"     class="columnBox">');

		this.menuItemsContainer = this.actionContainer.find('#menuItemsContainer')
		this.menuItemsContainer.append('<div id="posInvoiceMenuItem" class="menuItem">Recent POS Invoices</div>')
		this.menuItemsContainer.append('<div id="checkInOutMenuItem" class="menuItem">Check In/Out</div>')
		this.menuItemsContainer.append('<div id="closePosMenuItem"   class="menuItem">Close the POS</div>')
		this.menuItemsContainer.append('<div id="settingMenuItem"    class="menuItem">About</div>')

		this.pos_invoices = this.menuItemsContainer.find('#posInvoiceMenuItem')
		this.check_in_out = this.menuItemsContainer.find('#checkInOutMenuItem')
		this.close_pos    = this.menuItemsContainer.find('#closePosMenuItem')
		this.setting      = this.menuItemsContainer.find('#settingMenuItem')

		//check in out dialog
		this.wrapper.append('<div id="darkFloatingBackground"></div>')
		this.dark_floating_background = this.wrapper.find('#darkFloatingBackground');

		this.wrapper.append('<div id="checkInOutDialog"></div>')
		this.check_in_out_dialog = this.wrapper.find('#checkInOutDialog');
		this.check_in_out_dialog.css('flex-direction','column')

		this.check_in_out_dialog.append('<div id="checkTypeContainer"></div>')
		this.check_type_container = this.check_in_out_dialog.find('#checkTypeContainer')
		this.check_type_container.append('<div id="checkInType"  class="rowBox centerItem checkType selected "><div>Check In</div>  <img src=""></div>')
		this.check_type_container.append('<div id="checkOutType" class="rowBox centerItem checkType">  <div>Check Out</div>  <img src="">  </div>')
		//check type
		this.check_in_box  = this.check_type_container.find('#checkInType')
		this.check_out_box = this.check_type_container.find('#checkOutType')
		this.check_in_out_type = 'In'
		//input
		this.check_in_out_dialog.append('<div class="inputGroup">  <input autocomplete="off" required="" type="number" id="check_in_out_input"><label for="name">Amount</label>   </div>')
		this.check_in_out_dialog.append('<div class="inputGroup">  <textarea type="text" id="check_in_out_note_textarea"></textarea><label for="name">Reason</label>   </div>')
		this.check_in_out_input = this.check_in_out_dialog.find('#check_in_out_input');
		this.check_in_out_note  = this.check_in_out_dialog.find('#check_in_out_note_textarea');
		//cancel and confirm btn
		this.check_in_out_dialog.append('<div id="btnsContainers" class="rowBox"> <div id="cancelBtn" class="dialogBtn rowBox centerItem">Cancel</div><div id="confirmBtn" class="dialogBtn rowBox centerItem">Done</div> </div>')
		this.cancel_dialog_btn = this.check_in_out_dialog.find('#cancelBtn')
		this.confirm_dialog_btn = this.check_in_out_dialog.find('#confirmBtn')
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

	showCheckInOutDialog(){
		this.check_in_out_dialog.css('display','flex')
		this.dark_floating_background.css('display','flex')
	}
	hideCheckInOutDialog(){
		this.checkAmount = 0 ;
		this.check_in_out_dialog.css('display','none')
		this.dark_floating_background.css('display','none')
		this.check_in_out_input.val(0)
	}


	checkForSync(){
		this.sync_btn.addClass('Synced');
	}

	setListeners(){

		this.sync_btn.on('click' , (event)=>{
			frappe.confirm('Are you sure you want to sync',
			()=>{
				this.on_sync();
			},
			()=>{
				return;
			})
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

		this.check_in_out.on('click' , (event)=>{
			this.on_menu_click('checkInOut');
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

		this.exchange_btn.on('click' , (event)=>{
			this.showCheckInOutDialog();
		})

		this.dark_floating_background.on('click' , (event)=>{
			this.hideCheckInOutDialog();
		})

		this.check_in_box.on('click' , (event)=>{
			this.check_in_out_type = 'In';
			this.check_in_box.css('border' , '3px solid #ac6500')
			this.check_in_box.css('background' , '#ffffff')
			this.check_out_box.css('border' , '2px solid #e0e0e0')
			this.check_out_box.css('background' , '#fafafa')
		})

		this.check_out_box.on('click' , (event)=>{
			this.check_in_out_type = 'Out';
			this.check_out_box.css('border' , '3px solid #ac6500')
			this.check_out_box.css('background' , '#ffffff')
			this.check_in_box.css('border' , '2px solid #e0e0e0')
			this.check_in_box.css('background' , '#fafafa')
		})

		this.check_in_out_input.on('input' , (event)=>{
		})

		this.cancel_dialog_btn.on('click' , (event)=>{
			console.log("cancel")
			this.hideCheckInOutDialog();
		})
		this.confirm_dialog_btn.on('click' , (event)=>{
			const checkInOut         = frappe.model.get_new_doc('check_in_out')
			checkInOut.creation_time = frappe.datetime.now_datetime();
			checkInOut.user          = frappe.session.user;
			checkInOut.check_type    = this.check_in_out_type;
			checkInOut.amount        = parseFloat(this.check_in_out_input.val());
			checkInOut.reason        = this.check_in_out_note.val()
			//valid inputs
			if(parseFloat(this.check_in_out_input.val()) <= 0 || this.check_in_out_note.val() == ''){
				frappe.msgprint('you should fulfilled fileds.')
				return;
			}
			this.save_check_in_out(checkInOut);
			this.hideCheckInOutDialog();
			console.log('checkInOut : ' , checkInOut);
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
