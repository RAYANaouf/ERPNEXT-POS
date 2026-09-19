# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt

import copy

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

MODULE = "POS AR"
INCIDENT_PURPOSES = 'eval:in_list(["Material Issue", "Material Receipt"], doc.purpose)'
INCIDENT_CHECKED = "eval:doc.custom_is_stock_incident"

STOCK_ENTRY_INCIDENT_FIELDS = {
	"Stock Entry": [
		{
			"fieldname": "custom_incident_section",
			"fieldtype": "Section Break",
			"label": "Incident / Anomalie",
			"insert_after": "inspection_required",
			"depends_on": INCIDENT_PURPOSES,
			"module": MODULE,
		},
		{
			"fieldname": "custom_is_stock_incident",
			"label": "Incident",
			"fieldtype": "Check",
			"insert_after": "custom_incident_section",
			"default": "0",
			"depends_on": INCIDENT_PURPOSES,
			"in_list_view": 1,
			"in_standard_filter": 1,
			"module": MODULE,
		},
		{
			"fieldname": "custom_cb_incident",
			"fieldtype": "Column Break",
			"insert_after": "custom_is_stock_incident",
			"depends_on": INCIDENT_CHECKED,
			"module": MODULE,
		},
		{
			"fieldname": "custom_incident_reason",
			"label": "Raison",
			"fieldtype": "Link",
			"options": "Stock Incident Reason",
			"insert_after": "custom_cb_incident",
			"depends_on": INCIDENT_CHECKED,
			"mandatory_depends_on": INCIDENT_CHECKED,
			"in_list_view": 1,
			"in_standard_filter": 1,
			"module": MODULE,
		},
		{
			"fieldname": "custom_incident_details_sb",
			"fieldtype": "Section Break",
			"insert_after": "custom_incident_reason",
			"depends_on": INCIDENT_CHECKED,
			"module": MODULE,
		},
		{
			"fieldname": "custom_incident_notes",
			"label": "Details",
			"fieldtype": "Small Text",
			"insert_after": "custom_incident_details_sb",
			"depends_on": INCIDENT_CHECKED,
			"description": "Ex: carton fuyant, environ 20 verres",
			"module": MODULE,
		},
	]
}

DEFAULT_REASONS = [
	{
		"reason_name": "Carton fuyant",
		"applies_to": "Issue",
		"description": "Boite / carton qui fuit, verres abimes",
	},
	{
		"reason_name": "Emballage endommage",
		"applies_to": "Issue",
		"description": "Carton ou blister casse, ouvert ou ecrase",
	},
	{
		"reason_name": "Verres casses",
		"applies_to": "Issue",
		"description": "Verres (lens) casses ou inutilisables",
	},
	{
		"reason_name": "Manquant ou perdu",
		"applies_to": "Issue",
		"description": "Quantite manquante a l'ouverture du carton",
	},
	{
		"reason_name": "Rejet qualite",
		"applies_to": "Issue",
		"description": "Pieces refusees pour defaut qualite",
	},
	{
		"reason_name": "Peremption",
		"applies_to": "Issue",
		"description": "Produit expire",
	},
	{
		"reason_name": "Stock trouve",
		"applies_to": "Receipt",
		"description": "Pieces retrouvees ou non saisies",
	},
	{
		"reason_name": "Retour apres incident",
		"applies_to": "Receipt",
		"description": "Pieces recuperees apres un incident",
	},
	{
		"reason_name": "Autre",
		"applies_to": "Both",
		"description": "Autre cause, a preciser dans les details",
	},
]

