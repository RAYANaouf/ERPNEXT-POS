
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





		// Add popover element
		this.wrapper.append(`
			<div id="AlertPopover" popover>
				<div class="AlertPopover-header">
					<h2>Notice</h2>
				</div>
				<div class="AlertPopover-content">
					<!-- Content will go here -->
					<p></p>
				</div>
				<div class="AlertPopover-footer">
					<button class="btn btn-primary" id="AlertPopoverConfirmBtn">Done</button>
				</div>
			</div>
		`)

		
		// Add styles for the invoice popup
		const style = document.createElement('style');
		style.textContent = `
			#AlertPopover {
				min-width: 600px !important;
				max-width: 80vw !important;
			}
			#AlertPopover-content {
				width: 100%;
				padding: 0;
			}
		`;
		document.head.appendChild(style);









		this.wrapper.append('<div id="paymentMethodCart" class="columnBox align_center"></div>')
		this.paymentCart = this.wrapper.find('#paymentMethodCart')

                this.paymentCart.append(
                                `<script src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs" type="module"></script>`+
                                `<div id="payment_waitingContainer" style="position:absolute;background:#00000050;top:0;left:0;inset: 0;display:none;backdrop-filter: blur(2px);z-index: 10;" class="rowBox centerItem" ><dotlottie-player src="https://lottie.host/d6c76206-aab9-4d5a-af73-c4a6cfc5aaa9/H8vnpKcKj9.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player></div>`
                )

		this.waiting_cart = this.wrapper.find('#payment_waitingContainer')

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

		//reset selected method
		this._payment_method = this.payment_methods[0]
		//reset style for  method box
		this.cart_content_top_section.find('.paymentMethodBox').removeClass('selected');
		this.cart_content_top_section.find(`.paymentMethodBox#${this._payment_method.name}`).addClass('selected');
		this.cart_content_top_section.find('.paymentMethodBox .title').removeClass('selected');
		this.cart_content_top_section.find(`.paymentMethodBox#${this._payment_method.name} .title`).addClass('selected');



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

	show_waiting(){
		console.log("we are heeer display" , this.waiting_cart)
		this.waiting_cart.css('display' , 'flex')
	}
	hide_waiting(){
		console.log("we are heeer for hide")
		this.waiting_cart.css('display' , 'none')
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


		
		const popover = document.getElementById('AlertPopover');


		const btn = document.querySelector('#AlertPopoverConfirmBtn');

		// 💡 Now attach the event listener AFTER the element is added
		btn.addEventListener('click', () => {
			console.log("confirm btn clicked");
			document.getElementById("AlertPopover").hidePopover(); // if native popover
		});


		this.cart_footer.find("#completeOrderBtn").on('click', (event) => {


			let error_message = "";
			let popover_title = "";



			var paidAmount = 0;
			var cost       = 0;
			this.selected_item_map.get(this.selected_tab.tabName).items.forEach(item =>{
				cost += item.rate * item.qty;
			})
			this.selected_item_map.get(this.selected_tab.tabName).payments.forEach(mode =>{
				paidAmount += mode.amount;
			})

			if(paidAmount < cost && this.selected_item_map.get(this.selected_tab.tabName).customer.toLowerCase().includes("public")){
				error_message = "Public customer can't pay less than cost.";
				popover_title = "Payment Error";
			}


			this.selected_item_map.get(this.selected_tab.tabName).items.forEach(item => {
				if (item.qty == 0) {
					error_message = "You have an item with quantity 0.";
					popover_title = "Quantity Alert";
				}
				if (item.rate == 0) {
					error_message = "You have an item with rate 0.";
					popover_title = "Rate Alert";
				}
			});

			if (error_message !== "") {
				this.wrapper.find(".AlertPopover-header h2").text(popover_title);
				this.wrapper.find(".AlertPopover-content").html(`<p>${error_message}</p>`);
				popover.togglePopover();
			} else {
				frappe.confirm('Submit the invoice ?',
					() => { this.on_complete(); },
					() => { /* cancelled */ }
				);
			}
		});




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
