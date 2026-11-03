frappe.listview_settings["Transfer Control"] = {
    add_fields: ["is_active"],
    get_indicator(doc) {
        return doc.is_active ? [__("Active"), "green", "is_active,=,1"] : [__("Inactive"), "gray", "is_active,=,0"];
    },
};
