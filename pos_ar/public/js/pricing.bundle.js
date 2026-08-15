// apps/pos_ar/pos_ar/public/js/pricing.bundle.js

// 1. Ensure Frappe namespace exists
frappe.provide("pos_ar.Pricing");

// 2. Import pricing sub-modules and controllers relative to this file
import "../../pos_ar/page/pricing/remote/fetcher.js";
import "../../pos_ar/page/pricing/PricingController.js";

// 3. Ensure Pricing is exposed on window for page initialization
if (typeof pos_ar !== "undefined" && pos_ar.Pricing) {
    window.pos_ar = pos_ar;
}
