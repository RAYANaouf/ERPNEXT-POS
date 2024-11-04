pos_ar.PointOfSale.posAppData = class {

	constructor(
		db
	){
		this.db = db;
		this.appData = {} ;
		this.getCustomers()
	}

	async getCustomers(){
		//get local customer
		this.appData.customers = await this.db.getAllCustomers();
		console.log("local > " , this.appData.customers)
	}



}
