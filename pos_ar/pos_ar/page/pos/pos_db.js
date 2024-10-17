pos_ar.PointOfSale.pos_db  = class POSDatabase {

	constructor() {
		this.dbName = 'POSDB_test8';
		this.dbVersion = 14;
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
				const posInvoiceStore = db.createObjectStore('POS Invoice', { keyPath : 'name' });
				posInvoiceStore.createIndex('docstatus' , 'docstatus' , {unique : false})
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

		const transaction = this.db.transaction(['POS Invoice'] , "readwrite");
		const store       = transaction.objectStore('POS Invoice')
		const request     = store.put(posInvoice)

		request.onsuccess = (event) => {
			onSuccess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
		};

	}


	updatePosInvoice(posInvoice, onSuccess, onFailure) {
		const transaction = this.db.transaction(['POS Invoice'], "readwrite");
		const store = transaction.objectStore('POS Invoice');

		// add if not exists or update if it exists.
		const request = store.put(posInvoice);

		request.onsuccess = (event) => {
			onSuccess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
    		};
	}

	getAllPosInvoice(onSuccess , onFailure){
		const transaction = this.db.transaction(['POS Invoice'] , "readwrite");
		const store       = transaction.objectStore('POS Invoice');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}

	getDraftPosInvoice(onSuccess , onFailure){
		const transaction_posInvoice     = this.db.transaction(['POS Invoice'] , "readwrite");
		const store_posInvoice           = transaction_posInvoice.objectStore('POS Invoice');
		const index_docstatus_posInvoice = store_posInvoice.index('docstatus');

		const request = index_docstatus_posInvoice.getAll(0);

		request.onsuccess = (event) => {
			onSuccess(event.target.result);
		};

		request.onerror = (event) => {
			onFailure(event);
		};

	}



	// New delete function to remove a POS Invoice
	deletePosInvoice(invoiceName, onSuccess, onFailure) {
		const transaction = this.db.transaction(['POS Invoice'], "readwrite");
		const store = transaction.objectStore('POS Invoice');
		const request = store.delete(invoiceName);  // Deletes the record with the key 'invoiceName', (i set the name as keypath , in erpnext name is the id.)

		request.onsuccess = (event) => {
			onSuccess(event);  // Call success callback if the deletion is successful
		};

		request.onerror = (event) => {
			onFailure(event);  // Call failure callback if there is an error
		};
	}



}
