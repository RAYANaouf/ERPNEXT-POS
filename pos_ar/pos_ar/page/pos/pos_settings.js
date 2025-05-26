pos_ar.PointOfSale.pos_settings = class{

	constructor(
		wrapper,
		settingsData,
		selectedPosProfile,
		onSettingsChange,
	){
		this.wrapper              = wrapper            ;
		this.settings_data        = settingsData       ;
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
		this.pos_profile_select.append(`<option value="${this.selected_pos_profile.name} selected ">${this.selected_pos_profile.name}</option>`)

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

		const priceBase           = this.settings_data.settings.itemPriceBasedOn
		const showItemDetailsCart = this.settings_data.settings.showItemDetails   ? "checked" : ""
		const showItemImage       = this.settings_data.settings.showItemImage     ? "checked" : ""
		const showDiscountField   = this.settings_data.settings.showDiscountField ? "checked" : ""
		const searchByGroup       = this.settings_data.settings.search_by_group   ? "checked" : ""
		const onlineDebt          = this.settings_data.settings.onlineDebt        ? "checked" : ""
		const sendInvoiceToOtherPos = this.settings_data.settings.sendInvoiceToOtherPos ? "checked" : ""
		const receiveInvoiceFromOtherPos = this.settings_data.settings.receiveInvoiceFromOtherPos ? "checked" : ""
		const keyboardStyle       = this.settings_data.settings.keyboard_style

		console.log("check it here : " , this.settings_data.settings.onlineDebt);

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

		//price base on
		this.general_settings_c1.append('<label for="priceBasedOn" style="font-weight:600;"> Item Price Based On : </label>')
		this.general_settings_c1.append('<select  name="priceBasedOn" id="priceBasedOnSelect" ></select>')
		this.item_price_based_on_select = this.general_settings_c1.find('#priceBasedOnSelect')

		this.settings_data.getAllPriceBases().forEach( base =>{
			if(this.settings_data.settings.itemPriceBasedOn == base){
				this.item_price_based_on_select.append(`<option value="${base}" selected> ${base} </option>`)
			}else{
				this.item_price_based_on_select.append(`<option value="${base}"> ${base} </option>`)
			}
		})


		//keyboard style
		this.general_settings_c2.append('<label for="keyboardStyle" style="font-weight:600;"> Keyboard Style : </label>')
		this.general_settings_c2.append('<select  name="keyboardStyle" id="keyboardStyle" ></select>')
		this.keyboard_style_select = this.general_settings_c2.find('#keyboardStyle')

		this.settings_data.getAllKeyboardStyles().forEach( style =>{
			if(this.settings_data.settings.keyboardStyle == style){
				this.keyboard_style_select.append(`<option value="${style}" selected> ${style} </option>`)
			}else{
				this.keyboard_style_select.append(`<option value="${style}"> ${style} </option>`)
			}
		})


		this.general_settings_c2.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Get Client Debt OnLine : </div>')
		this.general_settings_c2.append(`<div class="rowBox align_center" style="height:50px;"><label for="onlineDebtCheckBox" style="margin-right:16px;width:50%;" > online debt: </label> <input type="checkbox"  name="onlineDebtCheckBox" id="onlineDebtCheckBoxCheckBox" ${onlineDebt} ></div>`)

		//send invoice to other pos
		this.general_settings_c2.append('<div for="sendInvoiceToOtherPosCheckBox" style="font-weight:600;"> Send Invoice To Other POS : </div>')
		this.general_settings_c2.append(`<div class="rowBox align_center" style="height:50px;"><label for="sendInvoiceToOtherPosCheckBox" style="margin-right:16px;width:50%;" > send invoice: </label> <input type="checkbox"  name="sendInvoiceToOtherPosCheckBox" id="sendInvoiceToOtherPosCheckBox" ${sendInvoiceToOtherPos} ></div>`)

		//receive invoice from other pos
		this.general_settings_c2.append('<div for="receiveInvoiceFromOtherPosCheckBox" style="font-weight:600;"> Receive Invoice From Other POS : </div>')
		this.general_settings_c2.append(`<div class="rowBox align_center" style="height:50px;"><label for="receiveInvoiceFromOtherPosCheckBox" style="margin-right:16px;width:50%;" > receive invoice: </label> <input type="checkbox"  name="receiveInvoiceFromOtherPosCheckBox" id="receiveInvoiceFromOtherPosCheckBox" ${receiveInvoiceFromOtherPos} ></div>`)

		//show item details cart
		this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Item Details Cart : </div>')
		this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;"><label for="showItemDetailsCartCheckBox" style="margin-right:16px;width:50%;" > show cart: </label> <input type="checkbox"  name="showItemDetailsCartCheckBox" id="showItemDetailsCartCheckBox" ${showItemDetailsCart} ></div>`)

		//show item details cart
		this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Item Image : </div>')
		this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;" ><label for="showItemImageCheckBox" style="margin-right:16px;width:50%;"> show item image: </label> <input type="checkbox"  name="showItemImageCheckBox" id="showItemImageCheckBox" ${showItemImage} ></div>`)

		//show item details cart
		this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Discount feature : </div>')
		this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;" ><label for="showDiscountFieldCheckBox" style="margin-right:16px;width:50%;"> show discount field: </label> <input type="checkbox"  name="showDiscountFieldCheckBox" id="showDiscountFieldCheckBox" ${showDiscountField} ></div>`)

		//show item details cart
		this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> filter item by group : </div>')
		this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;" ><label for="showItemGroupFilterCheckBox" style="margin-right:16px;width:50%;"> show item group filter: </label> <input type="checkbox"  name="showItemGroupFilterCheckBox" id="showItemGroupFilterCheckBox" ${searchByGroup} ></div>`)


		//set listeners
		this.item_price_based_on_select.on('input' , (event)=>{
			this.settings_data.setPriceItemBasedOn(
				event.target.value,
				()=>{
					this.on_settings_change("itemPriceBasedOn")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
		})

		this.keyboard_style_select.on('input' , (event)=>{
			this.settings_data.settings.keyboardStyle =  event.target.value
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("showItemImage")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
		})

		this.general_settings_c1.find("#showItemDetailsCartCheckBox").on('click' , (event)=>{
			this.settings_data.settings.showItemDetails =  $(event.target).is(':checked')
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("showItemDetails")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
		})
		this.general_settings_c1.find("#showItemImageCheckBox").on('click' , (event)=>{
			this.settings_data.settings.showItemImage =  $(event.target).is(':checked')
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("showItemImage")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
		})
		this.general_settings_c1.find("#showDiscountFieldCheckBox").on('click' , (event)=>{
			this.settings_data.settings.showDiscountField =  $(event.target).is(':checked')
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("showDiscountField")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
		})
		this.general_settings_c1.find("#showItemGroupFilterCheckBox").on('click' , (event)=>{
			this.settings_data.settings.search_by_group =  $(event.target).is(':checked')
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("search_by_group")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
		})
		this.general_settings_c2.find('#onlineDebtCheckBoxCheckBox').on('click' , (event)=>{
			this.settings_data.settings.onlineDebt =  $(event.target).is(':checked')
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("")
				},()=>{
					console.error("error to save the settings changes (pos_settings.js)")
				}
			)
		})
		this.general_settings_c2.find("#sendInvoiceToOtherPosCheckBox").on('click' , (event)=>{
			this.settings_data.settings.sendInvoiceToOtherPos =  $(event.target).is(':checked')
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("sendInvoiceToOtherPos")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
		})
		this.general_settings_c2.find("#receiveInvoiceFromOtherPosCheckBox").on('click' , (event)=>{
			this.settings_data.settings.receiveInvoiceFromOtherPos =  $(event.target).is(':checked')
			this.settings_data.setSettings(
				this.settings_data.settings,
				()=>{
					this.on_settings_change("receiveInvoiceFromOtherPos")
				},()=>{
					console.error("error to save the settings changes (settings.js)")
				}
			)
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
