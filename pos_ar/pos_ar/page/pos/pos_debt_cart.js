pos_ar.PointOfSale.pos_debt_cart = class{

	constructor(
		wrapper,
		appData
	){
		this.wrapper           = wrapper
		this.app_data          = appData

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
		this.wrapper.find('#LeftSection').append('<div id="debtLeftContainer" class="columnBox"  ></div>')
		this.wrapper.find('#RightSection').append('<div id="debtRightContainer" class="columnBox"></div>')

		this.leftContainer  = this.wrapper.find('#debtLeftContainer')
		this.rightContainer = this.wrapper.find('#debtRightContainer')

		const headerStyle     = "height:55px;padding:0px 16px;"
		const listStyle       = "flex-grow:1;width:100%;margin:0px 16px;"
		const debtListStyle   = "width:100%;height:100%;margin:16px;height:100%;"
		const inputStyle      = "width:40%;margin: 0px 16px;"
		//customer part
		this.rightContainer.append(`<div class="rowBox centerItem"  style="${headerStyle}" ><input type="text" id="debt_filterClientList" placeholder="Search..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>`)
		this.rightContainer.append(`<div id="debt_customerList" class="columnBox" style="${listStyle}"></div>`)

		this.customerList = this.rightContainer.find('#debt_customerList')

		//debts part
		this.leftContainer.append(`<div class="rowBox C_A_Center" style="margin:16px;" ><div> Amount </div><input id="debt_paymentAmount" type="number" style="${inputStyle}"></input><div style="flex-grow:1;"  id="partially_client_debt"  class="rowBox centerItem"> Selected Debt : 0 DA </div><div style="flex-grow:1;" id="total_client_debt" class="rowBox centerItem"> DA</div></div>`)
		this.total_client_debt     = this.leftContainer.find('#total_client_debt')
		this.partially_client_debt = this.leftContainer.find('#partially_client_debt')
		this.leftContainer.append(`<div id="debt_debtsList"  class="columnBox" style="${debtListStyle}"></div>`)
		this.debtList              = this.leftContainer.find('#debt_debtsList')
	}
	showCart(){
		this.leftContainer.css('display' , 'flex')
		this.rightContainer.css('display' , 'flex')
	}
	hideCart(){
		this.leftContainer.css('display' , 'none')
		this.rightContainer.css('display' , 'none')
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
				console.log("let's debuging : " , "invoiceName : " , invoiceName , "index : " , index , "this._selected_invoice : " , this._selected_invoice)
				if (index > -1) {
					this._selected_invoice.splice(index, 1);
				}
			}
			this.refresh_partially_paid()
			console.log('Selected Invoices:', this._selected_invoice); // For debugging
		});

	}

	refreshClientPart(){

		const customerStyle = "height:35px;width:calc(100% - 32px);"

		this.customerList.html('')
		this._filtredClientList.forEach(customer=>{
			const customerBox = $(`<div  style="${customerStyle}" class="rowBox C_A_Center customerBox" > ${customer.name} </div>`)
		        // Set an onclick listener for the customer box
        		customerBox.on('click', () => {
				// Remove the 'selected' class from all customer boxes
				$('.customerBox').removeClass('selected');
				// Add the 'selected' class to the clicked customer box
				customerBox.addClass('selected');
				// Update the selected customer
				this.selected_client = structuredClone(customer)
				this.refreshClientDebtPart(customer)
        		});
			this.customerList.append(customerBox)
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
			console.log("see invoice ==> " , invoice)
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
		const payBtnStyle  = 'width:80px;height:35px;color:white;background:green;border-radius:12px;margin:0px 20px;'

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
			customerBox.append(checkbox)
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


	async payPosInvoice(invoice){
		// Call the server method to update the invoice payment
		const result = await this.app_data.update_invoice_payment(invoice.name, this.payment_amount);

		this.payment_amount = result.remaining
		this.leftContainer.find("#debt_paymentAmount").val(result.remaining)

		this.refreshClientDebtPart(this.selected_client)
	}
	async paySalesInvoice(invoice){
		// Call the server method to update the invoice payment
		const result = await this.app_data.update_sales_invoice_payment(invoice.name, this.payment_amount);

		this.payment_amount = result.remaining
		this.leftContainer.find("#debt_paymentAmount").val(result.remaining)

		this.refreshClientDebtPart(this.selected_client)
	}

}

