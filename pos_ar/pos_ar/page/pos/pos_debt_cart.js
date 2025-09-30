pos_ar.PointOfSale.pos_debt_cart = class{

	constructor(
		wrapper,
		appData,
		openingEntry,
		refreshCheckInOut
	){
		this.wrapper              = wrapper
		this.app_data             = appData
		this.openingEntry         = openingEntry
		this.refresh_check_in_out = refreshCheckInOut 

		//local vars
		this._filtredClientList = this.app_data.appData.customers
		this.selected_client = {}
		this.payment_amount = 0

		this._pos_invoice      = []
		this._sales_invoice    = []

		this._selected_invoice = []

		this.start_work()
	}

	start_work(){
		this.prepare_cart()
		this.refreshClientPart()
		this.setListener()
	}

	prepare_cart(){
		this.wrapper.find('#LeftSection').append('<div id="debtLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="debtRightContainer" class="columnBox"></div>')

		this.leftContainer  = this.wrapper.find('#debtLeftContainer')
		this.rightContainer = this.wrapper.find('#debtRightContainer')

		// Customer search section
		this.rightContainer.append(`
			<div class="debt-header">
				<input type="text" 
					id="debt_filterClientList" 
					placeholder="Search customers..."
				>
			</div>
			<div id="debt_customerList"></div>
		`)

		this.customerList = this.rightContainer.find('#debt_customerList')

		// Payment section
		this.leftContainer.append(`
			<div class="payment-header">
				<div class="amount-input">
					<input id="debt_paymentAmount" type="number" placeholder="Enter amount">
				</div>
				<div id="total_client_debt">Total: 0 DA</div>
				<div id="partially_client_debt">Selected: 0 DA</div>
				<button id="pay_selected_invoices_btn">Pay</button>
				<button id="print_client_debt_btn" class="print-btn" style="display:flex;align-items:center;gap:8px;background:#2e7d32;color:#fff;border:none;border-radius:10px;padding:8px 14px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.15);">
    				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        				<path d="M6 9V2h12v7"/>
        				<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        				<path d="M6 14h12v8H6z"/>
				    </svg>
			    	<span>Print</span>
				</button>
			</div>
			<div id="debt_debtsList"></div>
		`)

		// Loading animation
		this.leftContainer.append(`
			<script src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs" type="module"></script>
			<div id="debt_waitingContainer" style="display:none;">
				<dotlottie-player 
					src="https://lottie.host/d6c76206-aab9-4d5a-af73-c4a6cfc5aaa9/H8vnpKcKj9.lottie" 
					background="transparent" 
					speed="1" 
					style="width: 300px; height: 300px" 
					loop 
					autoplay
				></dotlottie-player>
			</div>
		`)

		// Initialize components
		this.waiting_cart = this.leftContainer.find('#debt_waitingContainer')
		this.total_client_debt = this.leftContainer.find('#total_client_debt')
		this.partially_client_debt = this.leftContainer.find('#partially_client_debt')
		this.pay_selected_invoices_btn = this.leftContainer.find('#pay_selected_invoices_btn')
		this.print_btn = this.leftContainer.find('#print_client_debt_btn')
		this.debtList = this.leftContainer.find('#debt_debtsList')
	}

	add_customer_to_list(customer) {
		const customerElement = document.createElement('div')
		customerElement.className = 'customer-item'
		customerElement.innerHTML = `
			<div class="customer-name">${customer.customer_name}</div>
			<div class="customer-info">
				<span>${customer.customer_primary_contact || ''}</span>
				<span>${customer.mobile_no || ''}</span>
			</div>
		`
		
		customerElement.addEventListener('click', () => {
			this.customerList.find('.customer-item').removeClass('selected')
			customerElement.classList.add('selected')
			
			// Update the selected customer and refresh the debt part
			this.selected_client = structuredClone(customer)
			this.refreshClientDebtPart(customer)
		})

		this.customerList.append(customerElement)
	}

	showCart(){
		this.leftContainer.css('display' , 'flex')
		this.rightContainer.css('display' , 'flex')
	}
	hideCart(){
		this.leftContainer.css('display' , 'none')
		this.rightContainer.css('display' , 'none')
	}

	show_waiting(){
		this.waiting_cart.css('display' , 'flex')
	}
	hide_waiting(){
		this.waiting_cart.css('display' , 'none')
	}

	setListener(){
		//filter clients
		this.rightContainer.find("#debt_filterClientList").on('input' , event =>{
			const value = this.rightContainer.find("#debt_filterClientList").val().trim().toLowerCase();
			this._filtredClientList = this.app_data.appData.customers.filter(customer =>
				customer.customer_name.toLowerCase().includes(value)
			);
 			this.refreshClientPart()

		})
		this.leftContainer.find("#debt_paymentAmount").on('input',event =>{
			this.payment_amount = parseFloat(this.leftContainer.find("#debt_paymentAmount").val())
		})
		this.pay_selected_invoices_btn.on('click' , async () =>{
			console.log("check the list ==> " , this._selected_invoice)
			this.paySelectedInvoice()
		})
		this.print_btn.on('click', () => {
			if (!this.selected_client || !this.selected_client.customer_name) {
				frappe.msgprint(__('Please select a customer first.'));
				return;
			}
			this.printClientDebt();
		})
		// hover feedback
		this.print_btn.on('mouseenter', () => this.print_btn.css('background', '#1b5e20'))
		this.print_btn.on('mouseleave', () => this.print_btn.css('background', '#2e7d32'))
		this.debtList.on('click', '.invoiceBox input[type="checkbox"]', event => {
			const checkbox                 = $(event.target);
			const invoiceName              = checkbox.data('invoice-name');
			const invoiceOutstandingAmount = checkbox.data('outstanding-amount')
			const invoiceType              = checkbox.data('invoice-type')

			const invoice_data = { 'name' : invoiceName , 'outstanding_amount' : invoiceOutstandingAmount , 'type' : invoiceType }

			if (checkbox.is(':checked')) {
				// Add the invoice name to the selected list
				if (!this._selected_invoice.some(invoice => invoice.name == invoiceName)) {
					this._selected_invoice.push(invoice_data);
				}
			} else {
				// Remove the invoice name from the selected list
				const index = this._selected_invoice.findIndex(invoice => invoice.name == invoiceName);
				if (index > -1) {
					this._selected_invoice.splice(index, 1);
				}
			}
			this.refresh_partially_paid()
		});

	}

	refreshClientPart(){
		this.customerList.html('')
		this._filtredClientList.forEach(customer=>{
			this.add_customer_to_list(customer)
		})
	}

	refreshTotal(total_debt){
		this.total_client_debt.text(`Total Debt : ${total_debt} DA`);
		
		this.total_debt = total_debt;
	}
	refresh_partially_paid(){
		//calculate the client selected pos debt based on selected check box
		let partially_paid = 0 ;
		this._selected_invoice.forEach(invoice=>{
			partially_paid += invoice.outstanding_amount
		})

		this.partially_client_debt.text(`Selected Debt : ${partially_paid} DA`)
	}

	async  refreshClientDebtPart(customer){
		//make the total text to loading... indicator rather than false value.
		this.refreshTotal( "Loading ..." );
		this._selected_invoice = []
		this.refresh_partially_paid();

		//styles
		const invoiceStyle = 'width:calc(100% - 40px);height:60px;min-height:60px;border-bottom:2px solid #505050;'
		const payBtnStyle  = 'width:80px;height:35px;color:white;background:green;border-radius:12px;margin:0px 20px;cursor:pointer;'

		let total_debt = 0 ;

		this.debtList.html('')
		console.log("the company : " , this.app_data.appData.pos_profile.company)
		console.log("the profile : " , this.app_data.appData.pos_profile)
		const result  = await this.app_data.fetchDebts(customer.name , this.app_data.appData.pos_profile.company)
		const result2 = await this.app_data.fetchDebtsSalesInvoices(customer.name , this.app_data.appData.pos_profile.company)

		// store for printing
		this._pos_invoice = result;
		this._sales_invoice = result2;

		console.log(" =======> the result : " , result)
		console.log(" =======> the result2 : " , result2)

		result.forEach(invoice=>{

			total_debt += invoice.outstanding_amount ;

			const customerBox = $(
				`<div  style="${invoiceStyle}" class="rowBox C_A_Center invoiceBox" data-invoice-name="${invoice.name}"></div>`
			)
			const checkbox = $(`<input type="checkbox" class="select_checkbox" style="margin:0px 16px;" data-invoice-type="POS Invoice" data-invoice-name="${invoice.name}" data-outstanding-amount="${invoice.outstanding_amount}" ></input>`)
			//customerBox.append(checkbox)
			customerBox.append(`<div style="flex-grow:1;">${invoice.name}</div>`)
			customerBox.append(`<div style="flex-grow:1;">${invoice.outstanding_amount} DA</div>`)
			customerBox.append(`<div style="flex-grow:1;">${invoice.posting_date}</div>`)
			customerBox.append(`<div style="flex-grow:1;">POS Invoice</div>`)
			customerBox.append(`<div class="rowBox centerItem payBtn" style="${payBtnStyle}">Pay</div>`)

			 // Set up the click event listener for the Pay button
			customerBox.find('.payBtn').on('click', async () => {
				// Get the invoice name from the customerBox
				//const invoiceName = customerBox.data('invoice-name');
				// Proceed to pay the invoice with a predefined payment amount (e.g., 1000 DA)
				await this.payPosInvoice(invoice);
			});


			this.debtList.append(customerBox)
		})


		const me = this
		

		result2.forEach(invoice => {
			total_debt += invoice.outstanding_amount;
		
			// Main container
			const customerBox = $(`
				<div style="${invoiceStyle}; overflow:hidden; flex-direction: column; transition:0.3s;" 
					 class="rowBox C_A_Center invoiceBox" data-invoice-name="${invoice.name}">
				</div>
			`);
		
			// Invoice row
			const invoiceRow = $(`
				<div class="rowBox C_A_Center" style="width: 100%;">
				</div>
			`);
		
			invoiceRow.append(`<input type="checkbox" style="margin:0px 16px;" data-invoice-type="Sales Invoice" data-invoice-name="${invoice.name}" data-outstanding-amount="${invoice.outstanding_amount}">`);
			invoiceRow.append(`<div style="flex-grow:1;">${invoice.name}</div>`);
			invoiceRow.append(`<div style="flex-grow:1;">${invoice.outstanding_amount} DA</div>`);
			invoiceRow.append(`<div style="flex-grow:1;">${invoice.posting_date}</div>`);
			invoiceRow.append(`<div style="flex-grow:1;">Sales Invoice</div>`);
		
			// Expand Icon
			invoiceRow.append(`
				<div style="flex-grow:1; display:flex; justify-content:center; align-items:center;">
					<svg class="expandIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24" style="cursor:pointer; transition:0.3s;">
						<path d="M7 10l5 5 5-5H7z"/>		
					</svg>
				</div>
			`);
		
			// Pay Button
			invoiceRow.append(`<div class="rowBox centerItem payBtn" style="${payBtnStyle}">Pay</div>`);
		
			// Expandable container
			const expandableContent = $(`
				<div class="expandableContent" style="width:100%; text-align:center; padding:10px; display:none; color:#555;">
					Loading facteur PDV...
				</div>
			`);
		
			// Assemble
			customerBox.append(invoiceRow);
			customerBox.append(expandableContent);
		
			// Hover effect on expandIcon
			customerBox.find('.expandIcon').hover(
				function() {
					$(this).css('fill', 'green');
				},
				function() {
					$(this).css('fill', 'black');
				}
			);
		
			// Click to expand/collapse
			customerBox.find('.expandIcon').on('click', async function () {
				const isExpanded = customerBox.hasClass('expanded');
		
				if (!isExpanded) {
					expandableContent.slideDown(200);
					customerBox.addClass('expanded');
					$(this).css('transform', 'rotate(180deg)');
		
					// --- FETCH POS Invoices here ---
					try {
						const posInvoices = await me.fetchPosInvoices(invoice.name); 
						console.log("we are heeeeeer :: " , posInvoices)
						
						if (posInvoices.length > 0) {
							let html = `
								<div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">`;
								
								
							posInvoices.forEach(pos => {
								html += `
									<div style="display:flex; justify-content:space-between; align-items:center; 
												padding:8px 12px; border:1px solid #ccc; border-radius:8px; background:#f9f9f9;">
										<div style="flex:2; font-weight:bold;">${pos.name}</div>
										<div style="flex:1; color:#333;">${pos.outstanding_amount} DA</div>
									</div>`;
							});
							
							html += `</div>`;
							expandableContent.html(html);
						} else {
							expandableContent.html(`<div style="margin-top:10px;">No POS Factures found for this invoice.</div>`);
						}
						


					} catch (error) {
						console.error('Error fetching POS invoices:', error);
						expandableContent.html(`<div style="margin-top:10px; color:red;">Error loading POS invoices.</div>`);
					}
		
				} else {
					expandableContent.slideUp(200);
					customerBox.removeClass('expanded');
					$(this).css('transform', 'rotate(0deg)');
				}
			});
		
			// Pay button logic
			customerBox.find('.payBtn').on('click', async () => {
				await this.paySalesInvoice(invoice);
			});
		
			this.debtList.append(customerBox);
		});
		
		




		this.refreshTotal( total_debt );


	}


	async payPosInvoice(invoice) {

		// Ensure the payment amount is a valid float
		const paymentAmount = parseFloat(this.payment_amount) || 0;
		if(paymentAmount <= 0){
			frappe.msgprint(__('The paid amount should be grant than 0'));
			return;
		}

		try {
			this.show_waiting();

			// Call the server method to update the invoice payment
			const result = await this.app_data.update_invoice_payment(invoice.name, paymentAmount , this.openingEntry);

			// Update the payment amount and UI
			this.payment_amount = result.remaining;
			this.leftContainer.find("#debt_paymentAmount").val(result.remaining);

			// Refresh the client's debt details
			await this.refreshClientDebtPart(this.selected_client);
		} catch (error) {
			// Handle errors gracefully
			console.error("Error processing payment:", error);

			// Optional: Notify the user about the error
			alert("An error occurred while processing the payment. Please try again.");
		} finally {
			// Ensure waiting spinner is hidden regardless of success or failure
			this.hide_waiting();
		}
	}

	async paySalesInvoice(invoice) {
		try {
			this.show_waiting();

			// Ensure the payment amount is a valid float
			const paymentAmount = parseFloat(this.payment_amount) || 0;

			if(paymentAmount <= 0){
				frappe.msgprint(__('The paid amount should be grant than 0'));
				return;
			}

			// Call the server method to update the invoice payment
			const result = await this.app_data.update_sales_invoice_payment(invoice.name, paymentAmount);

			// add check in to the voucher.
			const check_in_amount    = paymentAmount - result.remaining;
			const checkInOut         = frappe.model.get_new_doc('check_in_out')
			checkInOut.creation_time = frappe.datetime.now_datetime();
			checkInOut.user          = frappe.session.user;
			checkInOut.check_type    = 'In';
			checkInOut.is_sync       = 0 ;
			checkInOut.amount        = parseFloat(check_in_amount);
			checkInOut.reason_note   = 'Debt payment.';
			
			
			this.app_data.saveCheckInOut(
				checkInOut,
				(res)=>{
					this.refresh_check_in_out()
				},(err)=>{
					console.log('err to save checkInOut : ' , err)
				}
			)

			// Ensure result is valid and contains the `remaining` field
			if (result && typeof result.remaining === "number") {
				// Update the payment amount and UI
				this.payment_amount = result.remaining;
				this.leftContainer.find("#debt_paymentAmount").val(result.remaining);

				// Refresh the client's debt details
				await this.refreshClientDebtPart(this.selected_client);
			} else {
				throw new Error("Unexpected server response. Please try again.");
			}
		} catch (error) {
			// Log the error for debugging purposes
			console.error("Error processing sales invoice payment:", error);

			// Notify the user about the error
			alert("An error occurred while processing the payment. Please try again later.");
		} finally {
			// Ensure the waiting spinner is hidden regardless of success or failure
			this.hide_waiting();
		}
	}



	async paySelectedInvoice() {
		try {
			this.show_waiting();

			// Ensure the payment amount is a valid float
			const paymentAmount = parseFloat(this.payment_amount) || 0;

			// Call the server method to update the invoice payment
			const result = await this.app_data.paySelectedInvoice(this._selected_invoice , paymentAmount);

			// add check in to the voucher.
			const check_in_amount    = paymentAmount - result.remaining;
			const checkInOut         = frappe.model.get_new_doc('check_in_out')
			checkInOut.creation_time = frappe.datetime.now_datetime();
			checkInOut.user          = frappe.session.user;
			checkInOut.check_type    = 'In';
			checkInOut.is_sync       = 0   ;
			checkInOut.amount        = parseFloat(check_in_amount);
			checkInOut.reason_note   = 'Debt payment.';
						
						
			this.app_data.saveCheckInOut(
				checkInOut,
				(res)=>{
					this.refresh_check_in_out()
				},(err)=>{
					console.log('err to save checkInOut : ' , err)
				}
			)

			// Ensure result is valid and contains the `remaining` field
			if (result && typeof result.remaining === "number") {
				// Update the payment amount and UI
				this.payment_amount = result.remaining;
				this.leftContainer.find("#debt_paymentAmount").val(result.remaining);

				// Refresh the client's debt details
				await this.refreshClientDebtPart(this.selected_client);
			} else {
				throw new Error("Unexpected server response. Please try again.");
			}
		} catch (error) {
			// Log the error for debugging purposes
			console.error("Error processing sales invoice payment:", error);

			// Notify the user about the error
			alert("An error occurred while processing the payment. Please try again later.");
		} finally {
			// Ensure the waiting spinner is hidden regardless of success or failure
			this.hide_waiting();
		}
	}





	async fetchPosInvoices(_sales_invoice) {
		console.log("Fetching POS invoices for sales invoice:", _sales_invoice);
		// Fetch only POS invoices related to the given Sales Invoice
		
		const response = await frappe.db.get_list('POS Invoice', {
			fields: ['name', 'outstanding_amount' , 'currency' ],
			filters: {
				consolidated_invoice: _sales_invoice
			},
			limit : 100000
		})

		console.log("Fetched POS invoices:", response);
		return response || [];
	}

	printClientDebt() {
		try {
			const clientName = this.selected_client.customer_name || this.selected_client.name || '';
			const now = new Date();
			const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).toString().padStart(2,'0')}:${String(now.getMinutes()).toString().padStart(2,'0')}`;
			const totalDebt = this.total_debt || 0;
			const selectedTotal = (this._selected_invoice || []).reduce((s, inv) => s + (inv.outstanding_amount || 0), 0);
	
			const w = window.open('', '_blank');
			if (!w) {
				frappe.msgprint(__('Please allow pop-ups to print.'));
				return;
			}
	
			const styles = `
				<style>
					body { font-family: Arial, sans-serif; padding: 24px; }
					h2 { margin: 0 0 12px 0; font-size: 18px; }
					.meta { margin: 6px 0; font-size: 13px; }
					.summary { margin-top: 14px; padding: 12px; border: 1px dashed #999; border-radius: 8px; background:#fafafa; }
					.summary .line { display:flex; justify-content:space-between; margin: 6px 0; font-size: 14px; }
					@media print { .no-print { display: none; } }
				</style>
			`;
			const html = `
				<html>
				<head>
					<title>Client Debt</title>
					${styles}
				</head>
				<body>
					<h2>Client Debt Summary</h2>
					<div class="meta">Client: <strong>${clientName}</strong></div>
					<div class="meta">Date: ${dateStr}</div>
					<div class="summary">
						<div class="line"><span>Total Debt</span><strong>${totalDebt} DA</strong></div>
						${selectedTotal > 0 ? `<div class="line"><span>Selected Debt</span><strong>${selectedTotal} DA</strong></div>` : ''}
					</div>
					<script>
						window.onload = function(){
							window.print();
							setTimeout(()=> window.close(), 200);
						};
					</script>
				</body>
				</html>
			`;
			w.document.open();
			w.document.write(html);
			w.document.close();
		} catch (e) {
			console.error('Print error', e);
			frappe.msgprint(__('Could not open print preview.'));
		}
	}




}
