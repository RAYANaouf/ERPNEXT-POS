

pos_ar.PointOfSale.pos_history = class {

	constructor(
		wrapper
	){
		console.log("im pos history")
	}



	start_work(){
		this.prepare_selected_item_cart();
	}

	prepare_selected_item_cart(){
		this.wrapper.append('<div id="historyContainer"></div>')
		this.container = this.wrapper.find('#historyContainer')
	}

}
