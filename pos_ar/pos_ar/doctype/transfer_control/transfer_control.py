"""Manager-defined restrictions shared by Material Requests and Stock Entries."""

from collections import defaultdict
from decimal import Decimal, InvalidOperation
from html import escape

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_link_to_form

CONTROL = "Transfer Control"
RULE = "Transfer Control Rule"
BLOCK = "Block Transfer"
LIMIT = "Limit Quantity"
BOTH = "Both"
DOCUMENT_SCOPES = {"Material Request": "Material Request", "Stock Entry": "Stock Entry"}
SIGNS = ("+", "-", BOTH)


class TransferControl(Document):
    def validate(self):
        validate_configuration(self)


def number(value, label):
    try:
        result = Decimal(str(0 if value in (None, "") else value))
        if result.is_finite():
            return result
    except (InvalidOperation, ValueError, TypeError):
        pass
    frappe.throw(_("{0}: enter a valid numeric value.").format(escape(label)))


def validate_configuration(doc):
    if doc.document_type not in (*DOCUMENT_SCOPES.values(), BOTH):
        frappe.throw(_("Select Material Request, Stock Entry or Both."))
    if not doc.company:
        frappe.throw(_("Select the company before selecting warehouses."))
    if not doc.source_warehouse or not doc.target_warehouse:
        frappe.throw(_("Select the source warehouse and target warehouse."))
    if doc.source_warehouse == doc.target_warehouse:
        frappe.throw(_("The source and target warehouses must be different."))
    for name in (doc.source_warehouse, doc.target_warehouse):
        warehouse = frappe.db.get_value("Warehouse", name, ["company", "disabled", "is_group"], as_dict=True)
        if not warehouse or warehouse.company != doc.company:
            frappe.throw(_("Warehouse {0} must belong to company {1}.").format(escape(name), escape(doc.company)))
        if cint(doc.is_active) and (warehouse.disabled or warehouse.is_group):
            frappe.throw(_("Warehouse {0} must be active and must not be a group.").format(escape(name)))
    if not doc.get("rules"):
        frappe.throw(_("Add at least one item group rule."))
    for index, rule in enumerate(doc.rules, 1):
        label = _("Row {0}").format(index)
        if not rule.item_group:
            frappe.throw(_("{0}: select an item group.").format(label))
        for axis in ("sph", "cyl"):
            if rule.get(f"{axis}_sign") not in SIGNS:
                frappe.throw(_("{0}: select a valid {1} sign.").format(label, axis.upper()))
            low = number(rule.get(f"{axis}_min"), _("{0} / Minimum {1}").format(label, axis.upper()))
            high = number(rule.get(f"{axis}_max"), _("{0} / Maximum {1}").format(label, axis.upper()))
            exclusive = cint(rule.get(f"{axis}_max_exclusive"))
            if low < 0 or high < low or (exclusive and high == low):
                frappe.throw(_("{0}: the {1} range must be non-negative, ordered and non-empty.").format(label, axis.upper()))
        if rule.decision not in (BLOCK, LIMIT):
            frappe.throw(_("{0}: select a valid decision.").format(label))
        if rule.decision == LIMIT:
            if number(rule.max_qty, _("{0} / Maximum Quantity").format(label)) <= 0:
                frappe.throw(_("{0}: the maximum quantity must be greater than zero.").format(label))
        else:
            rule.max_qty = 0
        rule.summary = rule_summary(rule)


def rule_summary(rule):
    """Store English summaries; the form renders them in the user's language."""
    parts = []
    for axis in ("sph", "cyl"):
        sign = "±" if rule.get(f"{axis}_sign") == BOTH else rule.get(f"{axis}_sign")
        low = number(rule.get(f"{axis}_min"), axis)
        high = number(rule.get(f"{axis}_max"), axis)
        if low == high:
            power_range = f"{low:.2f} only"
        else:
            end = "maximum excluded" if cint(rule.get(f"{axis}_max_exclusive")) else "maximum included"
            power_range = f"{low:.2f} to {high:.2f}, {end}"
        parts.append(f"{axis.upper()} {sign}: {power_range}")
    text = " / ".join(parts)
    if rule.decision == LIMIT:
        text += f" · Max. {number(rule.max_qty, 'Maximum Quantity'):g}"
    return text


