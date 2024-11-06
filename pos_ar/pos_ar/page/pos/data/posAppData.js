pos_ar.PointOfSale.posAppData = class {

	constructor(
		db,
		apiHandler
	){
		this.db          = db;
		this.api_handler = apiHandler;

		this.appData = {} ;
	}


	async getAllData(){
		try{
			frappe.show_progress('Loading..', 1, 11, 'Please wait');
			await this.getCustomers();
			frappe.show_progress('Loading..', 2, 11, 'Please wait');
			await this.getItems();
			frappe.show_progress('Loading..', 3, 11, 'Please wait');
			await this.getPosProfiles();
			frappe.show_progress('Loading..', 4, 11, 'Please wait');
			await this.getBins();
			frappe.show_progress('Loading..', 5, 11, 'Please wait');
			await this.getWarehouses();
			frappe.show_progress('Loading..', 6, 11, 'Please wait');
			await this.getPriceLists();
			frappe.show_progress('Loading..', 7, 11, 'Please wait');
			await this.getItemPrices();
			frappe.show_progress('Loading..', 8, 11, 'Please wait');
			await this.getItemGroups();
			frappe.show_progress('Loading..', 9, 11, 'Please wait');
			await this.getPosInvoices();
			frappe.show_progress('Loading..', 10, 11, 'Please wait');
			await this.getCheckInOuts();
			frappe.show_progress('Loading..', 11, 11, 'Please wait');
			frappe.hide_progress();
			frappe.hide_progress();
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
		this.appData.customers = await this.db.getAllCustomers();
		//get remote
		this.appData.customers = await this.api_handler.fetchCustomers()
	}
	async getBrands(){
		//get local
		//get remote
		this.appData.brands = await this.api_handler.fetchBrands()
	}
	async getItems(){
		//get local
		this.appData.items = await this.db.getAllItems();
		//get remote
		this.appData.items = await this.api_handler.fetchItems()
	}
	async getPosProfiles(){
		//get local
		this.appData.pos_profiles = await this.db.getAllPosProfile();
		//get remote
		this.appData.pos_profiles = await this.api_handler.fetchPosProfileList()
	}
	async getBins(){
		//get local
		this.appData.bins = await this.db.getAllBin();
		//get remote
		this.appData.bins = await this.api_handler.fetchBinList()
	}
	async getWarehouses(){
		//get local
		this.appData.warehouses = await this.db.getAllWarehouse();
		//warehouse
		this.appData.warehouses = await this.api_handler.fetchWarehouseList()
	}
	async getPriceLists(){
		//get local
		this.appData.price_lists = await this.db.getAllPriceList();
		//get remote
		this.appData.price_lists = await this.api_handler.fetchPriceList()
	}
	async getItemPrices(){
		//get local
		this.appData.item_prices = await this.db.getAllItemPrice();
		//get remote
		this.appData.item_prices = await this.api_handler.fetchItemPrice()
	}
	async getItemGroups(){
		//get local
		this.appData.item_groups = await this.db.getAllItemGroup();
		//get remote
		this.appData.item_groups = await this.api_handler.fetchItemGroups()
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

}