STOCK_ENTRY_INCIDENT_CLIENT_SCRIPT = """
frappe.ui.form.on("Stock Entry", {
	onload(frm) {
		setup_incident_reason_query(frm);
	},

	refresh(frm) {
		setup_incident_reason_query(frm);
		toggle_incident_fields(frm);
	},

	purpose(frm) {
		reset_incident_if_needed(frm);
		setup_incident_reason_query(frm);
		toggle_incident_fields(frm);
	},

	stock_entry_type(frm) {
		reset_incident_if_needed(frm);
		setup_incident_reason_query(frm);
		toggle_incident_fields(frm);
	},

	custom_is_stock_incident(frm) {
		if (!frm.doc.custom_is_stock_incident) {
			frm.set_value("custom_incident_reason", "");
			frm.set_value("custom_incident_notes", "");
		}
		toggle_incident_fields(frm);
	},
});

function is_issue_or_receipt(frm) {
	const purpose = frm.doc.purpose || "";
	const entry_type = frm.doc.stock_entry_type || "";
	return (
		["Material Issue", "Material Receipt"].includes(purpose) ||
		["Material Issue", "Material Receipt"].includes(entry_type)
	);
}

function incident_applies_to(frm) {
	const purpose = frm.doc.purpose || frm.doc.stock_entry_type || "";
	if (purpose === "Material Receipt") {
		return "Receipt";
	}
	return "Issue";
}

function toggle_incident_fields(frm) {
	const show = is_issue_or_receipt(frm);
	frm.toggle_display("custom_incident_section", show);
	frm.toggle_display("custom_is_stock_incident", show);

	const show_details = show && Number(frm.doc.custom_is_stock_incident);
	[
		"custom_cb_incident",
		"custom_incident_reason",
		"custom_incident_details_sb",
		"custom_incident_notes",
	].forEach((field) => frm.toggle_display(field, show_details));

	frm.toggle_reqd("custom_incident_reason", show_details);
}

function reset_incident_if_needed(frm) {
	if (is_issue_or_receipt(frm)) {
		return;
	}
	if (frm.doc.custom_is_stock_incident) {
		frm.set_value("custom_is_stock_incident", 0);
	}
	frm.set_value("custom_incident_reason", "");
	frm.set_value("custom_incident_notes", "");
}

function setup_incident_reason_query(frm) {
	if (!frm.fields_dict.custom_incident_reason) {
		return;
	}
	frm.set_query("custom_incident_reason", function () {
		return {
			filters: {
				is_active: 1,
				applies_to: ["in", [incident_applies_to(frm), "Both"]],
			},
		};
	});
}
"""

