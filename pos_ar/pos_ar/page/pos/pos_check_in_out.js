pos_ar.PointOfSale.pos_check_in_out = class {

	constructor(
		wrapper,
		db
	){

		console.log(" hello from checkInOut class!")

		this.wrapper   = wrapper;
		this.db        = db;

		this.start_work();
	}

	start_work(){
		this.prepare_checkInOut_cart();
	}

	/****************************************    UI    *******************************************************/

	prepare_checkInOut_cart(){
		this.wrapper.find('#LeftSection').append('<div id="checkInOutLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="checkInOutRightContainer" class="columnBox"></div>')

		this.left_container  = this.wrapper.find('#checkInOutLeftContainer')
		this.right_container = this.wrapper.find('#checkInOutRightContainer')


	}

	showCart(){
		this.left_container.css('display','flex')
		this.right_container.css('display','flex')
	}
	hideCart(){
		this.left_container.css('display','none')
		this.right_container.css('display','none')
	}

}
