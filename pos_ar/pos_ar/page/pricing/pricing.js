
frappe.provide("pos_ar.Pricing");

frappe.pages['pricing'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'pricing',
		single_column: true
	});

	frappe.require([
		"pos.bundle.js"
		], function() {
		new pos_ar.Pricing.Controller(wrapper);
		//wrapper.pos = new pos_ar.PointOfSale.Controller(wrapper);
		//window.cur_pos = wrapper.pos ;
	});
}