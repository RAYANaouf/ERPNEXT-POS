// apps/pos_ar/pos_ar/public/js/myaccessories.bundle.js

// 1. Ensure Frappe namespace exists
frappe.provide("pos_ar.myaccessories");

// 2. Import my accessories controller relative to this file
import "../../pos_ar/page/myaccessories/AccessoriesController.js";

// 3. Ensure myaccessories is exposed on window for page initialization
if (typeof pos_ar !== "undefined" && pos_ar.myaccessories) {
    window.pos_ar = pos_ar;
}
