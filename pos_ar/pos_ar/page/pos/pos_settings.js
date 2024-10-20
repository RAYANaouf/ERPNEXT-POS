pos_ar.PointOfSale.pos_settings = class{

	constructor(
		wrapper,
	){
		this.wrapper = wrapper
		this.start_work()
	}

	start_work(){
		console.log("setting class start work !")
	}


	prepareSettingsCart(){
		this.wrapper.find('#RightSection').append('<div id="settingsLeftContainer"></div>')
		this.wrapper.find('#LeftSection').append('<div id="settingsRightContainer"></div>')
	}


}
