
pos_ar.PointOfSale.pos_selected_item_cart = class{
	constructor(wrapper){
		this.wrapper = wrapper;
		this.prepare_selected_item_cart();
	}

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
	}
}
