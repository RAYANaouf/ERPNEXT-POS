pos_ar.PointOfSale.posAppData = class {

	constructor(
		db,
		apiHandler
	){
		this.db          = db;
		this.api_handler = apiHandler;

		this.appData = {} ;
		this.getAllData()
	}

	async getAllData(){
		try{
			this.getCustomers();
			this.getItems();
			this.getPosProfiles();
			this.getBins();
			this.getWarehouses();
			this.getPriceLists();
			this.getItemPrices();
			this.getItemGroups();
			this.getPosInvoices();
			this.getCheckInOuts();
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
		this.appData.pos_profiles = await this.db.getAllPosProfile();
	}
	async getBins(){
		//get local bins
		this.appData.bins = await this.db.getAllBin();
	}
	async getWarehouses(){
		//get local warehouses
		this.appData.warehouses = await this.db.getAllWarehouse();
	}
	async getPriceLists(){
		//get local price lists
		this.appData.price_lists = await this.db.getAllPriceList();
	}
	async getItemPrices(){
		//get local item prices
		this.appData.item_prices = await this.db.getAllItemPrice();
	}
	async getItemGroups(){
		//get local item groups
		this.appData.item_groups = await this.db.getAllItemGroup();
	}
	async getPosInvoices(){
		//get local pos invoices
		this.appData.pos_invoices = await this.db.getAllPosInvoice();
	}
	async getCheckInOuts(){
		//get local chechInOuts
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
