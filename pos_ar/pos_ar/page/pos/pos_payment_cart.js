

pos_ar.PointOfSale.pos_payment_cart = class{

	constructor(
		wrapper,
		onClose
	){
		this.wrapper = wrapper;
		this.on_close_cart = onClose;

		this.prepare_payment_cart();
		console.log("hello from payment cart")
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

		this.cart_content_top_section.append('<div id="cashBox"><div id="cashBoxTitle" class="title">Cash</div><input type="float" id="cachInput" ></div>')
		this.cart_content_top_section.append('<div id="redeemLoyaltyPoints"><div id="redeemLoyaltyPointsTitle" class="title">Redeem Loyalty Points</div><input type="float" id="RedeemLayoutPointsInput" disabled></div>')

		this.cart_content_bottom_section.append('<h4>Additional Information</h4>')

		this.cart_footer.append('<div id="paymentDetailsContainer" class="rowBox align_center"></div>');
		this.cart_footer.append('<button type="button" id="completeOrderBtn">Complete Order</button>');

		this.payment_details = this.cart_footer.find('#paymentDetailsContainer')
		this.payment_details.append('<div id="paymentGrandTotal" class="columnBox"><div id="paymentGrandTotalTitle" class="rowBox centerItem">Grand Total</div><div id="paymentGrandTotalValue"  class="rowBox centerItem"> ...DA  </div></div>')
		this.payment_details.append('<hr>')
		this.payment_details.append('<div id="paymentPaidAmount" class="columnBox"><div id="paymentPaidAmountTitle" class="rowBox centerItem">Paid Amount</div><div id="paimentPaidAmountValue"  class="rowBox centerItem"> ...DA </div></div>')
		this.payment_details.append('<hr>')
		this.payment_details.append('<div id="paymentToBePaid" class="columnBox"><div id="paimentToBePaidTitle" class="rowBox centerItem">To Be Paid</div><div id="paimentToBePaidValue"  class="rowBox centerItem"> ...DA </div></div>')

	}


	showCart(){
		console.log('show payment cart')
		this.cart.css('display' , 'flex');
	}

	hideCart(){
		this.cart.css('display' , 'none');
	}


}