def matches_power(value, rule, axis):
    sign = rule.get(f"{axis}_sign")
    if value != 0 and sign != BOTH and ((value > 0) != (sign == "+")):
        return False
    magnitude = abs(value)
    low = number(rule.get(f"{axis}_min"), axis)
    high = number(rule.get(f"{axis}_max"), axis)
    return magnitude >= low and (magnitude < high if cint(rule.get(f"{axis}_max_exclusive")) else magnitude <= high)


def matches_group(item_group, rule, groups):
    if item_group == rule.item_group:
        return True
    root, group = groups.get(rule.item_group), groups.get(item_group)
    return bool(root and group and root.lft <= group.lft and group.rgt <= root.rgt)


def item_power(item, axis):
    magnitude = abs(number(item.get(f"custom_{axis}"), _("Item {0} / {1}").format(item.name, axis.upper())))
    # Existing item data stores CYL's sign in custom_cly_sign (historical spelling).
    sign = item.get("custom_sph_sign" if axis == "sph" else "custom_cly_sign") or "+"
    if sign not in ("+", "-"):
        frappe.throw(_("Item {0}: the {1} sign must be + or -.").format(escape(item.name), axis.upper()))
    value = magnitude.quantize(Decimal("0.01"))
    return value if sign == "+" else -value


def row_route(doc, row):
    if doc.doctype == "Material Request":
        return (row.get("from_warehouse") or doc.get("set_from_warehouse") or doc.get("from_warehouse"),
                row.get("warehouse") or doc.get("set_warehouse"))
    return (row.get("s_warehouse") or doc.get("from_warehouse"),
            row.get("t_warehouse") or doc.get("to_warehouse"))


def row_stock_qty(row):
    qty = number(row.get("qty"), _("Quantity"))
    raw_factor = row.get("conversion_factor")
    factor = number(1 if raw_factor in (None, "") else raw_factor, _("Conversion Factor"))
    if qty < 0 or factor <= 0:
        frappe.throw(_("Transfer quantities must be non-negative and the conversion factor must be greater than zero."))
    return qty * factor


def validate_transfer(doc, method=None):
    scope = DOCUMENT_SCOPES.get(doc.doctype)
    if not scope:
        return
    purpose = doc.get("material_request_type") if doc.doctype == "Material Request" else doc.get("purpose")
    if purpose != "Material Transfer":
        return
    controls = frappe.get_all(CONTROL, filters={"is_active": 1, "company": doc.company,
        "document_type": ["in", [scope, BOTH]]}, pluck="name")
    if not controls:
        return
    route_rules = defaultdict(list)
    for name in controls:
        control = frappe.get_doc(CONTROL, name)
        for rule in control.rules:
            if cint(rule.is_active):
                route_rules[(control.source_warehouse, control.target_warehouse)].append((control.name, rule))
    quantities = defaultdict(Decimal)
    for row in doc.get("items") or []:
        route = row_route(doc, row)
        if row.get("item_code") and route in route_rules:
            quantities[(row.item_code, *route)] += row_stock_qty(row)
    if not quantities:
        return
    groups = {group.name: group for group in frappe.get_all("Item Group", fields=["name", "lft", "rgt"])}
    items = {item.name: item for item in frappe.get_all("Item", filters={"name": ["in", sorted({k[0] for k in quantities})]},
        fields=["name", "item_group", "stock_uom", "custom_sph", "custom_cyl", "custom_sph_sign", "custom_cly_sign"])}
    for (code, source, target), qty in quantities.items():
        item = items.get(code)
        if not item:
            frappe.throw(_("Item not found: {0}.").format(escape(code)))
        candidates = [(name, rule) for name, rule in route_rules[(source, target)] if matches_group(item.item_group, rule, groups)]
        if not candidates:
            continue
        sph, cyl = item_power(item, "sph"), item_power(item, "cyl")
        matches = [(name, rule) for name, rule in candidates if matches_power(sph, rule, "sph") and matches_power(cyl, rule, "cyl")]
        if not matches:
            continue
        blocked = next(((name, rule) for name, rule in matches if rule.decision == BLOCK), None)
        if blocked:
            name, rule = blocked
            frappe.throw(_("Transfer prohibited: item {0} (SPH {1} / CYL {2}) cannot be transferred from {3} to {4}. Configuration: {5}, rule {6}.").format(
                escape(code), f"{sph:g}", f"{cyl:g}", escape(source), escape(target), get_link_to_form(CONTROL, name), rule.idx))
        limits = [(number(rule.max_qty, _("Maximum Quantity")), name, rule) for name, rule in matches if rule.decision == LIMIT]
        if limits:
            maximum, name, rule = min(limits, key=lambda limit: limit[0])
            if qty > maximum:
                frappe.throw(_("Transfer limited: item {0} (SPH {1} / CYL {2}) is limited to {3} {4} from {5} to {6}. Total requested quantity: {7}. Configuration: {8}, rule {9}.").format(
                    escape(code), f"{sph:g}", f"{cyl:g}", f"{maximum:g}", escape(item.stock_uom or ""), escape(source), escape(target),
                    f"{qty:g}", get_link_to_form(CONTROL, name), rule.idx))


