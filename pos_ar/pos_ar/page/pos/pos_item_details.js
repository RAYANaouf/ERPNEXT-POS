
pos_ar.PointOfSale.pos_item_details = class{

	constructor(
		wrapper
	){
		this.wrapper = wrapper
		this.prepare_item_details_cart()
	}

	prepare_item_details_cart(){
		this.wrapper.append('<div id="itemDetailsCart" class="columnBox align_center"><div>')

		this.item_details_cart = this.wrapper.find("#itemDetailsCart")

	}

}
