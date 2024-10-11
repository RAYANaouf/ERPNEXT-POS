pos_ar.PointOfSale.pos_db  = class POSDatabase {

	constructor() {
		this.dbName = 'POSDB';
		this.dbVersion = 4;
		this.db = null;

		this.openDatabase()
	}


	openDatabase(){

		// Let us open our database
		const request = window.indexedDB.open( this.dbName , this.dbVersion);

		request.onerror = (event) => {
			// Do something with request.error!
			console.log(" there is an error : " , request.error)
		};

		request.onsuccess = (event) => {
			// Do something with request.result!
			this.db = event.target.result;
			this.setupDatabase()
			console.log(" the db is opend successefully : " , event.target.result)
		};

 		request.onupgradeneeded = (event) => {
		 	const db = event.target.result;

			// Create object stores (tables)
			if (!db.objectStoreNames.contains('Customer')) {
				db.createObjectStore('Customer', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('Item Group')) {
				db.createObjectStore('Item Group', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('Item')) {
				db.createObjectStore('Item', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('Item Price')) {
				db.createObjectStore('Item Price', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('Price List')) {
				db.createObjectStore('Price List', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('Warehouse')) {
				db.createObjectStore('Warehouse', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('POS Profile')) {
				db.createObjectStore('POS Profile', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('Bin')) {
				db.createObjectStore('Bin', { keyPath: 'name' });
			}
			if (!db.objectStoreNames.contains('POS Invoice')) {
				db.createObjectStore('Bin', { autoIncrement : true });
			}
		};
	}



	setupDatabase(){
		this.db.onerror = (event) => {
			// Generic error handler for all errors targeted at this database's
			// requests!
			console.error(`Database error: ${event.target.error?.message}`);
		};
	}



	savePosInvoice(posInvoice , onSuccess , onFailure){

		const transaction = this.db.transaction(['POS Invoice'] , "readWrite");
		const store       = this.transaction.objectStore('POS Invoice')
		const request     = store.add(posInvoice)

		request.onsuccess = (event) => {
			onSucess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
		};

	}






}
