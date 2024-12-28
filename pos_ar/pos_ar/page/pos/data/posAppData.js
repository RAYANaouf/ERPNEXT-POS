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
			frappe.show_progress('Please Wait', 0, 12, 'loading deleted documents');
			await this.getDeletedDocs()
			frappe.show_progress('Please Wait', 1, 12, 'loading customers...');
			await this.getCustomers();
			frappe.show_progress('Please Wait', 2, 12, 'loading items...');
			await this.getItems();
			frappe.show_progress('Please Wait', 3, 12, 'loading pos profiles');
			await this.getPosProfiles();
			frappe.show_progress('Please Wait', 4, 12, 'loading mode of payment');
			await this.getPosProfileModeOfPayments(this.appData.pos_profile)
			await this.getBins();
			frappe.show_progress('Please Wait', 5, 12, 'loading warehouses');
			await this.getWarehouses();
			frappe.show_progress('Please Wait', 6, 12, 'loading price lists');
			await this.getPriceLists();
			frappe.show_progress('Please Wait', 7, 12, 'loading item prices');
			await this.getItemPrices();
			frappe.show_progress('Please Wait', 8, 12, 'loading item groups');
			await this.getItemGroups();
			frappe.show_progress('Please Wait', 9, 12, 'loading invoices');
			await this.getPosInvoices();
			frappe.show_progress('Please Wait', 10, 12, 'loading check in out');
			await this.getCheckInOuts();
			frappe.show_progress('Please Wait', 11, 12, 'loading barcodes');
			await this.getItemBarcodes()
			frappe.show_progress('Please Wait', 12, 12, 'Completed');
			frappe.hide_progress();
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
		//const localCustomers = await this.db.getAllCustomers();
		const localCustomers = [];
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
		//const localItems   = await this.db.getAllItems();
		const localItems   = [];
		//get remote
		const updatedItems = await this.api_handler.fetchItems(this.since)
		//save new items
		await this.db.saveItemList(updatedItems)

		this.appData.items = this.combineLocalAndUpdated(localItems,updatedItems)
	}
	async getPosProfiles(){
		this.appData.pos_profile  =  await this.api_handler.fetchPosProfile(this.since)
	}
	async getPosProfileModeOfPayments(posProfile){
		let modeOfPaymentsIds = []
		posProfile.payments.forEach(modeId=>{
			modeOfPaymentsIds.push(modeId.mode_of_payment)
		})
		this.appData.posProfileModeOfPayments = await this.api_handler.fetchPosProfileModeOfPayments(modeOfPaymentsIds , posProfile.company)
	}
	async getBins(){
		//get local
		//const localBins   = await this.db.getAllBin();
		const localBins   = [];
		//get remote
		const updatedBins = await this.api_handler.fetchBinList(this.since)
		//save new bins
		await this.db.saveBinList(updatedBins)

		this.appData.bins = this.combineLocalAndUpdated(localBins,updatedBins)
	}
	async getWarehouses(){
		//get local
		//const localWarehouses   = await this.db.getAllWarehouse();
		const localWarehouses   = [];
		//warehouse
		const updatedWarehouses = await this.api_handler.fetchWarehouseList(this.since)
		//save new warehouse
		await this.db.saveWarehouseList(updatedWarehouses);
		this.appData.warehouses = this.combineLocalAndUpdated(localWarehouses,updatedWarehouses)
	}
	async getPriceLists(){
		//get local
		//const localPriceLists  = await this.db.getAllPriceList();
		const localPriceLists  = [];
		//get remote
		const updatedPriceList = await this.api_handler.fetchPriceList(this.since)
		//save new price list
		await this.db.savePriceLists(updatedPriceList)

		this.appData.price_lists = this.combineLocalAndUpdated(localPriceLists,updatedPriceList)
	}
	async getItemPrices(){
		//get local
		//const localItemPrices = await this.db.getAllItemPrice();
		const localItemPrices = [];
		//get remote
		const updateItemPrices = await this.api_handler.fetchItemPrice(this.since)
		await this.db.saveItemPriceList(updateItemPrices);

		this.appData.item_prices = this.combineLocalAndUpdated(localItemPrices,updateItemPrices)
		console.log()
	}
	async getItemGroups(){
		//get local
		//const localItemGroups = await this.db.getAllItemGroup();
		const localItemGroups = [];
		//get remote
		const updatedItemGroups = await this.api_handler.fetchItemGroups(this.since)
		await this.db.saveItemGroupList(updatedItemGroups)

		this.appData.item_groups = this.combineLocalAndUpdated(localItemGroups,updatedItemGroups)
	}
	async getItemBarcodes(){
		this.appData.item_barcodes = await this.api_handler.fetchItemBarCodes()
	}
	async getPosInvoices(){
		//get local
		this.appData.pos_invoices = await this.db.getAllPosInvoice();
	}
	async getCheckInOuts(){
		//get local
		this.appData.check_in_outs = await this.db.getAllCheckInOut();
	}

	async getDeletedDocs(){
		//get local
		this.appData.deleted_documents = await this.api_handler.fetchDeletedDocs(this.since);
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


	async fetchDebts(customerName){
		return await this.api_handler.fetchDebts(customerName)
	}
	async fetchDebtsSalesInvoices(customerName){
		return await this.api_handler.fetchDebtsSalesInvoices(customerName)
	}



	async fetchCustomerDebt( customerName){
		return await this.api_handler.fetchCustomerDebt( customerName )
	}

	async update_invoice_payment(invoiceName , amount){

		const rest = await this.api_handler.update_invoice_payment( invoiceName , amount)


		await this.getPosInvoices()

		this.appData.pos_invoices.forEach(invoice=>{
			if(invoice.real_name == invoiceName){
				let newInvoice = structuredClone(invoice)
				newInvoice.outstanding_amount = rest.outstanding_amount
				newInvoice.paid_amount        = rest.paid_amount
				newInvoice.status             = rest.paid
				newInvoice.real_name          = rest.real_name
				this.db.updatePosInvoice(newInvoice)
			}
		})

		return rest
	}
	async update_sales_invoice_payment(invoiceName , amount){

		const rest = await this.api_handler.update_sales_invoice_payment( invoiceName , amount)


		console.log("rest ::: " , rest);
		rest.invoices.forEach(invoice=>{
			this.appData.pos_invoices.forEach(posInvoice=>{
				if(posInvoice.real_name == invoice.name){
					posInvoice.consolidated_invoice = invoiceName
					posInvoice.start_paying         = true
					if(rest.status == "Paid"){
						posInvoice.outstanding_amount = 0
						posInvoice.paid_amount        = invoice.total
						posInvoice.grand_paid_amount  = invoice.total
						posInvoice.status             = 'Paid'
					}
					this.db.updatePosInvoice(posInvoice)
				}
			})
		})

		//update related data
		await this.getPosInvoices()

		return rest
	}

	async paySelectedInvoice(invoices , amount){
		const rest = await this.api_handler.pay_selected_invoice( invoices , amount)

		rest.invoices_state_collection.forEach(invoices_status =>{
			invoices_status.invoices.forEach(invoice=>{
				this.appData.pos_invoices.forEach(posInvoice=>{
					if(posInvoice.real_name == invoice.name){
						posInvoice.consolidated_invoice = invoices_status.sales_invoice_name
						posInvoice.start_paying         = true
						if(invoices_status.status == "Paid"){
							posInvoice.outstanding_amount = 0
							posInvoice.paid_amount        = invoice.total
							posInvoice.grand_paid_amount  = invoice.total
							posInvoice.status             = 'Paid'
						}
						this.db.updatePosInvoice(posInvoice)
					}
				})
			})
		})

		return rest
	}

	async getAllOpenedPosInvoice(){
		return await this.db.getAllOpenedPosInvoice()
	}

	async deletePosInvoice_callback(invoiceName,onSuccess,onFailure){
		this.db.deletePosInvoice_callback(
			invoiceName,
			onSuccess,
			onFailure
		)
	}
	/******************  function ***************************/
	combineLocalAndUpdated(local,updated){
		// Create a map from the local data array using a unique identifier (name)
		const combinedMap = new Map(local.map(item => [item.name, item]));
		// Loop through each item in the updated data
		this.appData.deleted_documents.forEach(deleted=>{
			combinedMap.delete( deleted.name )
		})
		updated.forEach(updatedItem=>{
			combinedMap.set(updatedItem.name , updatedItem)
		})

		return Array.from(combinedMap.values())
	}

}
