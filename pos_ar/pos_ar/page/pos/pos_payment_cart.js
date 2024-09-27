

pos_ar.PointOfSale.pos_payment_cart = class{

	constructor(
		wrapper,
		selectedItemMap,
		selectedTab,
		selectedPaymentMythod,
		onClose
	){
		this.wrapper                 = wrapper;
		this.selected_item_map       = selectedItemMap;
		this.selected_tab            = selectedTab;
		this.selected_payment_method = selectedPaymentMythod;
		this.on_close_cart           = onClose;

		console.log('map #$%^&*' , this.selectedItemMap)

		//local
		this.grand_total = 0 ;
		this.paid_amount = 0 ;
		this.to_change   = 0 ;

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

		this.cart_content_top_section.append('<div id="cashBox" class="paymentMethodBox"><div id="cashBoxTitle" class="title">Cash</div><input type="float" id="cachInput" value="0"  ></div>')
		this.cart_content_top_section.append('<div id="paymentOnTimeBox" class="paymentMethodBox"><div id="paymentOnTimeBoxTitle" class="title">On Time</div><input type="float" id="paymentOnTimeInput" value="0" ></div>')
		this.cart_content_top_section.append('<div id="redeemLoyaltyPoints" class="paymentMethodBox"><div id="redeemLoyaltyPointsTitle" class="title">Redeem Loyalty Points</div><input type="float" id="RedeemLayoutPointsInput" value="0" disabled></div>')

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
		this.payment_details.append(`<div id="paymentToChange" class="columnBox"><div id="paimentToChangeTitle" class="rowBox centerItem">To Change</div><div id="paimentToChangeValue"  class="rowBox centerItem"> ${this.to_change}DA </div></div>`)

	}


	showCart(){
		console.log('show payment cart')
		this.cart.css('display' , 'flex');
	}

	hideCart(){
		this.cart.css('display' , 'none');
	}



	/****************************************  listeners  ***********************************************/

	setListeners(){
		this.cashBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "cash"
			this.cashBox.addClass('selected')
			this.onTimeBox.removeClass('selected')
			this.redeemLoyaltyBox.removeClass('selected')

			//refresh UI
			this.paid_amount = this.cashBox.find('#cachInput').val()
			this.refreshPaidAmount();
		})

		this.onTimeBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "onTime"
			this.cashBox.removeClass('selected')
			this.onTimeBox.addClass('selected')
			this.redeemLoyaltyBox.removeClass('selected')

			//refresh UI
			this.paid_amount = this.onTimeBox.find('#paymentOnTimeInput').val()
			this.refreshPaidAmount();

		})

		this.redeemLoyaltyBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "redeemLoyalty"
			this.cashBox.removeClass('selected')
			this.onTimeBox.removeClass('selected')
			this.redeemLoyaltyBox.addClass('selected')

			//refresh UI
			this.paid_amount = 0;
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

			this.paid_amount = event.target.value;
			this.refreshPaidAmount();
			this.calculateToChange();
			console.log("input" , event.target.value)
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

			this.paid_amount = event.target.value;
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
				event.target.value = value.slice(0,-1);
			}
			else{
				event.target.value = value
			}
			console.log("input" , event.target.value)
		})

	}


	calculateGrandTotal(){

		this.grand_amount = 0 ;

		this.selected_item_map.get(this.selected_tab.tabName).forEach((value,key)=>{
			this.grand_amount += value.quantity * value.amount
		})

		this.payment_details.find('#paymentGrandTotalValue').text(`${this.grand_amount} DA`)
	}

	calculateToChange(){
		this.to_change = this.paid_amount - this.grand_total
		this.payment_details.find('#paimentToChangeValue').text(`${this.to_change} DA`)
	}

	refreshPaidAmount(){
		this.payment_details.find('#paimentPaidAmountValue').text(`${this.paid_amount} DA`)
	}

}
