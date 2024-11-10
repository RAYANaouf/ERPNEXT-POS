pos_ar.PointOfSale.pos_db  = class POSDatabase {

	constructor(db) {
		this.db = db;
		this.setupDatabase();
	}


	static async openDatabase(){
		return new Promise((resolve , reject) => {

			// Let us open our database
			const request = window.indexedDB.open( 'POSDB_test31' , 1);

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



	/************************************  counte ***************************************/
	/************************************************************************************/
	/************************************************************************************/



	getPosCounter(){
		return new Promise((resolve , reject) => {
			const transaction = this.db.transaction(['Counter'] , "readwrite");
			const store       = transaction.objectStore('Counter')

		})
	}




	/************************************   Item  ***************************************/
	/************************************************************************************/
	/************************************************************************************/

	saveItemList( itemList ){
		return new Promise((resolve , reject) => {
			const transaction = this.db.transaction(['Item'] , "readwrite");
			const store       = transaction.objectStore('Item')
			// Loop through the list of items  and add each one to the store
			itemList.forEach(item => {
				const request = store.put(item)
				request.onerror = (err)=>{
					console.error("db => error saving Item : " , item ,  "err : " , err)
					reject(err)
				}
			})
			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve()
			};
			transaction.onerror = (err) => {
				console.error("db => error saving Item.")
				reject(err)
			};
		})
	}

	getAllItems(){
		return new Promise((resolve,reject) =>{
			const transaction = this.db.transaction(['Item'] , "readwrite");
			const store       = transaction.objectStore('Item');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err) => {
				reject(err);
			}
		})
	}


	/*********************************   POS Profile  ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	savePosProfileList( posProfileList ){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Profile'] , "readwrite");
			const store       = transaction.objectStore('POS Profile')
			// Loop through the list of pos profile and add each one to the store
			posProfileList.forEach(posProfile => {
				const request = store.put(posProfile)
				request.onerror = (err)=>{
					console.error("db => error saving POS Profile : " ,posProfile ,  "err : " , err)
					reject(err)
				}
			})
			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve()
			};
			transaction.onerror = (err) => {
				console.error("db => error saving POS Profile.")
				reject(err)
			};
		})

	}

	getAllPosProfile(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Profile'] , "readwrite");
			const store       = transaction.objectStore('POS Profile');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err) => {
				const value = event.target.result
				reject(value);
			}
		})
	}



	/*********************************       Bin      ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveBinList( binList ){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Bin'] , "readwrite");
			const store       = transaction.objectStore('Bin')
			// Loop through the list of bin  and add each one to the store
			binList.forEach(bin => {
				const request = store.put(bin)
				request.onerror = (err)=>{
					console.error("db => error saving Bin : " , bin ,  "err : " , err)
					reject(err)
				}
			})
			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve()
			};
			transaction.onerror = (err) => {
				console.error("db => error saving Bin.")
				reject(err)
			};
		})
	}

	getAllBin(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Bin'] , "readwrite");
			const store       = transaction.objectStore('Bin');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err)=> {
				reject(err);
			}
		})
	}




	/*********************************   Warehouse    ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveWarehouseList(warehouseList){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Warehouse'] , "readwrite");
			const store       = transaction.objectStore('Warehouse')
			// Loop through the list of warehouse and add each one to the store
			warehouseList.forEach(warehouse => {
				const request = store.put(warehouse)
				request.onerror = (err)=>{
					console.error("db => error saving Warehouse : " ,warehouse ,  "err : " , err)
					reject(err)
				}
			})
			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve();
			};
			transaction.onerror = (event) => {
				console.error("db => error saving Warehouse List.")
				reject(event);
			};
		})
	}

	getAllWarehouse(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Warehouse'] , "readwrite");
			const store       = transaction.objectStore('Warehouse');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err) => {
				reject(err);
			}
		})
	}



	/*********************************   Price List   ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	savePriceLists(priceLists){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Price List'] , "readwrite");
			const store       = transaction.objectStore('Price List')

			// Loop through the list of price lists and add each one to the store
			priceLists.forEach(priceList => {
				const request = store.put(priceList)
				request.onerror = (err)=>{
					console.error("db => error saving Price List : " ,itemPrice ,  "err : " , err)
					reject(err)
				}
			})

			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve();
			};

			transaction.onerror = (err) => {
				console.error("db => error saving Price Lists.")
				reject(err);
			};
		})

	}

	getAllPriceList(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Price List'] , "readwrite");
			const store       = transaction.objectStore('Price List');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err)=>{
				reject(err)
			}
		})
	}




	/*********************************   Item Price   ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveItemPriceList(itemPriceList){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Item Price'] , "readwrite");
			const store       = transaction.objectStore('Item Price')
			// Loop through the list of item price and add each one to the store
			itemPriceList.forEach(itemPrice => {
				const request = store.put(itemPrice)
				request.onerror = (err)=>{
					console.error("db => error saving Item Price : " ,itemPrice ,  "err : " , err)
					reject(err)
				}
			})
			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve();
			};
			transaction.onerror = (err) => {
				console.error("db => error saving Item Price.")
				reject(err);
			};
		})
	}

	getAllItemPrice(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Item Price'] , "readwrite");
			const store       = transaction.objectStore('Item Price');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err)=>{
				reject(err);
			}
		})
	}


	/*********************************   Item Group   ***********************************/
	/************************************************************************************/
	/************************************************************************************/

	saveItemGroupList(itemGroupList){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Item Group'] , "readwrite");
			const store       = transaction.objectStore('Item Group')
			// Loop through the list of item group and add each one to the store
			itemGroupList.forEach(itemGroup => {
				const request = store.put(itemGroup)
				request.onerror = (err)=>{
					reject(err);
					console.error("db => error saving Item Group : " ,itemGroup ,  "err : " , err)
				}
			})
			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve();
			};
			transaction.onerror = (err) => {
				console.error("db => error saving Item Group.")
				reject(err);
			};
		})
	}

	getAllItemGroup(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Item Group'] , "readwrite");
			const store       = transaction.objectStore('Item Group');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err)=>{
				reject(err);
			}
		})
	}



	/*********************************   cutomers   *************************************/
	/************************************************************************************/
	/************************************************************************************/

	saveCustomerList(customerList ){
		return new Promise((resolve,reject) => {
			const transaction = this.db.transaction(['Customer'] , "readwrite");
			const store       = transaction.objectStore('Customer')
			// Loop through the list of customers and add each one to the store
			customerList.forEach(customer => {
				const request = store.put(customer)
				request.onerror = (err)=>{
					console.error("db => error saving customer : " ,customer ,  "err : " , err)
					reject(err)
				}
			})
			// Transaction's oncomplete event will be triggered
			//once all requests in this transaction complete successfully
			transaction.oncomplete = () => {
				resolve();
			};
			transaction.onerror = (event) => {
				console.error("db => error saving customer.")
				reject(event)
			};

		})
	}

	getAllCustomers(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['Customer'] , "readonly");
			const store       = transaction.objectStore('Customer');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value)
			}
			result.onerror = (value)=>{
				console.error("error when getting customer from db")
				reject(event)
			}
		})
	}





	/****************************** pos invoice *********************************/
	/****************************************************************************/
	/****************************************************************************/

	savePosInvoice(posInvoice){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Invoice'] , "readwrite");
			const store       = transaction.objectStore('POS Invoice')
			const request     = store.put(posInvoice)
			request.onsuccess = (event) => {
				resolve(event);
			};
			request.onerror = (event) => {
				reject(event);
			};
		})

	}

	updatePosInvoice(posInvoice) {
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Invoice'], "readwrite");
			const store = transaction.objectStore('POS Invoice');
			// add if not exists or update if it exists.
			const request = store.put(posInvoice);
			request.onsuccess = (event) => {
				resolve(event.target.result);
			};
			request.onerror = (event) => {
				reject(event);
    			};
		})
	}

	//async
	getAllPosInvoice(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Invoice'] , "readwrite");
			const store       = transaction.objectStore('POS Invoice');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err)=>{
				reject(err)
			}
		})
	}
	//callBack version
	getAllPosInvoice_callback(onSuccess,onFailure){
		const transaction = this.db.transaction(['POS Invoice'] , "readwrite");
		const store       = transaction.objectStore('POS Invoice');
		const result      = store.getAll()
		result.onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
		result.onerror = (err)=>{
			onFailure(err)
		}
	}

	getDraftPosInvoice(){
		return new Promise((resolve,reject)=>{
			const transaction_posInvoice     = this.db.transaction(['POS Invoice'] , "readwrite");
			const store_posInvoice           = transaction_posInvoice.objectStore('POS Invoice');
			const index_docstatus_posInvoice = store_posInvoice.index('docstatus');
			const request = index_docstatus_posInvoice.getAll(0);
			request.onsuccess = (event) => {
				resolve(event.target.result);
			};
			request.onerror = (err) => {
				reject(err);
			};
		})

	}

	getNotSyncedPosNumber(onSuccess,onFailure){
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


	getNotSyncedPos(onSuccess,onFailure){
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
	deletePosInvoice(invoiceName) {
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Invoice'], "readwrite");
			const store = transaction.objectStore('POS Invoice');
			const request = store.delete(invoiceName);  // Deletes the record with the key 'invoiceName', (i set the name as keypath , in erpnext name is the id.)
			request.onsuccess = () => {
				resolve();  // Call success callback if the deletion is successful
			};
			request.onerror = (err) => {
				reject(err);  // Call failure callback if there is an error
			};
		})
	}

	// New delete function to remove a POS Invoice
	deletePosInvoice_callback(invoiceName,onSuccess,onFailure) {
		const transaction = this.db.transaction(['POS Invoice'], "readwrite");
		const store = transaction.objectStore('POS Invoice');
		const request = store.delete(invoiceName);  // Deletes the record with the key 'invoiceName', (i set the name as keypath , in erpnext name is the id.)
		request.onsuccess = () => {
			onSuccess();  // Call success callback if the deletion is successful
		};
		request.onerror = (err) => {
			onFailure(err);  // Call failure callback if there is an error
		};
	}

	deleteAllPosInvoice() {
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Invoice'], 'readwrite');
			const store = transaction.objectStore('POS Invoice');
			const request = store.clear(); // Clear all entries in the store
			request.onsuccess = () => {
				resolve();
			};
			request.onerror = (err) => {
				reject(err);
			};
		})
	}



	/********************************* check_in_out ***********************************************/
	saveCheckInOut(checkInOut,onSuccess,onFailure){
		const transaction = this.db.transaction(['check_in_out'] , "readwrite");
		const store       = transaction.objectStore('check_in_out')
		const request     = store.put(checkInOut)
		request.onsuccess = (event) => {
			onSuccess(event.target.result);
		};
		request.onerror = (err) => {
			onFailure(err);
		};
	}

	getAllCheckInOut(){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['check_in_out'] , "readwrite");
			const store       = transaction.objectStore('check_in_out');
			const result      = store.getAll()
			result.onsuccess = (event) => {
				const value = event.target.result
				resolve(value);
			}
			result.onerror = (err)=>{
				reject(err)
			}
		})
	}

	getAllCheckInOut_callback(onSuccess,onFailure){
		const transaction = this.db.transaction(['check_in_out'] , "readwrite");
		const store       = transaction.objectStore('check_in_out');
		const result      = store.getAll()
		result.onsuccess = (event) => {
			const value = event.target.result
			onSuccess(value);
		}
		result.onerror = (err)=>{
			onFailure(err)
		}
	}

	deleteAllCheckInOut() {
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['check_in_out'], 'readwrite');
			const store = transaction.objectStore('check_in_out');
			const request = store.clear(); // Clear all entries in the store
			request.onsuccess = () => {
				resolve();
			};
			request.onerror = (err) => {
				reject(err);
			};
		})
	}

	/****************************** pos settings *********************************/
	/*****************************************************************************/
	/*****************************************************************************/

	updateSettings(settings){
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Settings'] , "readwrite");
			const store       = transaction.objectStore('POS Settings')
			const request     = store.put({id : 1 , ...settings});
			request.onsuccess = (event) => {
				resolve(event.target.result);
			};
			request.onerror = (err) => {
				reject(err);
			};
		})
	}
	//callback version
	updateSettings_callback(settings,onSuccess,onFailure){
		const transaction = this.db.transaction(['POS Settings'] , "readwrite");
		const store       = transaction.objectStore('POS Settings')
		const request     = store.put({id : 1 , ...settings});
		request.onsuccess = (event) => {
			onSuccess(event.target.result);
		};
		request.onerror = (err) => {
			onFailure(err);
		};
	}


	getSettings(onSuccess,onFailure) {
		const transaction = this.db.transaction(['POS Settings'], 'readwrite');
		const store = transaction.objectStore('POS Settings');
		const request = store.get(1); // Get the settings using the unique ID
		request.onsuccess = (event) => {
			onSuccess(event.target.result);
		};
		request.onerror = (err) => {
			onFailure(err);
		};
	}

	deleteAllSettings() {
		return new Promise((resolve,reject)=>{
			const transaction = this.db.transaction(['POS Settings'], 'readwrite');
			const store = transaction.objectStore('POS Settings');
			const request = store.clear(); // Clear all entries in the store
			request.onsuccess = () => {
				resolve();
			};
			request.onerror = (err) => {
				reject(err);
			};
		})
	}

}
