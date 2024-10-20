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

		this.c1.append('<label for="pos_profile"> POS Profile </label>')
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

		this.c1.append(`<label for="warehouse">POS Warehouse</label>`)
		this.c1.append(`<input name="warehouse" value="${this.selected_pos_profile.warehouse}" disabled>`)

		this.c1.append(`<label for="income_account">POS income account</label>`)
		this.c1.append(`<input name="income_account" value="${this.selected_pos_profile.income_account}" disabled>`)

		this.c2.append(`<label for="write_off_account">POS write off account</label>`)
		this.c2.append(`<input name="write_off_account" value="${this.selected_pos_profile.write_off_account}" disabled>`)

		this.c2.append(`<label for="write_off_cost_center">POS write off cost center</label>`)
		this.c2.append(`<input name="write_off_cost_center" value="${this.selected_pos_profile.write_off_cost_center}" disabled>`)

		this.c2.append(`<label for="taxes_and_charges">POS taxes and charges</label>`)
		this.c2.append(`<input name="taxes_and_charges" value="${this.selected_pos_profile.taxes_and_charges}" disabled>`)


		//this.c2.append(`<label for="lastUpdate">POS last update</label>`)
		//this.c2.append(`<input name="lastUpdate" value="${frappe.datetime.now_datetime()}" disabled>`)

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
