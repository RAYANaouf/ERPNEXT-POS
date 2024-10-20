pos_ar.PointOfSale.pos_settings = class{

	constructor(
		wrapper,
	){
		this.wrapper = wrapper
		this.start_work()
	}

	start_work(){
		this.prepareSettingsCart();
	}


	prepareSettingsCart(){
		this.wrapper.find('#RightSection').append('<div id="settingsLeftContainer"></div>')
		this.wrapper.find('#LeftSection').append('<div id="settingsRightContainer"></div>')

		this.rightContainer = this.wrapper.find('#settingsRightContainer')
		this.leftContainer  = this.wrapper.find('#settingsLeftContainer')

	}

	showCart(){
		console.log("show")
		this.rightContainer.css('display' , 'flex')
		this.leftContainer.css('display' , 'flex')
	}
	hideCart(){
		console.log("hide")
		this.rightContainer.css('display' , 'none')
		this.leftContainer.css('display' , 'none')
	}


}