STOCK_INCIDENTS_REPORT_SCRIPT = """
columns = [
	{"label": _("Date"), "fieldname": "posting_date", "fieldtype": "Date", "width": 100},
	{"label": _("Stock Entry"), "fieldname": "stock_entry", "fieldtype": "Link", "options": "Stock Entry", "width": 140},
	{"label": _("Purpose"), "fieldname": "purpose", "fieldtype": "Data", "width": 140},
	{"label": _("Raison"), "fieldname": "reason", "fieldtype": "Link", "options": "Stock Incident Reason", "width": 160},
	{"label": _("User"), "fieldname": "owner", "fieldtype": "Link", "options": "User", "width": 140},
	{"label": _("Warehouse"), "fieldname": "warehouse", "fieldtype": "Link", "options": "Warehouse", "width": 150},
	{"label": _("Item Name"), "fieldname": "item_name", "fieldtype": "Data", "width": 160},
	{"label": _("Qty"), "fieldname": "qty", "fieldtype": "Float", "width": 90},
	{"label": _("Details"), "fieldname": "notes", "fieldtype": "Data", "width": 220},
]

meta = frappe.get_meta("Stock Entry")
if not meta.has_field("custom_is_stock_incident"):
	data = [columns, [], None, None, []]
else:
	conditions = []
	values = {}

	if filters.get("from_date"):
		conditions.append("se.posting_date >= %(from_date)s")
		values["from_date"] = frappe.utils.getdate(filters.from_date)
	if filters.get("to_date"):
		conditions.append("se.posting_date <= %(to_date)s")
		values["to_date"] = frappe.utils.getdate(filters.to_date)
	if filters.get("company"):
		conditions.append("se.company = %(company)s")
		values["company"] = filters.company
	if filters.get("purpose"):
		conditions.append("se.purpose = %(purpose)s")
		values["purpose"] = filters.purpose
	if filters.get("reason") and meta.has_field("custom_incident_reason"):
		conditions.append("se.custom_incident_reason = %(reason)s")
		values["reason"] = filters.reason
	if filters.get("owner"):
		conditions.append("se.owner = %(owner)s")
		values["owner"] = filters.owner
	if filters.get("warehouse"):
		conditions.append(
			"(sed.s_warehouse = %(warehouse)s or sed.t_warehouse = %(warehouse)s"
			" or se.from_warehouse = %(warehouse)s or se.to_warehouse = %(warehouse)s)"
		)
		values["warehouse"] = filters.warehouse

	condition_sql = ""
	if conditions:
		condition_sql = " and " + " and ".join(conditions)

	notes_select = "se.remarks as notes"
	if meta.has_field("custom_incident_notes"):
		notes_select = "ifnull(se.custom_incident_notes, se.remarks) as notes"

	reason_select = "'' as reason"
	if meta.has_field("custom_incident_reason"):
		reason_select = "se.custom_incident_reason as reason"

	query = (
		"select se.posting_date, se.name as stock_entry, se.purpose, "
		+ reason_select + ", se.owner, "
		+ "ifnull(sed.s_warehouse, ifnull(se.from_warehouse, ifnull(sed.t_warehouse, se.to_warehouse))) as warehouse, "
		+ "sed.item_name, sed.qty, " + notes_select + " "
		+ "from `tabStock Entry` se "
		+ "inner join `tabStock Entry Detail` sed on sed.parent = se.name "
		+ "where se.docstatus = 1 "
		+ "and se.custom_is_stock_incident = 1 "
		+ "and se.purpose in ('Material Issue', 'Material Receipt') "
		+ condition_sql + " "
		+ "order by se.posting_date desc, se.name desc"
	)

	rows = frappe.db.sql(query, values, as_dict=True)

	qtys = {}
	entries = {}
	for row in rows:
		reason = row.get("reason") or _("Sans raison")
		qtys[reason] = qtys.get(reason, 0) + frappe.utils.flt(row.get("qty"))
		if reason not in entries:
			entries[reason] = []
		stock_entry = row.get("stock_entry")
		if stock_entry and stock_entry not in entries[reason]:
			entries[reason].append(stock_entry)

	labels = list(qtys.keys())
	incident_values = []
	qty_values = []
	for label in labels:
		incident_values.append(len(entries[label]))
		qty_values.append(qtys[label])

	chart = {
		"data": {
			"labels": labels,
			"datasets": [
				{"name": _("Incidents"), "values": incident_values},
				{"name": _("Quantite"), "values": qty_values},
			],
		},
		"type": "bar",
	}

	seen = []
	for row in rows:
		stock_entry = row.get("stock_entry")
		if stock_entry and stock_entry not in seen:
			seen.append(stock_entry)
	incident_count = len(seen)
	total_qty = 0
	for row in rows:
		total_qty = total_qty + frappe.utils.flt(row.get("qty"))

	summary = [
		{
			"value": incident_count,
			"label": _("Incidents"),
			"datatype": "Int",
			"indicator": "red" if incident_count else "green",
		},
		{
			"value": total_qty,
			"label": _("Pieces"),
			"datatype": "Float",
			"indicator": "orange" if total_qty else "green",
		},
	]

	data = [columns, rows, None, chart, summary]
"""

STOCK_INCIDENTS_REPORT_JS = """
frappe.query_reports["Stock Incidents"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			reqd: 1,
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,
		},
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
		},
		{
			fieldname: "purpose",
			label: __("Purpose"),
			fieldtype: "Select",
			options: "\\nMaterial Issue\\nMaterial Receipt",
		},
		{
			fieldname: "reason",
			label: __("Raison"),
			fieldtype: "Link",
			options: "Stock Incident Reason",
		},
		{
			fieldname: "owner",
			label: __("User"),
			fieldtype: "Link",
			options: "User",
		},
		{
			fieldname: "warehouse",
			label: __("Warehouse"),
			fieldtype: "Link",
			options: "Warehouse",
		},
	],
};
"""


