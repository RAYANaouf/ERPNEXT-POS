pos_ar.PointOfSale.pos_db  = class POSDatabase {

	constructor() {
		this.dbName = 'POSDB';
		this.dbVersion = 1;
		this.db = null;

		this.openDatabase()
	}


	openDatabase(){
		console.log("db opend successfuly")
	}

}
