pos_ar.PointOfSale.posSettingsData = class{


	constructor(db){

		this.db = db;
		//Array of valid values
		this.price_bases     = ['brand'   , 'priceList']
		this.keyboard_styles = ['primery' , 'secondary']

		const defaults = {
			itemPriceBasedOn  : 'brand'     ,
			keyboardStyle     : 'secondary' ,
			showItemDetails   : false       ,
			showItemImage     : false       ,
			showDiscountField : false       ,
			onlineDebt        : true        ,
			testing           : false,
			search_by_group   : false,
			sendInvoiceToOtherPos : false
		}


		//Default setting (it could be more)
		this.db.getSettings(

			(res)=>{
				if(res && res.itemPriceBasedOn ){
					this.settings = {...defaults , ...( res || {} ) }
				}else{
					//default
					this.settings = {
						itemPriceBasedOn  : 'brand'     ,
						keyboardStyle     : 'secondary' ,
						showItemDetails   : false       ,
						showItemImage     : false       ,
						showDiscountField : false       ,
						onlineDebt        : true        ,
						search_by_group   : false,
						sendInvoiceToOtherPos : false
					}
				}

			},
			(err)=>{
				console.log("error when trying to get the setting from local, so we use the default.")
				this.settings = {
					itemPriceBasedOn  : 'brand'     ,
					keyboardStyle     : 'secondary' ,
					showItemDetails   : false       ,
					showItemImage     : false       ,
					showDiscountField : false       ,
					onlineDebt        : true        ,
					search_by_group   : false,
					sendInvoiceToOtherPos : false
				}

			}
		)
	}

	getAllPriceBases(){
		return this.price_bases;
	}
	getAllKeyboardStyles(){
		return this.keyboard_styles;
	}

	//PriceItemBasedOn
	getPriceBase(){
		return this.settings.itemPriceBasedOn;
	}
	setPriceItemBasedOn(base , onSuccess , onFailure){
		if(this.price_bases.includes(base)){
			this.settings.itemPriceBasedOn = base
			this.db.updateSettings_callback(
				this.settings,
				()=>{
					//saved
					onSuccess();
					console.log("settings update is save successfuly")
				},()=>{
					console.error("error occured when trying to save settings")
				}
			)
		}else{
			console.error("invalide base : " , base , "there are just : " , this.price_bases)
		}
	}

	//show item details
	getShowItemDetails(){
		return this.settings.showItemDetails;
	}
	setShowItemDetails(show , onSuccess , onFailure){
		this.settings.showItemDetails = show
		this.db.updateSettings_callback(
			this.settings,
			()=>{
				//saved
				onSuccess();
				console.log("settings update is save successfuly")
			},()=>{
				console.error("error occured when trying to save settings")
			}
		)

	}


	setSettings( settings , onSuccess , onFailure){
		this.settings  = settings
		this.db.updateSettings_callback(
			this.settings,
			()=>{
				//saved
				onSuccess();
				console.log("settings update is save successfuly")
			},()=>{
				console.error("error occured when trying to save settings")
			}
		)

	}


}
