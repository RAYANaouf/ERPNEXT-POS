

pos_ar.PointOfSale.pos_payment_cart = class{

	constructor(
		wrapper,
		selectedItemMap,
		selectedTab,
		paymentMethods,
		selectedPaymentMythod,
		invoiceData,
		onClose,
		onComplete,
		onInput
	){


		this.wrapper                 = wrapper               ;
		this.selected_item_map       = selectedItemMap       ;
		this.selected_tab            = selectedTab           ;
		this.payment_methods         = paymentMethods        ;
		this.selected_payment_method = selectedPaymentMythod ;
		this.invoice_data            = invoiceData           ;
		this.on_close_cart           = onClose               ;
		this.on_complete             = onComplete            ;
		this.on_input                = onInput               ;

		this.start_work();
	}


	/****************************************  UI ***********************************************/

	start_work(){
		this.prepare_payment_cart();
		this.calculateGrandTotal()
		this.setListeners()
	}

	prepare_payment_cart(){
		this.wrapper.append('<div id="paymentMethodCart" class="columnBox align_center"></div>')

		this.cart = this.wrapper.find('#paymentMethodCart')
		this.cart.append('<div id="paymentMethodCartHeader" class="rowBox header align_center row_sbtw"></div>')
		this.cart.append('<div id="paymentMethodContent" class="columnBox align_center"></div>')
		this.cart.append('<div id="paymentMethodCartFooter" class="columnBox align_center"></div>')

		this.cart_header  = this.cart.find('#paymentMethodCartHeader')
		this.cart_content = this.cart.find('#paymentMethodContent')
		this.cart_footer  = this.cart.find('#paymentMethodCartFooter')

		this.cart_header.append('<h4 class="CartTitle">Item Details</h4>')
		this.cart_header.append('<img src="/assets/pos_ar/images/cancel.png" alt="Cancel Button" id="paymentMethodCartXBtn" class="xBtn">')

		this.cart_header.find('#paymentMethodCartXBtn').on('click' , (event)=>{
			this.on_close_cart();
		})

		this.cart_content.append('<div id="paymentContentTopSection" class="rowBox"></div>')
		this.cart_content.append('<div id="paymentContentBottomSection" class="columnBox"></div>')

		this.cart_content_top_section    = this.cart_content.find('#paymentContentTopSection')
		this.cart_content_bottom_section = this.cart_content.find('#paymentContentBottomSection')

		console.log("see methods " , this.payment_methods)
		this.payment_methods.forEach(method =>{
			this.cart_content_top_section.append('<div id="cashBox" class="paymentMethodBox"><div id="cashBoxTitle" class="title">Cash</div><input type="float" id="cachInput" value="0"  ></div>')
		})

		//this.cart_content_top_section.append('<div id="cashBox" class="paymentMethodBox"><div id="cashBoxTitle" class="title">Cash</div><input type="float" id="cachInput" value="0"  ></div>')
		this.cart_content_top_section.append('<div id="paymentOnTimeBox" class="paymentMethodBox"  style="display:none;" ><div id="paymentOnTimeBoxTitle" class="title">On Time</div><input type="float" id="paymentOnTimeInput" value="0" ></div>')
		this.cart_content_top_section.append('<div id="redeemLoyaltyPoints" class="paymentMethodBox" style="display:none;" ><div id="redeemLoyaltyPointsTitle" class="title"">Redeem Loyalty Points</div><input type="float" id="RedeemLayoutPointsInput" value="0" disabled></div>')

		this.cashBox          = this.cart_content_top_section.find("#cashBox")
		this.onTimeBox        = this.cart_content_top_section.find("#paymentOnTimeBox")
		this.redeemLoyaltyBox = this.cart_content_top_section.find("#redeemLoyaltyPoints")

		this.cart_content_bottom_section.append('<h4>Additional Information</h4>')

		this.cart_footer.append('<div id="paymentDetailsContainer" class="rowBox align_center"></div>');
		this.cart_footer.append('<button type="button" id="completeOrderBtn">Complete Order</button>');

		this.payment_details = this.cart_footer.find('#paymentDetailsContainer')
		this.payment_details.append('<div class="columnBox"><div id="paymentGrandTotalTitle" class="rowBox centerItem">Grand Total</div><div id="paymentGrandTotalValue" class="rowBox centerItem"></div></div>')
		this.payment_details.append('<hr>')
		this.payment_details.append(`<div id="paymentPaidAmount" class="columnBox"><div id="paymentPaidAmountTitle" class="rowBox centerItem">Paid Amount</div><div id="paimentPaidAmountValue"  class="rowBox centerItem"> 0 DA </div></div>`)
		this.payment_details.append('<hr>')
		this.payment_details.append(`<div id="paymentToChange" class="columnBox"><div id="paimentToChangeTitle" class="rowBox centerItem">To Change</div><div id="paimentToChangeValue"  class="rowBox centerItem"> ${this.toChange}DA </div></div>`)

	}


	showCart(){
		this.cart.css('display' , 'flex');
		this.clearData();
	}

	hideCart(){
		this.cart.css('display' , 'none');
	}


	clearData(){

		this.invoice_data.paidAmount = 0 ;
		this.invoice_data.toChange = 0 ;

		this.cashBox.find('#cachInput').val(0)

		this.calculateGrandTotal();
		this.calculateToChange();
		this.refreshPaidAmount();

	}


	refreshData(){
		console.log("refreshing data")

		this.cashBox.find('#cachInput').val(this.invoice_data.paidAmount)

		this.calculateGrandTotal();
		this.calculateToChange();
		this.refreshPaidAmount();

	}

	/****************************************  listeners  ***********************************************/

	setListeners(){

		this.cashBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "cash"
			this.cashBox.addClass('selected')
			this.onTimeBox.removeClass('selected')
			this.redeemLoyaltyBox.removeClass('selected')

			//refresh UI
			this.invoice_data.paidAmount = this.cashBox.find('#cachInput').val()
			this.refreshPaidAmount();
		})

		this.onTimeBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "onTime"
			this.cashBox.removeClass('selected')
			this.onTimeBox.addClass('selected')
			this.redeemLoyaltyBox.removeClass('selected')

			//refresh UI
			this.invoice_data.paidAmount = this.onTimeBox.find('#paymentOnTimeInput').val()
			this.refreshPaidAmount();

		})

		this.redeemLoyaltyBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "redeemLoyalty"
			this.cashBox.removeClass('selected')
			this.onTimeBox.removeClass('selected')
			this.redeemLoyaltyBox.addClass('selected')

			//refresh UI
			this.invoice_data.paidAmount = 0 ;
			this.refreshPaidAmount();

		})

		//inputs
		this.cashBox.find('#cachInput').on('input' , (event)=>{

			const value = event.target.value;
			if(value.length == 0){
				event.target.value = 0
			}
			else if (!value.slice(0,-1).includes(".")  && value[value.length-1] == "."){
				event.target.value = value
			}
			else if(value[value.length-1] == "."){
				event.target.value = value.slice(0,-1);
			}
			else if(value[value.length-1] == " "){
				event.target.value = value.slice(0,-1);
			}
			else if(isNaN(value[value.length-1])){
				event.target.value = value.slice(0,-1);
			}
			else{
				event.target.value = value
			}

			this.invoice_data.paidAmount = event.target.value;
			this.refreshPaidAmount();
			this.calculateToChange();
			console.log("input" , event.target.value)
		})

		this.cashBox.find('#cachInput').on('focus' , (event)=>{
			this.on_input('focus' , 'cash' , null)
		})

		this.onTimeBox.find('#paymentOnTimeInput').on('input' , (event)=>{
			const value = event.target.value;
			if(value.length == 0){
				event.target.value = 0
			}
			else if (!value.slice(0,-1).includes(".")  && value[value.length-1] == "."){
				event.target.value = value
			}
			else if(value[value.length-1] == "."){
				event.target.value = value.slice(0,-1);
			}
			else if(value[value.length-1] == " "){
				event.target.value = value.slice(0,-1);
			}
			else if(isNaN(value[value.length-1])){
				event.target.value = value.slice(0,-1);
			}
			else{
				event.target.value = value
			}

			this.invoice_data.paidAmount = event.target.value;
			this.refreshPaidAmount();
			this.calculateToChange();
			console.log("input" , event.target.value)
		})

		this.redeemLoyaltyBox.find('#RedeemLayoutPointsInput').on('input' , (event)=>{
			const value = event.target.value;
			if(value.length == 0){
				event.target.value = 0
			}
			else if (!value.slice(0,-1).includes(".")  && value[value.length-1] == "."){
				event.target.value = value
			}
			else if(value[value.length-1] == "."){
				event.target.value = value.slice(0,-1);
			}
			else if(value[value.length-1] == " "){
				event.target.value = value.slice(0,-1);
			}
			else if(isNaN(value[value.length-1])){
				console.log("===}> " , value[value.length-1])
				event.target.value = value.slice(0,-1);
			}
			else{
				event.target.value = value
			}
			console.log("input" , event.target.value)
		})


		this.cart_footer.find("#completeOrderBtn").on('click' , (event)=>{

			frappe.confirm('Submit the invoice ?',
			()=>{/*yes*/
				this.on_complete()
			},()=>{

			})
		})


	}


	/************************************ tools  ***************************************/


	handleInput(key){

		let previousValue = this.cashBox.find('#cachInput').val() ;
		// Check if the previous value contains a period (.)
		if( previousValue.includes('.') && key == "."){
			return ;
		}
		// Append the key to the paidAmount if there is no period
		this.invoice_data.paidAmount += key;
		// Refresh the payment cart
		this.refreshData();
	}

	deleteKeyPress(){

		console.log("we are here in deleteKeyPress Cash!")


		let cashField = this.cashBox.find('#cachInput');
		let newValue = 0 ;
		let cursor = cashField[0].selectionStart;

		cashField.val( (index , currentValue) =>{
			if( currentValue.length < 0 ){
				console.log("cnd 1")
				newValue = 0 ;
				return 0;
			}
			else if( currentValue.length == 1){
				console.log("cnd 2")
				newValue = 0 ;
				return 0 ;
			}
			else if( cursor == 0 ){
				console.log("cnd 3")
				newValue = currentValue;
				return currentValue;
			}
			else if( cursor == currentValue.length){
				console.log("cnd 4")
				newValue = currentValue.slice(0 , cursor-1)
				return currentValue.slice(0 , cursor-1)
			}
			else{
				console.log("cursor : " , cursor ," current val ==> " , currentValue , " cnd 5 newValue ==> " , currentValue.slice(0,cursor-1) + currentValue.slice(cursor))
				newValue = currentValue.slice(0,cursor-1) + currentValue.slice(cursor)
				return currentValue.slice(0,cursor-1) + currentValue.slice(cursor)
			}
		})

		console.log("we are in newValue ==> " , newValue);

		this.invoice_data.paidAmount = newValue;

		// Use setTimeout to ensure the new value is set before adjusting cursor
		setTimeout(() => {
			cashField[0].setSelectionRange(cursor - 1, cursor - 1); // Move cursor back after deletion
			cashField[0].focus(); // Ensure the input is focused
		}, 0);

		this.refreshData();
	}




	calculateGrandTotal(){
		this.payment_details.find('#paymentGrandTotalValue').text(`${this.invoice_data.grandTotal.toFixed(2)} DA`)
		this.generateProposedPaidAmount(this.invoice_data.grandTotal);
	}

	calculateToChange(){
		this.invoice_data.toChange = (this.invoice_data.paidAmount - this.invoice_data.grandTotal)
		this.payment_details.find('#paimentToChangeValue').text(`${this.invoice_data.toChange.toFixed(2)} DA`)
	}

	refreshPaidAmount(){
		this.payment_details.find('#paimentPaidAmountValue').text(`${this.invoice_data.paidAmount} DA`)
		const paid_amount_DA         = this.payment_details.find('#paimentPaidAmountValue').text();
		const paid_amount_txt        = paid_amount_DA.slice(0 , -2)
		const paid_amount            = parseFloat(paid_amount_txt)
		this.invoice_data.paidAmount = paid_amount;
	}


	generateProposedPaidAmount(total){
		const money = [10,20,50,100,200,500,1000,2000];
		let counter = 0;
		let pointer = 7;

		while( counter < total ){
			counter += money[pointer]
		}
	}

}
