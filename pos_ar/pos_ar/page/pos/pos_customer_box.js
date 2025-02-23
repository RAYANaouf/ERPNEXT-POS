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
		onPrintPos       ,
	){
		this.wrapper           = wrapper          ;
		this.customers_list    = customersList    ;
		this.selected_customer = selectedCustomer ;
		this.back_home         = backHome         ;
		this.on_sync           = onSync           ;
		this.on_menu_click     = onMenuClick      ;
		this.save_check_in_out = saveCheckInOut   ;
		this.on_debt_click     = onDebtClick      ;
		this.on_print_pos      = onPrintPos       ;

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
			<div id="popupBtn" class="action-btn" style="display: none;">
				<i class="fa fa-star"></i>
			</div>
		`)

		// Check company and show button if it's OPTILENS TIZIOUZOU
		frappe.db.get_value('Company', frappe.defaults.get_default('company'), 'name')
			.then(r => {
				if (r.message.name === "OPTILENS TIZIOUZOU" || r.message.name === "Tizi" ) {
					document.getElementById('popupBtn').style.display = 'flex';
				}
			});

		// Add popover element
		this.wrapper.append(`
			<div id="myPopover" popover>
				<div class="popover-header">
					<h2>Invoices</h2>
				</div>
				<div class="search-container">
					<input type="text" class="search-box" placeholder="Search by customer name..." />
				</div>
				<div class="popover-content">
					<!-- Content will go here -->
				</div>
				<div class="popover-footer">
					<button class="btn btn-primary" id="confirmBtn">Done</button>
				</div>
			</div>
		`)

		// Add styles for the invoice popup
		const style = document.createElement('style');
		style.textContent = `
			#myPopover {
				min-width: 600px !important;
				max-width: 80vw !important;
			}
			.search-container {
				padding: 10px 15px;
				border-bottom: 1px solid var(--border-color);
				background-color: var(--fg-color);
			}
			.search-box {
				width: 100%;
				padding: 8px 12px;
				border: 1px solid var(--border-color);
				border-radius: 6px;
				font-size: 14px;
				outline: none;
				transition: border-color 0.2s;
			}
			.search-box:focus {
				border-color: var(--primary-color);
			}
			.search-box::placeholder {
				color: var(--text-muted);
			}
			.invoice-list {
				max-height: 400px;
				overflow-y: auto;
				padding: 10px;
				width: 100%;
			}
			.invoice-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 12px 15px;
				border-bottom: 1px solid #eee;
				margin-bottom: 8px;
				width: 100%;
			}
			.invoice-item:hover {
				background-color: #f8f9fa;
			}
			.invoice-details {
				flex: 1;
				min-width: 0; /* Prevents flex item from overflowing */
			}
			.invoice-name {
				font-weight: bold;
				color: var(--text-color);
				margin-bottom: 4px;
				font-size: 1.1em;
			}
			.invoice-id {
				color: var(--text-muted);
				font-size: 0.9em;
				margin-bottom: 2px;
			}
			.invoice-date {
				color: var(--text-muted);
				font-size: 0.85em;
			}
			.invoice-amount {
				font-weight: bold;
				color: var(--text-color);
				margin-top: 4px;
			}
			.invoice-actions {
				margin-left: 20px;
				white-space: nowrap;
			}
			.no-invoices {
				text-align: center;
				padding: 20px;
				color: var(--text-muted);
			}
			.popover-content {
				width: 100%;
				padding: 0;
			}
			.print-invoice {
				padding: 6px 12px;
			}
			.print-invoice i {
				margin-right: 4px;
			}
		`;
		document.head.appendChild(style);

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

		let me = this

		const popover = document.getElementById('myPopover');
		const toggleButton = document.getElementById('popupBtn');
		const cancelBtn = document.getElementById('cancelBtn');
		const confirmBtn = document.getElementById('confirmBtn');

		toggleButton.addEventListener('click', () => {
			// Fetch non-consolidated POS invoices
			frappe.call({
				method: 'pos_ar.pos_ar.doctype.pos_info.pos_info.get_non_consolidated_invoices',
				callback: function(response) {
					const invoices = response.message || [];
					const content = document.querySelector('.popover-content');
					const searchBox = document.querySelector('.search-box');
					
					function renderInvoices(filteredInvoices) {
						if (filteredInvoices.length === 0) {
							content.innerHTML = '<div class="no-invoices">No invoices found</div>';
						} else {
							let html = '<div class="invoice-list">';
							filteredInvoices.forEach(invoice => {
								html += `
									<div class="invoice-item" data-name="${invoice.name}">
										<div class="invoice-details">
											<div class="invoice-name">${invoice.customer || 'No Customer'}</div>
											<div class="invoice-id">${invoice.name}</div>
											<div class="invoice-date">${frappe.datetime.str_to_user(invoice.posting_date)}</div>
											<div class="invoice-amount">${format_currency(invoice.grand_total)}</div>
										</div>
										<div class="invoice-actions">
											<button class="btn btn-xs btn-default print-invoice">
												<i class="fa fa-print"></i> Print
											</button>
										</div>
									</div>
								`;
							});
							html += '</div>';
							content.innerHTML = html;

							// Add click handlers for print buttons
							content.querySelectorAll('.print-invoice').forEach(btn => {
								btn.addEventListener('click', (e) => {
									const invoiceName = e.target.closest('.invoice-item').dataset.name;
									const invoice = invoices.find(inv => inv.name === invoiceName);
									console.log("the invoiceeeeeeeeeeee is ",invoice);
									me.on_print_pos(invoice);
								});
							});
						}
					}

					// Initial render
					renderInvoices(invoices);

					// Add search functionality
					searchBox.addEventListener('input', (e) => {
						const searchTerm = e.target.value.toLowerCase();
						const filteredInvoices = invoices.filter(invoice => 
							(invoice.customer || '').toLowerCase().includes(searchTerm)
						);
						renderInvoices(filteredInvoices);
					});

					// Clear search when popup opens
					searchBox.value = '';
				}
			});
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
