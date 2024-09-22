
pos_ar.PointOfSale.pos_item_details = class{

	constructor(
		wrapper
	){
		console.log("hello from item_details 0")
		this.wrapper = wrapper
		this.prepare_item_details_cart()
	}

	prepare_item_details_cart(){
		this.wrapper.append('<div id="itemDetailsCart" class="columnBox align_center"><div>')

		this.item_details_cart = this.wrapper.find("#itemDetailsCart")
		this.item_details_cart.append('<div id="itemDetailsCartHeader" class="rowBox header align_center row_sbtw"></div>')

		this.cart_header = this.item_details_cart.find('#itemDetailsCartHeader')
		this.cart_header.append('<h4 class="CartTitle">Item Details</h4>')
		this.cart_header.append('<img src="/assets/pos_ar/images/cancel.png" alt="Cancel Button" id="itemDetailsCartXBtn" class="xBtn">')

		this.item_details_cart.append('<div id="itemDetailsHeader" class="rowBox"></div>')

		this.header_details = this.item_details_cart.find('#itemDetailsHeader')
		this.header_details.append('<div id="detailsItemImage" class="rowBox centerItem"></div>')
		this.header_details.append('<div id="price_and_name" class="columnBox"></div>')

		this.price_and_name_details = this.header_details.find('#price_and_name')
		this.price_and_name_details.append('<div id="detailsItemName" class="rowBox align_center"></div>')
		this.price_and_name_details.append('<div id="detailsItemGroupWarhouseContainer" class="rowBox align_center row_sa"></divr>')

		this.item_group_warehouse_details = this.price_and_name_details.find('#detailsItemGroupWarhouseContainer')
		this.item_group_warehouse_details.append('<div id="detailsItemGroup" class="rowBox align_center">Group : ...</div>')
		this.item_group_warehouse_details.append('<div id="detailsItemWarehouse" class="rowBox align_center">Warehouse : ...</div>')

		this.item_details_cart.append('<div id="itemDetailsAll"  class="rowBox"></div>')

		this.details_all = this.item_details_cart.find('#itemDetailsAll')
		this.details_all.append('<div id="itemDetails_C1" class="columnBox"></div>')

		this.c1 = this.details_all.find('#itemDetails_C1')
		this.c1.append('<div class="columnBox"><label for="itemDetailsQuantityInput">Quantity</label><input type="float" id="itemDetailsQuantityInput" class="pointerCursor"></div>')
		this.c1.append('<div class="columnBox"><label for="itemDetailsRateInput">Rate</label><input type="float" id="itemDetailsRateInput" class="pointerCursor"></div>')
		this.c1.append('<div class="columnBox"><label for="itemDetailsDiscountInput">Discount (%)</label><input type="float" id="itemDetailsDiscountInput" class="pointerCursor"></div>')
		this.c1.append('<div class="columnBox"><label for="itemDetailsAvailableInput">Available Qty at Warehouse</label><input type="float" id="itemDetailsAvailableInput" disabled></div>')


		this.details_all.append('<div id="itemDetails_C2" class="columnBox"></div>')

		this.c2 = this.details_all.find('#itemDetails_C2')
		this.c2.append('<div class="columnBox"><label for="itemDetailsUomInput">UOM *</label><input type="text" id="itemDetailsUomInput"  disabled></div>')
		this.c2.append('<div class="columnBox"><label for="detailsPriceList">Price List *</label><input list="detailsPriceList" id="detailsItemPriceListInput" class ="rowBox align_center pointerCursor"><datalist id="detailsPriceList"><option>fetching Price Lists ...</option></datalist></div>')
		this.c2.append('<div class="columnBox"><label for="itemDetailsPriceListRateInput">Price List Rate</label><input type="text" id="itemDetailsPriceListRateInput" disabled></div>')



	}

	show_cart(){
		console.log('show 01')
		this.item_details_cart.css("display" , "flex");
	}

	hide_cart(){
		console.log('hide')
		//this.item_details_cart.css("display" , "none");
	}

}
