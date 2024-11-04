pos_ar.PointOfSale.posAppData = class {

	constructor(
		db
	){
		this.db = db;
		this.appData = {} ;
		this.getAllData()
	}

	async getAllData(){
		try{
			this.getCustomers();
			this.getItems();
			this.getPosProfiles();
			console.log("app data : " , this.appData)
		}catch(err){
			console.error("appData Class Error  : " , err)
		}
	}
	async getCustomers(){
		//get local customers
		this.appData.customers = await this.db.getAllCustomers();
	}
	async getItems(){
		//get local items
		this.appData.items = await this.db.getAllItems();
	}
	async getPosProfiles(){
		//get local price lists
		this.appData.posProfiles = await this.db.getAllPosProfile();
	}



}
