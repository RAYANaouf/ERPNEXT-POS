// apps/pos_ar/pos_ar/public/js/pos.bundle.js

// 1. Ensure Frappe namespace exists
frappe.provide("pos_ar.PointOfSale");

// 2. Import sub-modules and controllers relative to the page directory
import "../../pos_ar/page/pos/data/posAppData.js";
import "../../pos_ar/page/pos/data/posSettingsData.js";
import "../../pos_ar/page/pos/remoteApi/FetchHandler.js";
import "../../pos_ar/page/pos/manager/ScreenManager.js";

import "../../pos_ar/page/pos/pos_db.js";
import "../../pos_ar/page/pos/pos_check_in_out.js";
import "../../pos_ar/page/pos/pos_customer_box.js";
import "../../pos_ar/page/pos/pos_debt_cart.js";
import "../../pos_ar/page/pos/pos_history.js";
import "../../pos_ar/page/pos/pos_item_details.js";
import "../../pos_ar/page/pos/pos_item_selector.js";
import "../../pos_ar/page/pos/pos_payment_cart.js";
import "../../pos_ar/page/pos/pos_selected_item_cart.js";
import "../../pos_ar/page/pos/pos_settings.js";
import "../../pos_ar/page/pos/pos_unsynced_cart.js";

import "../../pos_ar/page/pos/posController.js";

pos_ar.insertPosInvoice = function (pos) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: "pos_ar.api.insert_pos_invoice",
			args: { doc: pos },
			callback: (r) => {
				const res = r.message || {};
				if (res.ok) {
					resolve(res.doc);
					return;
				}
				frappe.msgprint({
					title: res.title || __("Error"),
					indicator: "red",
					message: res.message || __("Could not save POS Invoice"),
				});
				reject(res);
			},
			error: (err) => reject(err),
		});
	});
};

// 3. Ensure Controller is exposed on window for page initialization
if (typeof pos_ar !== "undefined" && pos_ar.PointOfSale) {
    window.pos_ar = pos_ar;
}
