pos_ar.PointOfSale.posAppData = class {

	constructor(
		db
	){
		this.db = db;
		//get local customer
		this.db.getAllCustomers(
			(res)=>{
				console.log("local customer" , res)
			},(err)=>{
				console.log("error geting local customer list")
			}
		)
	}


}
