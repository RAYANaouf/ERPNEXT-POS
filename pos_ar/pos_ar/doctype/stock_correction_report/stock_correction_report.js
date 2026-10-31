// Copyright (c) 2026, rayan aouf and contributors
// For license information, please see license.txt

frappe.ui.form.on("Stock Correction Report", {
    onload(frm) {
        if (frm.is_new()) {
            frm.set_value({
                material_issue_ref: null,
                material_receipt_ref: null,
            });
        }
    },

    company(frm) {
        if (frm.doc.warehouse) {
            frm.set_value("warehouse", null);
        }
    },

    setup(frm) {
        frm.set_query("warehouse", () => ({
            filters: {
                company: frm.doc.company || "",
                is_group: 0,
                disabled: 0,
            },
        }));

        frm.set_query("incident_reason", () => ({
            filters: {
                is_active: 1,
                applies_to: "Stock Correction",
            },
        }));
    },
});
