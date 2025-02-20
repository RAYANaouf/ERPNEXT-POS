frappe.provide("pos_ar.myaccessories");



frappe.pages['myaccessories'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'My Accessories',
		single_column: true
	});

	frappe.require(["pos.bundle.js"], function() {
        new pos_ar.myaccessories.AccessoriesController(wrapper);
    });
}