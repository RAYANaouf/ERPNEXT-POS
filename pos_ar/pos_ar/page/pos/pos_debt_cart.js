
pos_ar.PointOfSale.pos_debt_cart = class{

	constructor(
		wrapper
	){
		this.wrapper = wrapper
		this.start_work()
	}

	start_work(){
		console.log("hello from pos_debt_cart")
		this.prepare_cart()

	}

	prepare_cart(){
		this.wrapper.find('#LeftSection').append('<div id="debtLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="debtRightContainer" class="columnBox"></div>')

		this.leftContainer  = this.wrapper.find('#debtLeftContainer')
		this.rightContainer = this.wrapper.find('#debtRightContainer')
	}
	showCart(){
		this.leftContainer.css('display' , 'flex')
		this.rightContainer.css('display' , 'flex')
	}
	hideCart(){
		this.leftContainer.css('display' , 'none')
		this.rightContainer.css('display' , 'none')
	}

}
