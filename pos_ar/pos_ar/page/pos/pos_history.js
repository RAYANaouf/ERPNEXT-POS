

pos_ar.PointOfSale.pos_history = class {

	constructor(
		wrapper
	){
		this.wrapper = wrapper;

		this.start_work();
	}



	start_work(){
		console.log("we are heeeeeeeeeeeeeeeeeeeeeeeere")
		this.prepare_selected_item_cart();
	}

	prepare_selected_item_cart(){
		this.wrapper.find('#LeftSection').append('<div id="historyLeftContainer"></div>')
		this.wrapper.find('#RightSection').append('<div id="historyRightContainer"></div>')

		this.left_container  = this.wrapper.find('#historyLeftContainer')
		this.right_container = this.wrapper.find('#historyRightContainer')

		//left
		this.left_container.append('<div id="historyLeftContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">POS Order</h4></div>')

		this.right_container.append('<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4></div>')
	}


	//show and hide
	show_cart(){
		this.left_container.css('display' , 'flex');
		this.right_container.css('display' , 'flex');
	}

	//hide and hide
	hide_cart(){
		this.left_container.css('display' , 'none');
		this.right_container.css('display' , 'none');
	}




}
