frappe.ui.form.on("Transfer Control", {
    setup(frm) {
        for (const field of ["source_warehouse", "target_warehouse"]) {
            frm.set_query(field, () => ({filters: {
                company: frm.doc.company || "__select_a_company__",
                disabled: 0,
                is_group: 0,
                ...(field === "target_warehouse" && frm.doc.source_warehouse
                    ? {name: ["!=", frm.doc.source_warehouse]} : {}),
            }}));
        }
    },
    refresh(frm) {
        frm.set_intro(__("Transfer controls apply when saving, including drafts. Open a row to set the signs, power ranges and decision."), "blue");
        for (const row of frm.doc.rules || []) {
            row.summary = get_transfer_rule_summary(row);
        }
        frm.refresh_field("rules");
    },
    company(frm) {
        frm.set_value({source_warehouse: "", target_warehouse: ""});
    },
    source_warehouse(frm) {
        if (frm.doc.source_warehouse === frm.doc.target_warehouse) {
            frm.set_value("target_warehouse", "");
        }
    },
});

function format_transfer_power(value) {
    const language = (frappe.boot.lang || "en").replace(/_/g, "-");
    return flt(value).toLocaleString(language, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function get_transfer_rule_summary(row) {
    const range = (axis) => {
        const sign = row[`${axis}_sign`] === "Both" ? "±" : row[`${axis}_sign`] || "±";
        const min = format_transfer_power(row[`${axis}_min`]);
        const max = format_transfer_power(row[`${axis}_max`]);
        const power_range = min === max ? __("{0} only", [min])
            : row[`${axis}_max_exclusive`]
                ? __("{0} to {1}, maximum excluded", [min, max])
                : __("{0} to {1}, maximum included", [min, max]);
        return `${axis.toUpperCase()} ${sign}: ${power_range}`;
    };
    let summary = `${range("sph")} / ${range("cyl")}`;
    if (row.decision === "Limit Quantity") summary += " · " + __("Max. {0}", [flt(row.max_qty)]);
    return summary;
}

function update_transfer_rule_summary(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    frappe.model.set_value(cdt, cdn, "summary", get_transfer_rule_summary(row));
}

const transfer_rule_power_fields = ["sph_sign", "sph_min", "sph_max", "sph_max_exclusive", "cyl_sign", "cyl_min", "cyl_max", "cyl_max_exclusive"];
frappe.ui.form.on("Transfer Control Rule", {
    ...Object.fromEntries([...transfer_rule_power_fields, "decision", "max_qty", "rules_add"]
        .map((field) => [field, (frm, cdt, cdn) => {
            update_transfer_rule_summary(frm, cdt, cdn);
            return show_transfer_group_info(frm, cdt, cdn);
        }])),
    item_group: show_transfer_group_info,
    form_render: show_transfer_group_info,
});

async function show_transfer_group_info(frm, cdt, cdn) {
    const row = locals[cdt]?.[cdn];
    const grid_row = frm.fields_dict.rules.grid.grid_rows_by_docname[cdn];
    const help = grid_row?.grid_form?.fields_dict.group_power_help;
    if (!help || !row?.item_group) return;
    const key = JSON.stringify([row.item_group,
        ...transfer_rule_power_fields.map((field) => row[field])]);
    grid_row.transfer_power_request = key;
    const selected = Object.fromEntries(transfer_rule_power_fields.map((field) => [field, row[field]]));
    help.$wrapper.html(`<div class="text-muted">${__("Checking items in this group...")}</div>`);
    const response = await frappe.call({
        method: "pos_ar.pos_ar.doctype.transfer_control.transfer_control.get_group_power_info",
        args: {item_group: row.item_group, rule: selected},
    });
    if (grid_row.transfer_power_request !== key) return;
    const data = response.message;
    if (!data) return;
    const group_name = frappe.utils.escape_html(row.item_group);
    const details = data.total
        ? __("{0} active item(s). Values without signs: SPH from {1} to {2}; CYL from {3} to {4}.",
            [data.total, format_transfer_power(data.sph_min), format_transfer_power(data.sph_max), format_transfer_power(data.cyl_min), format_transfer_power(data.cyl_max)])
        : __("No active items are visible in this group.");
    const count = data.matching_count ?? 0;
    const message = count
        ? __("{0} item(s) match the selected signs and ranges.", [count])
        : __("No items match the selected signs and ranges. This rule will not restrict any current items in this group.");
    help.$wrapper.html(`<div class="alert ${count ? "alert-info" : "alert-warning"}"><strong>${group_name}</strong><br>${details}<br><strong>${message}</strong></div>`);
}
