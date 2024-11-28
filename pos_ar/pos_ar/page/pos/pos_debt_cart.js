
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
		this.leftContainer.append(`<div class="rowBox C_A_Center" style="margin:16px;" ><div> Amount </div><input id="debt_paymentAmount" type="number" style="${inputStyle}"></input></div>`)
		this.leftContainer.append(`<div id="debt_debtsList"  class="columnBox" style="${debtListStyle}"></div>`)
		this.debtList     = this.leftContainer.find('#debt_debtsList')
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

	async  refreshClientDebtPart(customer){
		//styles
		const invoiceStyle = 'width:calc(100% - 40px);height:60px;min-height:60px;border-bottom:2px solid #505050;'
		const payBtnStyle  = 'width:80px;height:35px;color:white;background:green;border-radius:12px;margin:0px 20px;'

		this.debtList.html('')
		const result = await this.app_data.fetchDebts(customer.name)

		result.forEach(invoice=>{
			const customerBox = $(
				`<div  style="${invoiceStyle}" class="rowBox C_A_Center invoiceBox" data-invoice-name="${invoice.name}"></div>`
			)
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
				await this.payPosInvoice(invoice, 1000);
			});
			this.debtList.append(customerBox)
		})

	}


	async payPosInvoice(invoice){

		// The amount to be paid (could be dynamic based on user input, here we assume 1000 DA as example)
		const paymentAmount = this.payment_amount;
		this.payment_amount -= invoice.outstanding_amount;


		// Call the server method to update the invoice payment
		const result = await this.app_data.update_invoice_payment(invoice.name, paymentAmount);

		console.log("rest : " , result)
		this.payment_amount = result.remaining
		this.leftContainer.find("#debt_paymentAmount").val(result.remaining)

		this.refreshClientDebtPart(this.selected_client)
	}

}