@frappe.whitelist()
def get_group_power_info(item_group, rule=None):
    """Read-only catalog guidance; it never changes the manager's power ranges."""
    frappe.has_permission(CONTROL, "read", throw=True)
    group = frappe.get_doc("Item Group", item_group)
    group.check_permission("read")
    groups = frappe.get_all("Item Group", filters={"lft": [">=", group.lft], "rgt": ["<=", group.rgt]}, pluck="name")
    items = frappe.get_list("Item", filters={"item_group": ["in", groups], "disabled": 0},
        fields=["name", "custom_sph", "custom_cyl", "custom_sph_sign", "custom_cly_sign"], limit_page_length=0)
    values = [(item_power(item, "sph"), item_power(item, "cyl")) for item in items]
    result = dict(total=len(items))
    for axis, index in (("sph", 0), ("cyl", 1)):
        magnitudes = [abs(pair[index]) for pair in values]
        result[f"{axis}_min"] = float(min(magnitudes)) if magnitudes else None
        result[f"{axis}_max"] = float(max(magnitudes)) if magnitudes else None
    selected = frappe._dict(frappe.parse_json(rule)) if rule else None
    if selected:
        for axis in ("sph", "cyl"):
            if selected.get(f"{axis}_sign") not in SIGNS:
                frappe.throw(_("Select the SPH and CYL signs to check the range."))
        result["matching_count"] = sum(matches_power(sph, selected, "sph") and matches_power(cyl, selected, "cyl") for sph, cyl in values)
    return result


def migrate_legacy_doctypes():
    """Rename legacy DocTypes and normalize stored choices before model synchronization."""
    from frappe.model.rename_doc import rename_doc

    legacy_names = (("Regle de Transfert", RULE), ("Parametrage des Transferts", CONTROL))
    for old, new in legacy_names:
        if frappe.db.exists("DocType", old) and frappe.db.exists("DocType", new):
            frappe.throw(_("Cannot rename {0}: {1} already exists.").format(old, new))
    for old, new in legacy_names:
        if frappe.db.exists("DocType", old):
            rename_doc("DocType", old, new, force=True, ignore_permissions=True,
                show_alert=False, rebuild_search=False)
    choices = {
        CONTROL: {"document_type": {"Demande de matériel": "Material Request", "Les deux": BOTH}},
        RULE: {"sph_sign": {"Les deux": BOTH}, "cyl_sign": {"Les deux": BOTH},
               "decision": {"Transfert interdit": BLOCK, "Quantité limitée": LIMIT}},
    }
    for doctype, fields in choices.items():
        if not frappe.db.exists("DocType", doctype):
            continue
        for fieldname, replacements in fields.items():
            for old, new in replacements.items():
                frappe.db.set_value(doctype, {fieldname: old}, fieldname, new, update_modified=False)
    if frappe.db.exists("DocType", RULE):
        for rule in frappe.get_all(RULE, fields=["*"]):
            frappe.db.set_value(RULE, rule.name, "summary", rule_summary(rule), update_modified=False)
