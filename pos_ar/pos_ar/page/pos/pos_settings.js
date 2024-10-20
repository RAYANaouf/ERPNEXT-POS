pos_ar.PointOfSale.pos_settings = class{

	constructor(
		wrapper,
	){
		this.wrapper = wrapper
		this.start_work()
	}

	start_work(){
		console.log("setting class start work !")
		this.prepareSettingsCart();
	}


	prepareSettingsCart(){
		this.wrapper.find('#RightSection').append('<div id="settingsLeftContainer"></div>')
		this.wrapper.find('#LeftSection').append('<div id="settingsRightContainer"></div>')

		this.rightContainer = this.wrapper.find('#RightSection')
		this.leftContainer  = this.wrapper.find('#LeftSection')

	}

	showCart(){
		this.rightContainer.css('display' , 'flex')
		this.leftContainer.css('display' , 'flex')
	}
	hideCart(){
		this.rightContainer.css('display' , 'none')
		this.leftContainer.css('display' , 'none')
	}


}
