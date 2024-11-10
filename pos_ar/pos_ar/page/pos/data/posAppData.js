pos_ar.PointOfSale.posAppData = class {

	constructor(
		db,
		apiHandler
	){
		this.db          = db;
		this.api_handler = apiHandler;

		this.since = localStorage.getItem('lastTime');


		this.appData = {} ;
	}


	async getAllData(){
		try{
			frappe.show_progress('Please Wait', 1, 11, 'loading customers...');
			await this.getCustomers();
			frappe.show_progress('Please Wait', 2, 11, 'loading items...');
			await this.getItems();
			frappe.show_progress('Please Wait', 3, 11, 'loading pos profiles');
			await this.getPosProfiles();
			frappe.show_progress('Please Wait', 4, 11, 'Please wait');
			await this.getBins();
			frappe.show_progress('Please Wait', 5, 11, 'loading warehouses');
			await this.getWarehouses();
			frappe.show_progress('Please Wait', 6, 11, 'loading price lists');
			await this.getPriceLists();
			frappe.show_progress('Please Wait', 7, 11, 'loading item prices');
			await this.getItemPrices();
			frappe.show_progress('Please Wait', 8, 11, 'loading item groups');
			await this.getItemGroups();
			frappe.show_progress('Please Wait', 9, 11, 'loading invoices');
			await this.getPosInvoices();
			frappe.show_progress('Please Wait', 10, 11, 'Please check in out');
			await this.getCheckInOuts();
			frappe.hide_progress();
			frappe.hide_progress();
			frappe.hide_progress();

			this.since = frappe.datetime.now_datetime()
			localStorage.setItem('lastTime', frappe.datetime.now_datetime());


			console.log("app data : " , this.appData)
		}catch(err){
			console.error("appData Class Error  : " , err)
			frappe.hide_progress();
		}
			frappe.hide_progress();


	}


	async getCustomers(){
		/*the function should combine the two the logic didnt complite yet we still working on it*/
		//get local
		//this.appData.customers = await this.db.getAllCustomers();
		const localCustomers = await this.db.getAllCustomers();
		//get remote
		const updatedCustomers = await this.api_handler.fetchCustomers(this.since)
		//save new customers
		await this.db.saveCustomerList(updatedCustomers)

		this.appData.customers = this.combineLocalAndUpdated(localCustomers,updatedCustomers)

	}
	async getBrands(){
		//get local
		//get remote
		this.appData.brands = await this.api_handler.fetchBrands(this.since)
	}
	async getItems(){
		//get local
		const localItems   = await this.db.getAllItems();
		//get remote
		const updatedItems = await this.api_handler.fetchItems(this.since)
		//save new items
		await this.db.saveItemList(updatedItems)

		this.appData.items = this.combineLocalAndUpdated(localItems,updatedItems)
	}
	async getPosProfiles(){
		//get local
		const localPosProfiles    = await this.db.getAllPosProfile();
		//get remote
		const updatedPosProfiles  = await this.api_handler.fetchPosProfileList(this.since)
		//save new pos profiles
		await this.db.savePosProfileList(updatedPosProfiles)

		this.appData.pos_profiles = this.combineLocalAndUpdated(localPosProfiles,updatedPosProfiles)
	}
	async getBins(){
		//get local
		const localBins   = await this.db.getAllBin();
		//get remote
		const updatedBins = await this.api_handler.fetchBinList(this.since)
		//save new bins
		await this.db.saveBinList(updatedBins)

		this.appData.bins = this.combineLocalAndUpdated(localBins,updatedBins)
	}
	async getWarehouses(){
		//get local
		const localWarehouses   = await this.db.getAllWarehouse();
		//warehouse
		const updatedWarehouses = await this.api_handler.fetchWarehouseList(this.since)
		//save new warehouse
		await this.db.saveWarehouseList(updatedWarehouses);
		this.appData.warehouses = this.combineLocalAndUpdated(localWarehouses,updatedWarehouses)
	}
	async getPriceLists(){
		//get local
		const localPriceLists  = await this.db.getAllPriceList();
		//get remote
		const updatedPriceList = await this.api_handler.fetchPriceList(this.since)
		//save new price list
		await this.db.savePriceLists(updatedPriceList)

		this.appData.price_lists = this.combineLocalAndUpdated(localPriceLists,updatedPriceList)
	}
	async getItemPrices(){
		//get local
		const localItemPrices = await this.db.getAllItemPrice();
		//get remote
		const updateItemPrices = await this.api_handler.fetchItemPrice(this.since)
		await this.db.saveItemPriceList(updateItemPrices);

		this.appData.item_prices = this.combineLocalAndUpdated(localItemPrices,updateItemPrices)
		console.log()
	}
	async getItemGroups(){
		//get local
		const localItemGroups = await this.db.getAllItemGroup();
		//get remote
		const updatedItemGroups = await this.api_handler.fetchItemGroups(this.since)
		await this.db.saveItemGroupList(updatedItemGroups)

		this.appData.item_groups = this.combineLocalAndUpdated(localItemGroups,updatedItemGroups)
	}
	async getPosInvoices(){
		//get local
		this.appData.pos_invoices = await this.db.getAllPosInvoice();
	}
	async getCheckInOuts(){
		//get local
		this.appData.check_in_outs = await this.db.getAllCheckInOut();
	}



	saveCheckInOut(checkInOut,onSuccess,onFailure){
		this.db.saveCheckInOut(checkInOut,onSuccess,onFailure)
	}
	savePosInvoice(posInvoice){
		this.db.savePosInvoice(posInvoice)
	}
	updatePosInvoice(posInvoice){
		this.db.updatePosInvoice(posInvoice)
	}
	getNotSyncedPos(onSuccess,onFailure){
		this.db.getNotSyncedPos(
			(res)=>{
				onSuccess(res)
			},(err)=>{
				onFailure(err)
			}
		)
	}
	getNotSyncedPosNumber(onSuccess,onFailure){
		this.db.getNotSyncedPosNumber(
			(res)=>{
				onSuccess(res)
			},(err)=>{
				onFailure(err)
			}
		)
	}


	/******************  function ***************************/
	combineLocalAndUpdated(local,updated){
		// Create a map from the local data array using a unique identifier (name)
		const combinedMap = new Map(local.map(item => [item.name, item]));
		// Loop through each item in the updated data
		updated.forEach(updatedItem=>{
			combinedMap.set(updatedItem.name , updatedItem)
		})

		return Array.from(combinedMap.values())
	}
}
