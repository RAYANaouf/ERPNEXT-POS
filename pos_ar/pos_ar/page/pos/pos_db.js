pos_ar.PointOfSale.pos_db  = class POSDatabase {

	constructor(db) {
		this.db = db;
		this.setupDatabase();
	}


	static async openDatabase(){
		return new Promise((resolve , reject) => {

			// Let us open our database
			const request = window.indexedDB.open( 'POSDB_test29' , 1);

			request.onerror = (event) => {
				// Do something with request.error!
				reject(request.error)
			};

			request.onsuccess = (event) => {
				// Do something with request.result!
				resolve(new pos_ar.PointOfSale.pos_db(event.target.result))
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
					posInvoiceStore.createIndex( 'docstatus' , 'docstatus' , {unique : false} )
				}
				if (!db.objectStoreNames.contains('check_in_out')) {
					db.createObjectStore('check_in_out', { keyPath : 'name' });
				}
				if (!db.objectStoreNames.contains('POS Settings')) {
					db.createObjectStore('POS Settings', { keyPath : 'id' });
				}

			};


		})
	}



	setupDatabase(){
		this.db.onerror = (event) => {
			// Generic error handler for all errors targeted at this database's
			// requests!
			console.error(`Database error: ${event.target.error?.message}`);
		};
	}



	/************************************   Item  ***************************************/
	/************************************************************************************/
	/************************************************************************************/

	saveItemList( itemList , onSuccess , onFailure){

		const transaction = this.db.transaction(['Item'] , "readwrite");
		const store       = transaction.objectStore('Item')

		// Loop through the list of customers and add each one to the store
		itemList.forEach(posProfile => {
			const request = store.put(item)
			request.onerror = (err)=>{
				console.error("db => error saving Item : " , item ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving Item.")
			onFailure(event);
		};

	}

	getAllPriceList(onSuccess , onFailure){
		const transaction = this.db.transaction(['Item'] , "readwrite");
		const store       = transaction.objectStore('Item');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}


	/*********************************   POS Profile  ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	savePosProfileList( posProfileList , onSuccess , onFailure){

		const transaction = this.db.transaction(['POS Profile'] , "readwrite");
		const store       = transaction.objectStore('POS Profile')

		// Loop through the list of customers and add each one to the store
		posProfileList.forEach(posProfile => {
			const request = store.put(posProfile)
			request.onerror = (err)=>{
				console.error("db => error saving POS Profile : " ,posProfile ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving POS Profile.")
			onFailure(event);
		};

	}

	getAllPriceList(onSuccess , onFailure){
		const transaction = this.db.transaction(['POS Profile'] , "readwrite");
		const store       = transaction.objectStore('POS Profile');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}



	/*********************************       Bin      ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveBinList( binList , onSuccess , onFailure){

		const transaction = this.db.transaction(['Bin'] , "readwrite");
		const store       = transaction.objectStore('Bin')

		// Loop through the list of customers and add each one to the store
		binList.forEach(bin => {
			const request = store.put(bin)
			request.onerror = (err)=>{
				console.error("db => error saving Bin : " , bin ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving Bin.")
			onFailure(event);
		};

	}

	getAllPriceList(onSuccess , onFailure){
		const transaction = this.db.transaction(['Bin'] , "readwrite");
		const store       = transaction.objectStore('Bin');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}




	/*********************************   Warehouse    ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveWarehouseList(warehouseList , onSuccess , onFailure){

		const transaction = this.db.transaction(['Warehouse'] , "readwrite");
		const store       = transaction.objectStore('Warehouse')

		// Loop through the list of customers and add each one to the store
		warehousesList.forEach(warehouse => {
			const request = store.put(warehouse)
			request.onerror = (err)=>{
				console.error("db => error saving Warehouse : " ,warehouse ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving Warehouse List.")
			onFailure(event);
		};

	}

	getAllPriceList(onSuccess , onFailure){
		const transaction = this.db.transaction(['Warehouse'] , "readwrite");
		const store       = transaction.objectStore('Warehouse');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}



	/*********************************   Price List   ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	savePriceLists(priceLists , onSuccess , onFailure){

		const transaction = this.db.transaction(['Price List'] , "readwrite");
		const store       = transaction.objectStore('Price List')

		// Loop through the list of customers and add each one to the store
		priceLists.forEach(priceList => {
			const request = store.put(priceList)
			request.onerror = (err)=>{
				console.error("db => error saving Price List : " ,itemPrice ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving Price Lists.")
			onFailure(event);
		};

	}

	getAllPriceList(onSuccess , onFailure){
		const transaction = this.db.transaction(['Price List'] , "readwrite");
		const store       = transaction.objectStore('Price List');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}




	/*********************************   Item Price   ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveItemPriceList(itemPriceList , onSuccess , onFailure){

		const transaction = this.db.transaction(['Item Price'] , "readwrite");
		const store       = transaction.objectStore('Item Price')

		// Loop through the list of customers and add each one to the store
		itemPriceList.forEach(itemPrice => {
			const request = store.put(itemPrice)
			request.onerror = (err)=>{
				console.error("db => error saving Item Price : " ,itemPrice ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving Item Price.")
			onFailure(event);
		};

	}

	getAllItemPrice(onSuccess , onFailure){
		const transaction = this.db.transaction(['Item Price'] , "readwrite");
		const store       = transaction.objectStore('Item Price');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}


	/*********************************   Item Group   ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveItemGroupList(itemGroupList , onSuccess , onFailure){

		const transaction = this.db.transaction(['Item Group'] , "readwrite");
		const store       = transaction.objectStore('Item Group')

		// Loop through the list of customers and add each one to the store
		itemGroupList.forEach(itemGroup => {
			const request = store.put(itemGroup)
			request.onerror = (err)=>{
				console.error("db => error saving Item Group : " ,itemGroup ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving Item Group.")
			onFailure(event);
		};

	}

	getAllItemGroup(onSuccess , onFailure){
		const transaction = this.db.transaction(['Item Group'] , "readwrite");
		const store       = transaction.objectStore('Item Group');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}



	/*********************************   cutomers   *************************************/
	/************************************************************************************/
	/************************************************************************************/

	saveCustomerList(customerList , onSuccess , onFailure){

		const transaction = this.db.transaction(['Customer'] , "readwrite");
		const store       = transaction.objectStore('Customer')

		// Loop through the list of customers and add each one to the store
		customerList.forEach(customer => {
			const request = store.put(customer)
			request.onerror = (err)=>{
				console.error("db => error saving customer : " ,customer ,  "err : " , err)
			}
		})

		// Transaction's oncomplete event will be triggered
		//once all requests in this transaction complete successfully
		transaction.oncomplete = () => {
			onSuccess();
		};

		request.onerror = (event) => {
			console.error("db => error saving customer.")
			onFailure(event);
		};

	}

	getAllCustomers(onSuccess , onFailure){
		const transaction = this.db.transaction(['Customer'] , "readwrite");
		const store       = transaction.objectStore('Customer');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}





	/****************************** pos invoice *********************************/
	/****************************************************************************/
	/****************************************************************************/

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

	getNotSyncedPosNumber(onSuccess , onFailure){
		const transaction_posInvoice     = this.db.transaction(['POS Invoice'] , "readwrite");
		const store_posInvoice           = transaction_posInvoice.objectStore('POS Invoice');
		const index_docstatus_posInvoice = store_posInvoice.index('docstatus');

		const request = index_docstatus_posInvoice.getAll(1);

		request.onsuccess = (result) => {
			const filtredResult = result.target.result.filter(invoice => invoice.synced == false )
			onSuccess(filtredResult.length);
		}
		request.onerror = (err) => {
			onFailure(err);
		}
	}


	getNotSyncedPos(onSuccess , onFailure){
		const transaction_posInvoice     = this.db.transaction(['POS Invoice'] , "readwrite");
		const store_posInvoice           = transaction_posInvoice.objectStore('POS Invoice');
		const index_docstatus_posInvoice = store_posInvoice.index('docstatus');

		const request = index_docstatus_posInvoice.getAll(1);

		request.onsuccess = (result) => {
			const filtredResult = result.target.result.filter(invoice => invoice.synced == false )
			onSuccess(filtredResult);
		}
		request.onerror = (err) => {
			onFailure(err);
		}
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

	deleteAllSettings(onSuccess, onFailure) {
		const transaction = this.db.transaction(['POS Invoice'], 'readwrite');
		const store = transaction.objectStore('POS Invoice');

		const request = store.clear(); // Clear all entries in the store

		request.onsuccess = (event) => {
			onSuccess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
		};
	}



	/********************************* check_in_out ***********************************************/
	saveCheckInOut(checkInOut , onSuccess , onFailure){

		const transaction = this.db.transaction(['check_in_out'] , "readwrite");
		const store       = transaction.objectStore('check_in_out')
		const request     = store.put(checkInOut)

		request.onsuccess = (event) => {
			onSuccess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
		};

	}

	getAllCheckInOut(onSuccess , onFailure){
		const transaction = this.db.transaction(['check_in_out'] , "readwrite");
		const store       = transaction.objectStore('check_in_out');
		const result      = store.getAll().onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
	}

	deleteAllCheckInOut(onSuccess, onFailure) {
		const transaction = this.db.transaction(['check_in_out'], 'readwrite');
		const store = transaction.objectStore('check_in_out');

		const request = store.clear(); // Clear all entries in the store

		request.onsuccess = (event) => {
			onSuccess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
		};
	}

	/****************************** pos settings *********************************/
	/*****************************************************************************/
	/*****************************************************************************/

	updateSettings(settings , onSuccess , onFailure){
		const transaction = this.db.transaction(['POS Settings'] , "readwrite");
		const store       = transaction.objectStore('POS Settings')
		const request     = store.put({id : 1 , ...settings});

		request.onsuccess = (event) => {
			onSuccess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
		};
	}


	getSettings(onSuccess, onFailure) {

		const transaction = this.db.transaction(['POS Settings'], 'readwrite');
		const store = transaction.objectStore('POS Settings');

		const request = store.get(1); // Get the settings using the unique ID

		request.onsuccess = (event) => {
			onSuccess(event.target.result);
		};

		request.onerror = (event) => {
			onFailure(event);
		};
	}

	deleteAllSettings(onSuccess, onFailure) {
		const transaction = this.db.transaction(['POS Settings'], 'readwrite');
		const store = transaction.objectStore('POS Settings');

		const request = store.clear(); // Clear all entries in the store

		request.onsuccess = (event) => {
			onSuccess(event);
		};

		request.onerror = (event) => {
			onFailure(event);
		};
	}

}
