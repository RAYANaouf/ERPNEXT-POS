
pos_ar.PointOfSale.pos_selected_item_cart = class{


	constructor(
		wrapper          ,
		selectedItemMaps ,
		salesTaxes      ,
		selectedTab      ,
		selectedItem     ,
		selectedField    ,
		onSelectedItemClick,
		onTabClick       ,
		onKeyPressed     ,
		onCheckoutClick  ,
	){
		this.wrapper                 = wrapper;
		this.selected_item_maps      = selectedItemMaps;
		this.sales_taxes             = salesTaxes     ;
		this.selected_tab            = selectedTab     ;
		this.selected_item           = selectedItem    ;
		this.selected_field          = selectedField   ;
		this.on_key_pressed          = onKeyPressed    ;
		this.on_checkout_click       = onCheckoutClick ;
		this.on_selected_item_click  = onSelectedItemClick;
		this.on_tab_click            = onTabClick      ;

		//local
		this.net_total   = 0 ;
		this.grand_total = 0 ;
		this.taxes_map   = new Map();
		this.counter    = 1 ;

		this.start_work();
	}



	// start the class function
	start_work(){
		this.prepare_selected_item_cart();
		this.setButtonsListeners();
		this.setListener()
	}

	/********************************* ui *****************************************/

	prepare_selected_item_cart(){

		this.wrapper.append('<div id="tabs"    class="rowBox"><div id="tabs_container" class="rowBox"></div></div>')
		this.wrapper.append('<div id="CartBox" class="columnBox"></div>')


		this.tabs_bar       = this.wrapper.find("#tabs")
		this.tabs_container = this.tabs_bar.find('#tabs_container')
		this.cartBox        = this.wrapper.find("#CartBox")


		this.tabs_container.append('<div class="tab selected">C1</div>')
		this.tabs_bar.append('<div id="addTabBtn" class="tab unselected">+</div>')

		this.add_tab_button = this.tabs_bar.find('#addTabBtn')

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
		this.cartDetails.append('<div id="VAT" class="columnBox"></div>')
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

		this.vat           = this.cartDetails.find('#VAT')
		this.sales_taxes.forEach( tax =>{
			this.vat.append(`<div id="taxConatiner_${tax.name}" class="rowBox align_center row_sbtw"></div>`)
			const taxContainer = this.vat.find(`#taxConatiner_${tax.name}`)
			taxContainer.append(`<div id="tax_${tax.name}_Title">${tax.description}</div>`)
			taxContainer.append(`<div id="tax_${tax.name}_Value">0.00</div>`)
		})

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



	refreshTabs(){
		//clear the tabs_container
		this.tabs_container.empty()

		for(let key of this.selected_item_maps.keys() ){
			if(key == this.selected_tab.tabName){
				this.tabs_container.append(`<div class="tab selected">${key}</div>`)
			}
			else{
				this.tabs_container.append(`<div class="tab">${key}</div>`)
			}
		}

		this.tabs_container.find(".tab").on('click' , (event)=>{
			const clickedTab = $(event.target).text()

			this.selected_tab.tabName = clickedTab

			//update UI
			this.refreshTabs();
			this.refreshSelectedItem();
			this.calculateNetTotal();
			this.calculateQnatity();
			this.calculateGrandTotal();

			this.on_tab_click(clickedTab);

			console.log("clicked tab ==> " , clickedTab)
		})
	}


	refreshSelectedItem(){



		const selectedItemsContainer = document.getElementById("selectedItemsContainer");
		selectedItemsContainer.innerHTML = "";

		this.selected_item_maps.get(this.selected_tab.tabName).items.forEach( item  =>{

			//console.log("item >==>>>> " , item)

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
			itemQuantity.textContent = item.qty
			itemQuantity.classList.add("itemQuantity");
			rightGroup.appendChild(itemQuantity);
			//price
			itemPrice.textContent = (item.rate - item.discount_amount) + " DA"
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
			if(item.name == this.selected_item.name)
				itemElement.classList.add("selected")
			itemElement.addEventListener("click" , event =>{
				console.log("we are click")
				this.makeItemHighlight(itemElement)
				this.on_selected_item_click(item);
			})

			selectedItemsContainer.appendChild(itemElement);

		})

		this.calculateNetTotal();
		this.calculateQnatity();
		this.calculateGrandTotal();
	}

	createNewTab(){
			this.counter += 1 ;
			let initPos   = frappe.model.get_new_doc('POS Invoice');
			initPos.items  = [];
			this.selected_item_maps.set(`C${this.counter}` , initPos)
			this.selected_tab.tabName = `C${this.counter}`

			//update UI
			this.refreshTabs()
			this.refreshSelectedItem()
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

	makeSelectedButtonHighlighted(){
		const quantityButton = this.buttonsContainer.find('#key_quantity')
		const rateButton     = this.buttonsContainer.find('#key_rate')
		const discountButton = this.buttonsContainer.find('#key_discount')

		if(this.selected_field.field_name == "quantity"){
			quantityButton.addClass('selected')
			rateButton.removeClass('selected')
			discountButton.removeClass('selected')
		}
		else if(this.selected_field.field_name == "rate"){
			quantityButton.removeClass('selected')
			rateButton.addClass('selected')
			discountButton.removeClass('selected')
		}
		else if(this.selected_field.field_name == "discount_percentage"){
			quantityButton.removeClass('selected')
			rateButton.removeClass('selected')
			discountButton.addClass('selected')
		}
		else{
			quantityButton.removeClass('selected')
			rateButton.removeClass('selected')
			discountButton.removeClass('selected')
		}

	}


	//hide
	hideCart(){

		this.tabs_bar.css('display' , 'none');
		this.cartBox.css('display' , 'none');
	}
	/************************  set listeners  ***************************/

	setButtonsListeners(){
		const key_0        = this.buttonsContainer.find('#key_0')
		const key_1        = this.buttonsContainer.find('#key_1')
		const key_2        = this.buttonsContainer.find('#key_2')
		const key_3        = this.buttonsContainer.find('#key_3')
		const key_4        = this.buttonsContainer.find('#key_4')
		const key_5        = this.buttonsContainer.find('#key_5')
		const key_6        = this.buttonsContainer.find('#key_6')
		const key_7        = this.buttonsContainer.find('#key_7')
		const key_8        = this.buttonsContainer.find('#key_8')
		const key_9        = this.buttonsContainer.find('#key_9')
		const key_quantity = this.buttonsContainer.find('#key_quantity')
		const key_discount = this.buttonsContainer.find('#key_discount')
		const key_rate     = this.buttonsContainer.find('#key_rate')
		const key_remove   = this.buttonsContainer.find('#key_remove')
		const key_delete   = this.buttonsContainer.find('#key_delete')
		const key_point    = this.buttonsContainer.find('#key_point')

		let keys = [key_0 , key_1 , key_2 , key_3 , key_4 , key_5 , key_6 , key_7 , key_8 , key_9 , key_quantity , key_discount , key_rate , key_remove , key_delete , key_point]


		keys.forEach(key =>{
			key.on('mousedown' , (event)=>{
				event.preventDefault();
				const keyContent = key.text();

				if(!isNaN(keyContent)){
					this.on_key_pressed( "addToField" , key.text())
				}
				else if(keyContent == "."){
					this.on_key_pressed( "addToField" , key.text())
				}
				else if(keyContent == "Quantity"){
					this.on_key_pressed( "quantity" , null)
				}
				else if(keyContent == "Rate"){
					this.on_key_pressed( "rate" , null)
				}
				else if(keyContent == "Discount"){
					this.on_key_pressed( "discount" , null)
				}
				else if(keyContent == "Remove"){
					this.on_key_pressed( "remove" , null)
				}
				else if(keyContent == "Delete"){
					this.on_key_pressed( "delete" , null)
				}

			})
		})

	}

	setListener(){

		this.add_tab_button.on('mousedown' , (event)=>{
			this.createNewTab()
		})

	}

	/*************************  tools  **********************************/


	calculateNetTotal(){
		let netTotal = 0;
		this.selected_item_maps.get(this.selected_tab.tabName).items.forEach( item => {
			netTotal += item.rate * item.qty
		})
		const netTotal_HTML = document.getElementById("netTotalValue");
		netTotal_HTML.textContent = netTotal;
		this.net_total = netTotal ;
		this.calculateVAT()
	}

	calculateVAT(){

		console.log("VAT ========> start ");

		this.sales_taxes.forEach( tax =>{
			let saleTaxAmount = 0 ;
			let taxPercentage = (tax.rate / 100)
			this.taxes_map.set(tax.name , this.net_total * taxPercentage)
			const tax_HTML = document.getElementById(`tax_${tax.name}_Value`);
			tax_HTML.textContent = this.taxes_map.get(tax.name);
		})
	}

	calculateQnatity(){
		let quantity = 0;

		this.selected_item_maps.get(this.selected_tab.tabName).items.forEach( item => {
			quantity += item.qty
		})

		const totalQuantity_HTML = document.getElementById("totalQuantityValue");
		totalQuantity_HTML.textContent = quantity;
	}

	calculateGrandTotal(){
		let grandTotal = 0;


		this.selected_item_maps.get(this.selected_tab.tabName).items.forEach( item => {
			grandTotal += item.qty * item.rate
		})

		const grandTotal_HTML = document.getElementById("grandTotalValue");
		grandTotal_HTML.textContent = grandTotal;

		this.grand_total = grandTotal ;
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