def after_migrate():
	ensure_stock_entry_incident_fields()
	remove_obsolete_incident_fields()
	ensure_stock_incident_reasons()
	ensure_stock_entry_incident_client_script()
	ensure_stock_incidents_report()


def ensure_stock_entry_incident_fields():
	fields = copy.deepcopy(STOCK_ENTRY_INCIDENT_FIELDS["Stock Entry"])
	create_custom_fields({"Stock Entry": fields}, ignore_validate=True, update=True)


def remove_obsolete_incident_fields():
	"""Employee field removed: filter by User (owner) in the report instead."""
	for fieldname in ("custom_reported_by", "custom_cb_incident_details"):
		name = f"Stock Entry-{fieldname}"
		if frappe.db.exists("Custom Field", name):
			frappe.delete_doc("Custom Field", name, ignore_permissions=True, force=True)


def ensure_stock_incident_reasons():
	if not frappe.db.exists("DocType", "Stock Incident Reason"):
		return

	# Rename old reason if present
	if frappe.db.exists("Stock Incident Reason", "Lentilles cassees") and not frappe.db.exists(
		"Stock Incident Reason", "Verres casses"
	):
		frappe.rename_doc("Stock Incident Reason", "Lentilles cassees", "Verres casses", force=True)

	for row in DEFAULT_REASONS:
		if frappe.db.exists("Stock Incident Reason", row["reason_name"]):
			doc = frappe.get_doc("Stock Incident Reason", row["reason_name"])
			doc.applies_to = row["applies_to"]
			doc.description = row["description"]
			doc.is_active = 1
			doc.save(ignore_permissions=True)
			continue
		doc = frappe.get_doc(
			{
				"doctype": "Stock Incident Reason",
				"reason_name": row["reason_name"],
				"applies_to": row["applies_to"],
				"description": row["description"],
				"is_active": 1,
			}
		)
		doc.insert(ignore_permissions=True)

	# Move doctype module if still on CTN
	if frappe.db.exists("DocType", "Stock Incident Reason"):
		frappe.db.set_value("DocType", "Stock Incident Reason", "module", MODULE)


def ensure_stock_entry_incident_client_script():
	script_name = "Stock Entry Incident"
	values = {
		"dt": "Stock Entry",
		"view": "Form",
		"enabled": 1,
		"module": MODULE,
		"script": STOCK_ENTRY_INCIDENT_CLIENT_SCRIPT.strip(),
	}

	if frappe.db.exists("Client Script", script_name):
		doc = frappe.get_doc("Client Script", script_name)
		doc.update(values)
		doc.save(ignore_permissions=True)
	else:
		doc = frappe.get_doc({"doctype": "Client Script", "name": script_name, **values})
		doc.insert(ignore_permissions=True)


def ensure_stock_incidents_report():
	report_name = "Stock Incidents"
	values = {
		"report_name": report_name,
		"ref_doctype": "Stock Entry",
		"report_type": "Script Report",
		"is_standard": "No",
		"module": MODULE,
		"disabled": 0,
		"add_total_row": 1,
		"prepared_report": 0,
		"report_script": STOCK_INCIDENTS_REPORT_SCRIPT.strip(),
		"javascript": STOCK_INCIDENTS_REPORT_JS.strip(),
	}

	roles = [
		{"role": "Stock User"},
		{"role": "Stock Manager"},
		{"role": "System Manager"},
	]

	if frappe.db.exists("Report", report_name):
		doc = frappe.get_doc("Report", report_name)
		doc.update(values)
		doc.set("roles", [])
		for role in roles:
			doc.append("roles", role)
		doc.save(ignore_permissions=True)
	else:
		doc = frappe.get_doc({"doctype": "Report", "name": report_name, **values, "roles": roles})
		doc.insert(ignore_permissions=True)
