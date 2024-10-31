pos_ar.PointOfSale.pos_settings = class{

	constructor(
		wrapper,
		settingsData,
		posProfileList,
		selectedPosProfile,
		onSettingsChange,
	){
		this.wrapper              = wrapper            ;
		this.settings_data        = settingsData       ;
		this.pos_profile_list     = posProfileList     ;
		this.selected_pos_profile = selectedPosProfile ;
		this.on_settings_change   = onSettingsChange   ;
		//scene
		this.scene = 'pos_profile'

		this.start_work()
	}

	start_work(){
		this.prepareSettingsCart();
		this.refreshLeftSection();
		this.setListener();
	}


	prepareSettingsCart(){
		this.wrapper.find('#RightSection').append('<div id="settingsRightContainer" class="columnBox"></div>')
		this.wrapper.find('#LeftSection').append('<div id="settingsLeftContainer" class="columnBox"></div>')

		this.leftContainer = this.wrapper.find('#settingsLeftContainer')
		this.rightContainer  = this.wrapper.find('#settingsRightContainer')


		//right section
		this.rightContainer.append('<div id="pos_profile_btn"      class="settings_tab active" >POS Profile</div>')
		this.rightContainer.append('<div id="general_settings_btn" class="settings_tab"        >Generale Settings</div>')
		this.rightContainer.append('<div id="about_us_btn"         class="settings_tab"        >About Us</div>')

		this.pos_profile_btn      = this.rightContainer.find('#pos_profile_btn')
		this.general_settings_btn = this.rightContainer.find('#general_settings_btn')
		this.about_us_btn         = this.rightContainer.find('#about_us_btn')
	}

	refreshLeftSection(){
		this.leftContainer.html('')
		if(this.scene == 'pos_profile'){
			this.refreshPosProfileScene();
		}else if(this.scene == 'general_settings'){
			this.refreshGeneralSettings();
		}else if(this.scene == "about_us"){
			this.refreshAboutUs();
		}
	}

	refreshPosProfileScene(){
		//left container
		this.leftContainer.addClass('columnBox')
		this.leftContainer.append('<h4 class="CartTitle" style="margin-bottom:35px; font-size:35px;" >POS Profile</h4>')
		this.leftContainer.append('<div id="settingsCartContentsContainer">  </div>')
		this.contentsContainer = this.leftContainer.find('#settingsCartContentsContainer');

		//pos profile:
		this.contentsContainer.append('<div id="posProfileContent" class="contentContainer rowBox" style="width:100%;"> <div class="c1 columnBox"></div>   <div class="c2 columnBox"></div> </div>')
		this.pos_profile_content = this.contentsContainer.find('#posProfileContent')
		this.c1 = this.pos_profile_content.find('div.c1')
		this.c2 = this.pos_profile_content.find('div.c2')

		this.c1.append('<label for="pos_profile"> POS Profile </label>')
		this.c1.append('<select  name="pos_profile" id="posProfileSelect" disabled ></select>')

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

	}


	refreshGeneralSettings(){

		const priceBase = this.settings_data.settings.itemPriceBasedOn
		//left container
		this.leftContainer.addClass('columnBox')
		this.leftContainer.append('<h4 class="CartTitle" style="margin-bottom:35px; font-size:35px;" >General Settings</h4>')
		this.leftContainer.append('<div id="settingsCartContentsContainer">  </div>')
		this.contentsContainer = this.leftContainer.find('#settingsCartContentsContainer');

		//settings :
		this.contentsContainer.append('<div id="generalSettingsContent" class="contentContainer rowBox" style="width:100%;"> <div class="c1 columnBox"></div>   <div class="c2 columnBox"></div> </div>')
		this.general_settings_content = this.contentsContainer.find('#generalSettingsContent')
		this.general_settings_c1 = this.general_settings_content.find('div.c1')
		this.general_settings_c2 = this.general_settings_content.find('div.c2')

		this.general_settings_c1.append('<label for="priceBasedOn"> Item Price Based On : </label>')
		this.general_settings_c1.append('<select  name="priceBasedOn" id="priceBasedOnSelect" ></select>')
		this.item_price_based_on_select = this.general_settings_c1.find('#priceBasedOnSelect')

		this.settings_data.getAllPriceBases().forEach( base =>{
			if(this.settings_data.settings.itemPriceBasedOn == base){
				this.item_price_based_on_select.append(`<option value="${base}" selected> ${base} </option>`)
			}else{
				this.item_price_based_on_select.append(`<option value="${base}"> ${base} </option>`)
			}
		})

		//set listeners
		this.item_price_based_on_select.on('input' , (event)=>{
			this.settings_data.setPriceItemBasedOn(event.target.value)
		})

	}
	refreshAboutUs(){
		//left container
		this.leftContainer.addClass('columnBox')
		this.leftContainer.append('<h4 class="CartTitle" style="margin-bottom:35px; font-size:35px;" >About Us</h4>')
		this.leftContainer.append('<div id="settingsCartContentsContainer">  </div>')
		this.contentsContainer = this.leftContainer.find('#settingsCartContentsContainer');

	}


	showCart(){
		this.rightContainer.css('display' , 'flex')
		this.leftContainer.css('display' , 'flex')
	}
	hideCart(){
		this.rightContainer.css('display' , 'none')
		this.leftContainer.css('display' , 'none')
	}

	/*********************** set listener  ********************************/

	setListener(){
		const tabs = document.querySelectorAll('.settings_tab');
		const all_content = document.querySelectorAll('.contentContainer')

		tabs.forEach((tab , index)=>{
			tab.addEventListener('click' , ()=>{
				tabs.forEach(tab => {
					tab.classList.remove('active');
				})
				tab.classList.add('active');
			})
		})


		this.pos_profile_btn.on('click' , (event)=>{
			this.scene = 'pos_profile';
			this.refreshLeftSection();
		})


		this.general_settings_btn.on('click' , (event)=>{
			this.scene = 'general_settings';
			this.refreshLeftSection()
		})

		this.about_us_btn.on('click' , (event)=>{
			this.scene = 'about_us';
			this.refreshLeftSection()
		})

	}


}
