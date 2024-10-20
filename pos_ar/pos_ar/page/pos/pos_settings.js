pos_ar.PointOfSale.pos_settings = class{

	constructor(
		wrapper,
		posProfileList,
		selectedPosProfile
	){
		this.wrapper              = wrapper            ;
		this.pos_profile_list     = posProfileList     ;
		this.selected_pos_profile = selectedPosProfile ;
		this.start_work()
	}

	start_work(){
		this.prepareSettingsCart();
	}


	prepareSettingsCart(){
		this.wrapper.find('#RightSection').append('<div id="settingsLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#LeftSection').append('<div id="settingsRightContainer" class="columnBox"></div>')

		this.rightContainer = this.wrapper.find('#settingsRightContainer')
		this.leftContainer  = this.wrapper.find('#settingsLeftContainer')

		this.rightContainer.append('<h4 class="CartTitle">POS Settings</h4>')
		this.rightContainer.append('<div id="settingsCartContent" class="rowBox"> <div class="c1 columnBox"></div>   <div class="c2 columnBox"></div> </div>')

		this.c1 = this.rightContainer.find('div.c1')
		this.c2 = this.rightContainer.find('div.c2')

		this.c1.append('<label dor="pos_profile"> POS Profile </label>')
		this.c1.append('<select  name="pos_profile" id="posProfileSelect" ></select>')

		this.pos_profile_select = this.c1.find('#posProfileSelect')
		this.pos_profile_list.forEach( posProfile =>{
			if(posProfile.name == this.selected_pos_profile.name){
				this.pos_profile_select.append(`<option value="${posProfile.name}">${posProfile.name}</option>`)
			}
			else{
				this.pos_profile_select.append(`<option value="${posProfile.name}" selected >${posProfile.name}</option>`)
			}
		})

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
