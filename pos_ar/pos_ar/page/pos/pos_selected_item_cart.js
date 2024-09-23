
pos_ar.PointOfSale.pos_selected_item_cart = class{


	constructor(
		wrapper ,
		selectedItemMap,
		onSelectedItemClick,
		onCheckoutClick,
	){
		this.wrapper = wrapper;
		this.selected_item_map      = selectedItemMap;
		this.on_checkout_click      = onCheckoutClick;
		this.on_selected_item_click = onSelectedItemClick;

		this.prepare_selected_item_cart();
	}



	/********************************* ui *****************************************/

	prepare_selected_item_cart(){
		this.wrapper.append('<div id="CartBox" class="columnBox"></div>')

		this.cartBox = this.wrapper.find("#CartBox")
		this.cartBox.append('<div id="CartBoxTopBar" class=" rowBox align_center  row_sbtw"><div>')
		this.cartBox.append('<div id="cartHeader" class="rowBox row_sbtw align_center"></div>')
		this.cartBox.append('<div id="selectedItemsContainer" class="columnBox"></div>')
		this.cartBox.append('<div id="cartFooter" class="columnBox"></div>')

		this.cartTopBar = this.cartBox.find('#CartBoxTopBar')
		this.cartTopBar.append('<h4 class="CartTitle">Item Cart</h4>')
		this.cartTopBar.append('<div id="selectedItemsPriceListInput"></div>')

		this.priceListInput = this.cartTopBar.find("#selectedItemsPriceListInput")
		this.priceListInput.append('<input list="PriceList"  id="PriceListInput" name="PriceList" placeHolder="Choice a Price list">')
		this.priceListInput.append(' <datalist id="PriceList"></datalist>')

		this.cartHeader = this.cartBox.find('#cartHeader')
		this.cartHeader.append('<div><h6>Item</h6></div>')
		this.cartHeader.append('<div id="cartHeaderTitles" class="rowBox"></div>')

		this.cartHeaderTitles = this.cartHeader.find('#cartHeaderTitles')
		this.cartHeaderTitles.append('<div id="quantityTitle"><h6>Quantity</h6></div>')
		this.cartHeaderTitles.append('<div id="amountTitle">  <h6>Amount  </h6></div>')

		this.selectedItemContainer = this.cartBox.find('#selectedItemsContainer')




		this.cartFooter = this.cartBox.find('#cartFooter')
		this.cartFooter.append('<div id="cartDetails" class="columnBox"></div>')
		this.cartFooter.append('<div id="editSelectedItemCart"></div>')
		this.cartFooter.append('<button type="button" id="checkoutBtn"> Checkout </button>')

		this.cartDetails = this.cartFooter.find('#cartDetails')
		this.cartDetails.append('<div id="discount" class="rowBox align_center row_sbtw"></div>')
		this.cartDetails.append('<div id="totalQuantity" class="rowBox align_center row_sbtw"></div>')
		this.cartDetails.append('<div id="netTotal" class="rowBox align_center row_sbtw"></div>')
		this.cartDetails.append('<div id="grandTotal" class="rowBox align_center row_sbtw"></div>')

		this.discount      = this.cartDetails.find('#discount')
		this.discount.append('<div id="addDiscountTitle">Add Discount</div>')
		this.discount.append('<div id="addDiscountValue"></div>')

		this.totalQuantity = this.cartDetails.find('#totalQuantity')
		this.totalQuantity.append('<div id="totalQuantityTitle">Total Quantity</div>')
		this.totalQuantity.append('<div id="totalQuantityValue">0</div>')

		this.netTotal      = this.cartDetails.find('#netTotal')
		this.netTotal.append('<div id="netTotalTitle">Net Total</div>')
		this.netTotal.append('<div id="netTotalValue">0.00</div>')

		this.grandTotal    = this.cartDetails.find('#grandTotal')
		this.grandTotal.append('<div id="grandTotalTitle">Grand Total</div>')
		this.grandTotal.append('<div id="grandTotalValue">0.00</div>')

		this.editSelectedItem = this.cartFooter.find('#editSelectedItemCart')
		this.editSelectedItem.append('<div class="grid-container">')

		this.buttonsContainer = this.editSelectedItem.find('.grid-container')
		this.buttonsContainer.append('<button id="key_1"        class="grid-item">1</button>')
		this.buttonsContainer.append('<button id="key_2"        class="grid-item">2</button>')
		this.buttonsContainer.append('<button id="key_3"        class="grid-item">3</button>')
		this.buttonsContainer.append('<button id="key_quantity" class="grid-item">Quantity</button>')
		this.buttonsContainer.append('<button id="key_4"        class="grid-item">4</button>')
		this.buttonsContainer.append('<button id="key_5"        class="grid-item">5</button>')
		this.buttonsContainer.append('<button id="key_6"        class="grid-item">6</button>')
		this.buttonsContainer.append('<button id="key_rate"     class="grid-item">Rate</button>')
		this.buttonsContainer.append('<button id="key_7"        class="grid-item">7</button>')
		this.buttonsContainer.append('<button id="key_8"        class="grid-item">8</button>')
		this.buttonsContainer.append('<button id="key_9"        class="grid-item">9</button>')
		this.buttonsContainer.append('<button id="key_discount" class="grid-item">Discount</button>')
		this.buttonsContainer.append('<button id="key_point"    class="grid-item">.</button>')
		this.buttonsContainer.append('<button id="key_0"        class="grid-item">0</button>')
		this.buttonsContainer.append('<button id="key_delete"   class="grid-item">Delete</button>')
		this.buttonsContainer.append('<button id="key_remove"   class="grid-item" style="color:red;font-weight:700;">Remove</button>')

		this.checkoutBtn = this.cartFooter.find('#checkoutBtn')
		this.checkoutBtn.on('mousedown' , event =>{
			this.on_checkout_click();
		})
	}




	refreshSelectedItem(){


		const selectedItemsContainer = document.getElementById("selectedItemsContainer");
		selectedItemsContainer.innerHTML = "";

		this.selected_item_map.forEach((item,itemId) =>{
			const itemElement   = document.createElement("div");
			const leftGroup     = document.createElement("div");
			const rightGroup    = document.createElement("div");
			const itemName      = document.createElement("h5") ;
			const itemQuantity  = document.createElement("div") ;
			const itemPrice     = document.createElement("div") ;

			//image
			//check if there is an image or not
			if(item.image){
				const itemImage   = document.createElement("img");
	                        itemImage.src = item.image ;
        	                itemImage.classList.add("selectedItemImage");
                	        leftGroup.appendChild(itemImage);
			}else{
				const itemImageHolder = document.createElement("div");
				const itemImageLatter = document.createElement("div");

				itemImageHolder.classList.add("selectedItemImage" , "rowBox" , "centerItem");

				itemImageLatter.textContent = item.name[0]
				itemImageHolder.appendChild(itemImageLatter);
				leftGroup.appendChild(itemImageHolder);
			}


			//name
			itemName.textContent = item.name;
			itemName.classList.add("selectedItemName");
			leftGroup.appendChild(itemName);

			//quantity
			itemQuantity.textContent = item.quantity
			itemQuantity.classList.add("itemQuantity");
			rightGroup.appendChild(itemQuantity);
			//price
			itemPrice.textContent = item.amount + " DA"
			itemPrice.classList.add("itemPrice");
			rightGroup.appendChild(itemPrice);

			//leftGroup
			leftGroup.classList.add("rowBox" , "align_center" , "leftGroup")
			itemElement.appendChild(leftGroup);

			//rightGroup
			rightGroup.classList.add("rowBox" , "align_center" , "rightGroup")
			itemElement.appendChild(rightGroup);


			//item
			itemElement.classList.add("rowBox" , "align_center" , "row_sbtw" , "ItemElement" , "pointer")
			itemElement.addEventListener("click" , event =>{
				console.log("we are click")
				this.makeItemHighlight(itemElement)
				this.on_selected_item_click(item);
				//expose the item as selected one
				//selectedItem = item
				//makeItemHighlight(itemElement);
				//renderItemDetailsCart(item);
			})

			selectedItemsContainer.appendChild(itemElement);

		})

	}


	showKeyboard(){
		this.editSelectedItem.css('display','flex')
	}

	hideKeyboard(){
		this.editSelectedItem.css('display','none')
	}

	setKeyboardOrientation( orientation ){

		const discount   = this.cartDetails.find('#discount')
		const quantity   = this.cartDetails.find('#totalQuantity')
		const netTotal   = this.cartDetails.find('#netTotal')
		const grandTotal = this.cartDetails.find('#grandTotal')

		if(orientation == "landscape"){
			this.cartDetails.css('display' , 'flex')
			this.cartDetails.addClass('rowBox align_center')
			this.cartDetails.removeClass('columnBox')
			discount.css('display' , 'none')

			//make the text smaller
			quantity.css('font-size' , 'smaller')
			netTotal.css('font-size' , 'smaller')
			grandTotal.css('font-size' , 'small')
			grandTotal.css('font-weight' , '500')
		}
		else{
			this.cartDetails.addClass('columnBox')
			this.cartDetails.removeClass('rowBox')
			discount.css('display','flex')

			//reset
			quantity.css('font-size'   , 'small' )
			netTotal.css('font-size'   , 'small' )
			grandTotal.css('font-size' , 'larger')
			grandTotal.css('font-weight' , '700' )
		}
	}

	/*************************  tools  **********************************/


	calculateNetTotal(){
		let netTotal = 0;
		this.selected_item_map.forEach((value,key) =>{
			netTotal += value.quantity * value.amount
		})

		const netTotal_HTML = document.getElementById("netTotalValue");
		netTotal_HTML.textContent = netTotal;
	}

	calculateQnatity(){
		let quantity = 0;
		this.selected_item_map.forEach((value,key) =>{
			quantity += value.quantity
		})

		const totalQuantity_HTML = document.getElementById("totalQuantityValue");
		totalQuantity_HTML.textContent = quantity;
	}

	calculateGrandTotal(){
		let grandTotal = 0;
		this.selected_item_map.forEach((value,key) =>{
			grandTotal += value.quantity * value.amount
		})

		const grandTotal_HTML = document.getElementById("grandTotalValue");
		grandTotal_HTML.textContent = grandTotal;
	}

	makeItemHighlight(itemElement){
		const selectedItemsContainer = document.getElementById("selectedItemsContainer");
		const selectedItems = selectedItemsContainer.querySelectorAll(".selected")
		selectedItems.forEach(selectedItem=>{
			selectedItem.classList.remove("selected");
		})
		itemElement.classList.add("selected")
	}

	cleanHeighlight(){
		const selectedItemsContainer = document.getElementById("selectedItemsContainer");
		const selectedItems = selectedItemsContainer.querySelectorAll(".selected")
		selectedItems.forEach(selectedItem=>{
			selectedItem.classList.remove("selected");
		})

	}


}
