
pos_ar.PointOfSale.pos_payment_cart = class{

	constructor(
		wrapper,
		selectedItemMap,
		selectedTab,
		appData,
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
		this.app_data                = appData               ;
		this.payment_methods         = paymentMethods        ;
		this.selected_payment_method = selectedPaymentMythod ;
		this.invoice_data            = invoiceData           ;
		this.on_close_cart           = onClose               ;
		this.on_complete             = onComplete            ;
		this.on_input                = onInput               ;

		this._payment_method = this.payment_methods[0]

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


		this.payment_methods.forEach(method =>{
			const selected    = this._payment_method.name == method.name ? "selected" : "" ;
			const amountField = this.getModeOfPaymentById(method.mode_of_payment).type == 'Phone' ? "display:none;" : ""
			this.cart_content_top_section.append(`<div id="${method.name}" class="paymentMethodBox ${selected}"><div id="BoxTitle" class="title ${selected}">${method.mode_of_payment}</div><input type="number" id="cachInput" class="paymentInput" value="0" style="${amountField}"  ></div>`)
		})


		this.cart_content_bottom_section.append('<h4>Additional Information</h4>')

		this.cart_footer.append('<div id="paymentDetailsContainer" class="rowBox align_center"></div>');
		this.cart_footer.append('<button class="posBtn1" type="button" id="completeOrderBtn">Complete Order</button>');

		this.payment_details = this.cart_footer.find('#paymentDetailsContainer')
		this.payment_details.append('<div class="columnBox"><div id="paymentGrandTotalTitle" class="rowBox centerItem">Grand Total</div><div id="paymentGrandTotalValue" class="rowBox centerItem"></div></div>')
		this.payment_details.append('<hr>')
		this.payment_details.append(`<div id="paymentPaidAmount" class="columnBox"><div id="paymentPaidAmountTitle" class="rowBox centerItem">Paid Amount</div><div id="paimentPaidAmountValue"  class="rowBox centerItem"> 0 DA </div></div>`)
		this.payment_details.append('<hr>')
		this.payment_details.append(`<div id="paymentToChange" class="columnBox"><div id="paimentToChangeTitle" class="rowBox centerItem">To Change</div><div id="paimentToChangeValue"  class="rowBox centerItem"> ${this.calculateToChange()} DA </div></div>`)

	}



	preparDefault(){
		this.calculateGrandTotal();
		// Get the selected payment method's box
		const selectedBox = $(`#${this._payment_method.name}`);
		if (selectedBox.length) {
			// Set the input field value to grandTotal
			selectedBox.find('.paymentInput').val(this.invoice_data.grandTotal);

			// Update the payment method amount in the map
			this.selected_item_map.get(this.selected_tab.tabName).payments.forEach(mode => {
				if (mode.mode_of_payment == this._payment_method.mode_of_payment) {
					mode.amount = this.invoice_data.grandTotal;
				}
			});

			// Update paid amount and change display
			this.updatePaidAmount();
			this.updateToChange();
		}
	}


	showCart(){
		this.cart.css('display' , 'flex');
		this.preparDefault();
		//this.clearData();
	}

	hideCart(){
		this.cart.css('display' , 'none');
	}


	/*clearData(){

		this.invoice_data.paidAmount = 0 ;
		this.invoice_data.toChange = 0 ;

		//this.cashBox.find('#cachInput').val(0)

		this.calculateGrandTotal();
		this.updateToChange();
		this.refreshPaidAmount();

	}*


	refreshData(){
		console.log("refreshing data")

		//this.cashBox.find('#cachInput').val(this.invoice_data.paidAmount)

		this.calculateGrandTotal();
		this.calculateToChange();
		this.refreshPaidAmount();

	}

	/****************************************  listeners  ***********************************************/

	setListeners(){

		const me = this
		// Use event delegation to handle clicks
		this.cart_content_top_section.on('click', '.paymentMethodBox', function () {
			// Remove 'selected' class from all .paymentMethodBox elements
			$('.paymentMethodBox').removeClass('selected');
			$('.paymentMethodBox div.title').removeClass('selected');
			//add to clicked ones
			$(this).addClass('selected')
			$(this).find('.title').addClass('selected')
			const clickedId = $(this).attr('id')
			me.payment_methods.forEach(method=>{
				if(method.name == clickedId){
					me._payment_method = method
				}
			})

			// Reset input fields in all other boxes
			$('.paymentMethodBox').not(this).find('.paymentInput').val(0);
 			// Set the selected box input field to grandTotal
			$(this).find('.paymentInput').val(me.invoice_data.grandTotal);

			me.selected_item_map.get(me.selected_tab.tabName).payments.forEach(mode =>{
				if(mode.mode_of_payment != me._payment_method.mode_of_payment){
					mode.amount = 0
				}
				else{
					//check if not pay
					if(me.getModeOfPaymentById(mode.mode_of_payment).type == "Phone" ){
						mode.amount = 0
					}else{
						mode.amount = me.invoice_data.grandTotal
					}
				}
			})
			me.updatePaidAmount()
			me.updateToChange()
		});



		// Add a listener for all inputs within .paymentMethodBox
		this.cart_content_top_section.on('input', '.paymentInput', function () {

			const inputValue = parseFloat($(this).val()) || 0; // Get the input value
			const boxId = $(this).closest('.paymentMethodBox').attr('id'); // Get the box ID

			me.selected_item_map.get(me.selected_tab.tabName).payments.forEach(mode =>{
				if(mode.mode_of_payment == me._payment_method.mode_of_payment){
					mode.amount = parseFloat(inputValue)
				}
			})
			me.updatePaidAmount()
			me.updateToChange()
		});


		/*
		this.cashBox.find('#cachInput').on('focus' , (event)=>{
			this.on_input('focus' , 'cash' , null)
		})
		*/


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

		/*
		let previousValue = this.cashBox.find('#cachInput').val() ;
		// Check if the previous value contains a period (.)
		if( previousValue.includes('.') && key == "."){
			return ;
		}
		// Append the key to the paidAmount if there is no period
		this.invoice_data.paidAmount += key;
		// Refresh the payment cart
		this.refreshData();*/
	}

	deleteKeyPress(){

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


	calculatePaidAmount(){
		let paidAmountDA = 0;
		this.selected_item_map.get(this.selected_tab.tabName).payments.forEach(mode =>{
			paidAmountDA += mode.amount
		})
		return paidAmountDA
	}

	updatePaidAmount(){
		this.payment_details.find('#paimentPaidAmountValue').text(`${this.calculatePaidAmount()} DA`)
	}


	calculateToChange(){
		console.log("see why the error " , " calculatePaidAmount " ,  this.calculatePaidAmount() , " grandTotal " , this.invoice_data.grandTotal)
		return this.calculatePaidAmount() - this.invoice_data.grandTotal
	}


	updateToChange(){
		this.payment_details.find('#paimentToChangeValue').text(`${this.calculateToChange().toFixed(2)} DA`)
	}


	calculateGrandTotal(){
		this.payment_details.find('#paymentGrandTotalValue').text(`${this.invoice_data.grandTotal.toFixed(2)} DA`)
		return parseFloat(this.invoice_data.grandTotal.toFixed(2))
	}




	getModeOfPaymentById(id){
		let r = null
		this.app_data.posProfileModeOfPayments.forEach(mode=>{
			if(mode.name == id){
				r = mode
			}
		})
		return r
	}

}
