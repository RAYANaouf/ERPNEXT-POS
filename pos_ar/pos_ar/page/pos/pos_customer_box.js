pos_ar.PointOfSale.pos_customer_box = class{

	constructor(
		wrapper          ,
		customersList    ,
		selectedCustomer ,
		backHome         ,
		onSync           ,
		saveCheckInOut   ,
		onMenuClick      ,
		onDebtClick      ,
	){
		this.wrapper           = wrapper          ;
		this.customers_list    = customersList    ;
		this.selected_customer = selectedCustomer ;
		this.back_home         = backHome         ;
		this.on_sync           = onSync           ;
		this.on_menu_click     = onMenuClick      ;
		this.save_check_in_out = saveCheckInOut   ;
		this.on_debt_click     = onDebtClick      ;

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

		this.wrapper.append('<div id="ActionsContainerBox">')
		this.actionContainer = this.wrapper.find('#ActionsContainerBox')

		// Sync button
		this.actionContainer.append(`
			<div id="SyncBox" class="action-btn">
				<span id="syncBoxContent">Sync</span>
			</div>
		`)

		// Home button
		this.actionContainer.append(`
			<div id="HomeBox" class="action-btn" style="display:none;">
				<img src="/assets/pos_ar/images/home.png" alt="Home">
			</div>
		`)

		// Debt button
		this.actionContainer.append(`
			<div id="DebtBox" class="action-btn">
				<img src="/assets/pos_ar/images/debt.png" alt="Debt">
			</div>
		`)

		// Exchange button
		this.actionContainer.append(`
			<div id="exchangeBtn" class="action-btn">
				<img src="/assets/pos_ar/images/exchange.png" alt="Exchange">
			</div>
		`)

		// Add new custom button with popover
		this.actionContainer.append(`
			<div id="popupBtn" class="action-btn">
				<i class="fa fa-star"></i>
			</div>
		`)

		// Add popover element
		this.wrapper.append(`
			<div id="myPopover" popover>
				<div class="popover-header">
					<h2>Invoices</h2>
				</div>
				<div class="popover-content">
					<!-- Content will go here -->
				</div>
				<div class="popover-footer">
					<button class="btn btn-default" id="cancelBtn">Cancel</button>
					<button class="btn btn-primary" id="confirmBtn">Confirm</button>
				</div>
			</div>
		`)

		// Menu button
		this.actionContainer.append(`
			<div id="MenuBox" class="action-btn">
				<img src="/assets/pos_ar/images/menu.png" alt="Menu">
				<div id="menuItemsContainer">
					<div id="posInvoiceMenuItem"       class="menuItem">Recent POS Invoices</div>
					<div id="checkInOutMenuItem"       class="menuItem">Check In/Out</div>
					<div id="unsencedInvoicesMenuItem" class="menuItem">Unsenced invoices</div>
					<div id="closePosMenuItem"         class="menuItem">Close the POS</div>
					<div id="settingMenuItem"          class="menuItem">About</div>
				</div>
			</div>
		`)

		// Initialize button references
		this.sync_btn = this.actionContainer.find('#SyncBox')
		this.sync_btn_content = this.sync_btn.find('#syncBoxContent')
		this.home = this.actionContainer.find('#HomeBox')
		this.debt = this.actionContainer.find('#DebtBox')
		this.exchange_btn = this.actionContainer.find('#exchangeBtn')
		this.menu = this.actionContainer.find('#MenuBox')
		this.menuItemsContainer = this.actionContainer.find('#menuItemsContainer')
		this.pos_invoices       = this.menuItemsContainer.find('#posInvoiceMenuItem')
		this.check_in_out       = this.menuItemsContainer.find('#checkInOutMenuItem')
		this.close_pos          = this.menuItemsContainer.find('#closePosMenuItem')
		this.unsenced_invoices  = this.menuItemsContainer.find('#unsencedInvoicesMenuItem')
		this.setting            = this.menuItemsContainer.find('#settingMenuItem')

		//check in out dialog
		this.wrapper.append('<div id="darkFloatingBackground"></div>')
		this.dark_floating_background = this.wrapper.find('#darkFloatingBackground');

		this.wrapper.append(`
			<div id="checkInOutDialog">
				<div class="dialog-header">
					<h2>Add Transaction</h2>
				</div>
				<div id="checkTypeContainer">
					<div id="checkInType" class="rowBox centerItem checkType selected">
						<div class="type-icon">
							<img src="/assets/pos_ar/images/arrow.png" style="transform: rotate(180deg);" alt="In">
						</div>
						<div class="type-text">Check In</div>
					</div>
					<div id="checkOutType" class="rowBox centerItem checkType">
						<div class="type-icon">
							<img src="/assets/pos_ar/images/arrow.png" alt="Out">
						</div>
						<div class="type-text">Check Out</div>
					</div>
				</div>
				<div class="inputGroup">
					<label for="check_in_out_input">Amount</label>
					<input autocomplete="off" required type="number" id="check_in_out_input" placeholder="Enter amount">
				</div>
				<div class="inputGroup">
					<label for="check_in_out_note_textarea">Reason</label>
					<textarea id="check_in_out_note_textarea" placeholder="Enter reason for transaction"></textarea>
				</div>
				<div id="btnsContainers" class="rowBox">
					<button id="cancelBtn" class="dialogBtn rowBox centerItem">Cancel</button>
					<button id="confirmBtn" class="dialogBtn rowBox centerItem">Confirm</button>
				</div>
			</div>
		`)
		this.check_in_out_dialog = this.wrapper.find('#checkInOutDialog');
		this.check_in_out_dialog.css('flex-direction','column')

		this.check_type_container = this.check_in_out_dialog.find('#checkTypeContainer')
		this.check_in_box  = this.check_type_container.find('#checkInType')
		this.check_out_box = this.check_type_container.find('#checkOutType')
		this.check_in_out_type = 'In'
		this.check_in_out_input = this.check_in_out_dialog.find('#check_in_out_input');
		this.check_in_out_note  = this.check_in_out_dialog.find('#check_in_out_note_textarea');
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

		const popover = document.getElementById('myPopover');
		const toggleButton = document.getElementById('popupBtn');
		const cancelBtn = document.getElementById('cancelBtn');
		const confirmBtn = document.getElementById('confirmBtn');

		toggleButton.addEventListener('click', () => {
			popover.togglePopover();
		});

		cancelBtn.addEventListener('click', () => {
			popover.hidePopover();
		});

		confirmBtn.addEventListener('click', () => {
			// Handle confirm action here
			popover.hidePopover();
		});

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

		this.unsenced_invoices.on('click' , (event)=>{
			this.on_menu_click('unsenced_invoices');
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

		this.debt.on('click' , (event)=>{
			this.on_debt_click()
		})

		this.exchange_btn.on('click' , (event)=>{
			this.showCheckInOutDialog();
		})

		this.dark_floating_background.on('click' , (event)=>{
			this.hideCheckInOutDialog();
		})

		this.check_in_box.on('click', (event) => {
			this.check_in_out_type = 'In';
			this.check_in_box.addClass('selected');
			this.check_out_box.removeClass('selected');
		})

		this.check_out_box.on('click', (event) => {
			this.check_in_out_type = 'Out';
			this.check_out_box.addClass('selected');
			this.check_in_box.removeClass('selected');
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
			checkInOut.reason_note   = this.check_in_out_note.val()
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
