pos_ar.PointOfSale.posSettingsData = class{


	constructor(){
		//Array of valid price bases
		this.price_bases = ['brand' , 'priceList']
		//Default setting (it could be more)
		this.settings = {
			itemPriceBasedOn : 'brand'
		}
	}

	getPriceBase(){
		return this.settings.itemPriceBasedOn;
	}

	setPriceItemBasedOn(base){
		if(this.price_bases.includes(base)){
			this.settings.itemPriceBasedOn = base
		}else{
			console.error("invalide base : " , base , "there are just : " , this.price_bases)
		}
	}

}
