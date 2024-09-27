

pos_ar.PointOfSale.pos_payment_cart = class{

	constructor(
		wrapper,
		selectedItemMap,
		selectedPaymentMythod,
		onClose
	){
		this.wrapper = wrapper;
		this.selected_item_map = selectedItemMap;
		this.selected_payment_method = selectedPaymentMythod;
		this.on_close_cart = onClose;

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

		this.cart_content_top_section.append('<div id="cashBox" class="paymentMethodBox"><div id="cashBoxTitle" class="title">Cash</div><input type="float" id="cachInput" ></div>')
		this.cart_content_top_section.append('<div id="paymentOnTimeBox" class="paymentMethodBox"><div id="paymentOnTimeBoxTitle" class="title">On Time</div><input type="float" id="paymentOnTimeInput" ></div>')
		this.cart_content_top_section.append('<div id="redeemLoyaltyPoints" class="paymentMethodBox"><div id="redeemLoyaltyPointsTitle" class="title">Redeem Loyalty Points</div><input type="float" id="RedeemLayoutPointsInput" disabled></div>')

		this.cashBox          = this.cart_content_top_section.find("#cashBox")
		this.onTimeBox        = this.cart_content_top_section.find("#paymentOnTimeBox")
		this.redeemLoyaltyBox = this.cart_content_top_section.find("#redeemLoyaltyPoints")

		this.cart_content_bottom_section.append('<h4>Additional Information</h4>')

		this.cart_footer.append('<div id="paymentDetailsContainer" class="rowBox align_center"></div>');
		this.cart_footer.append('<button type="button" id="completeOrderBtn">Complete Order</button>');

		this.payment_details = this.cart_footer.find('#paymentDetailsContainer')
		this.payment_details.append('<div class="columnBox"><div id="paymentGrandTotalTitle" class="rowBox centerItem">Grand Total</div><div id="paymentGrandTotalValue" class="rowBox centerItem"></div></div>')
		this.payment_details.append('<hr>')
		this.payment_details.append(`<div id="paymentPaidAmount" class="columnBox"><div id="paymentPaidAmountTitle" class="rowBox centerItem">Paid Amount</div><div id="paimentPaidAmountValue"  class="rowBox centerItem"> ${this.paid_amount} DA </div></div>`)
		this.payment_details.append('<hr>')
		this.payment_details.append(`<div id="paymentToChange" class="columnBox"><div id="paimentToChangeTitle" class="rowBox centerItem">To Change</div><div id="paimentToBePaidValue"  class="rowBox centerItem"> ${this.to_change}DA </div></div>`)

	}


	showCart(){
		console.log('show payment cart')
		this.cart.css('display' , 'flex');
	}

	hideCart(){
		this.cart.css('display' , 'none');
	}



	/****************************************  UI ***********************************************/

	setListeners(){
		this.cashBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "cash"
			this.cashBox.addClass('selected')
			this.onTimeBox.removeClass('selected')
			this.redeemLoyaltyBox.removeClass('selected')

		})

		this.onTimeBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "onTime"
			this.cashBox.removeClass('selected')
			this.onTimeBox.addClass('selected')
			this.redeemLoyaltyBox.removeClass('selected')

		})

		this.redeemLoyaltyBox.on('click' , (event)=>{
			this.selected_payment_method.methodName = "redeemLoyalty"
			this.cashBox.removeClass('selected')
			this.onTimeBox.removeClass('selected')
			this.redeemLoyaltyBox.addClass('selected')

		})
	}


	calculateGrandTotal(){

		this.grand_amount = 0 ;

		this.selected_item_map.forEach((value,key)=>{
			this.grand_amount += value.quantity * value.amount
		})

		this.payment_details.find('#paymentGrandTotalValue').text(`${this.grand_amount} DA`)
	}

}
