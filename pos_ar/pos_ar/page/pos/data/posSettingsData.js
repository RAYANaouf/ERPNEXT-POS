pos_ar.PointOfSale.posSettingsData = class{


	constructor(db){

		this.db = db;
		//Array of valid price bases
		this.price_bases = ['brand' , 'priceList']
		//Default setting (it could be more)
		this.db.getSettings(
			(res)=>{

				if(res && res.itemPriceBasedOn){
					this.settings = res
				}else{
					//default
					this.settings = {
						itemPriceBasedOn : 'brand'
					}
				}

				console.log("first test : " , res)
				console.log("first test settings : " , this.settings)

			},
			(err)=>{
				console.log("error when trying to get the setting from local, so we use the default.")
				this.settings = {
					itemPriceBasedOn : 'brand'
				}

			}
		)
	}

	getPriceBase(){
		return this.settings.itemPriceBasedOn;
	}
	getAllPriceBases(){
		return this.price_bases;
	}
	setPriceItemBasedOn(base , onSuccess , onFailure){
		if(this.price_bases.includes(base)){
			this.settings.itemPriceBasedOn = base
			this.db.updateSettings(
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

}
