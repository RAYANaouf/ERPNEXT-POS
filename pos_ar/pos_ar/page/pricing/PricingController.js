
frappe.provide("pos_ar.Pricing");

pos_ar.Pricing.PricingController = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");;
        this.add_style();
    }


    add_style(){
        this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/pricing_page/main.css">')

        console.log("i'm here");
    }
};
