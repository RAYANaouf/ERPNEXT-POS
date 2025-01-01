pos_ar.PointOfSale.pos_debt_cart = class{

	constructor(
		wrapper,
		appData,
		refreshCheckInOut
	){
		this.wrapper              = wrapper
		this.app_data             = appData
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
		const result  = await this.app_data.fetchDebts(customer.name)
		const result2 = await this.app_data.fetchDebtsSalesInvoices(customer.name)

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

		result2.forEach(invoice=>{
			total_debt += invoice.outstanding_amount ;

			const customerBox = $(
				`<div  style="${invoiceStyle}" class="rowBox C_A_Center invoiceBox" data-invoice-name="${invoice.name}"></div>`
			)
			customerBox.append(`<input type="checkbox" style="margin:0px 16px;" data-invoice-type="Sales Invoice" data-invoice-name="${invoice.name}" data-outstanding-amount="${invoice.outstanding_amount}" ></input>`)
			customerBox.append(`<div style="flex-grow:1;">${invoice.name}</div>`)
			customerBox.append(`<div style="flex-grow:1;">${invoice.outstanding_amount} DA</div>`)
			customerBox.append(`<div style="flex-grow:1;">${invoice.posting_date}</div>`)
			customerBox.append(`<div style="flex-grow:1;">Sales Invoice</div>`)
			customerBox.append(`<div class="rowBox centerItem payBtn" style="${payBtnStyle}">Pay</div>`)

			 // Set up the click event listener for the Pay button
			customerBox.find('.payBtn').on('click', async () => {
				// Get the invoice name from the customerBox
				//const invoiceName = customerBox.data('invoice-name');
				// Proceed to pay the invoice with a predefined payment amount (e.g., 1000 DA)
				await this.paySalesInvoice(invoice);
			});
			this.debtList.append(customerBox)
		})



		this.refreshTotal( total_debt );


	}


	async payPosInvoice(invoice) {

		// Ensure the payment amount is a valid float
		const paymentAmount = parseFloat(this.payment_amount) || 0;
		if(this.paymentAmount <= 0){
			frappe.msgprint(__('The paid amount should be grant than 0'));
			return;
		}

		try {
			this.show_waiting();

			// Call the server method to update the invoice payment
			const result = await this.app_data.update_invoice_payment(invoice.name, this.payment_amount);

			// add check in to the voucher.
			const check_in_amount  = this.payment_amount - result.remaining;
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
			const check_in_amount  = this.payment_amount - result.remaining;
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





}
