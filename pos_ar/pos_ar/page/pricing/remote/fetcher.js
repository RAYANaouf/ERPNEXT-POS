pos_ar.Pricing.PricingFetcher = class {

    constructor(){
        console.log("PricingFetcher initialized");
    }


	async fetchItemPrices( company ) {
		try {
			const response = await frappe.call({
				method: 'pos_ar.pos_ar.doctype.pos_info.pos_info.get_item_prices',
				args: { company }
			});
			console.log("fetched item prices" , response.message);
			return response.message || [];  // The fetched item prices
		} catch (error) {
			console.error('Error fetching item prices:', error);
			return [];
		}
	}


}