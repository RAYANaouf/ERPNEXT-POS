frappe.provide("pos_ar.Pricing");

frappe.pages['pricing'].on_page_load = function(wrapper) {
    console.log(wrapper);

    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Pricing',
        single_column: true
    });

    frappe.require(["pos.bundle.js"], function() {
        new pos_ar.Pricing.PricingController(wrapper);
    });
};
