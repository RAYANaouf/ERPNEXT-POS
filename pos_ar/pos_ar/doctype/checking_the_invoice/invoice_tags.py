"""Native Purchase Invoice tags derived from Checking The Invoice's workflow.

Only tag metadata is written. Invoice saving/submission and checking workflow
actions are deliberately never called by this module.
"""

import frappe


INVOICE_DOCTYPE = "Purchase Invoice"
CHECKING_DOCTYPE = "Checking The Invoice"
NOT_CHECKED = "⚪ Non contrôlée"
IN_PROGRESS = "🟡 Contrôle en cours"
APPROVED = "🟢 Contrôle approuvé"
PARTIALLY_APPROVED = "🟠 Contrôle partiellement approuvé"
REJECTED = "🔴 Contrôle rejeté"
CANCELED = "⚪ Contrôle annulé"
MANAGED_TAGS = (NOT_CHECKED, IN_PROGRESS, APPROVED, PARTIALLY_APPROVED, REJECTED, CANCELED)


def tag_for_checking(checking):
    """A submitted document alone does not imply approval."""
    if not checking:
        return NOT_CHECKED
    docstatus = int(checking.get("docstatus") or 0)
    state = checking.get("workflow_state")
    if docstatus == 2:
        return CANCELED
    if docstatus == 1:
        return {
            "Approved": APPROVED,
            "Partially Approved": PARTIALLY_APPROVED,
            "Rejected": REJECTED,
        }.get(state, IN_PROGRESS)
    return IN_PROGRESS


def merge_status_tag(current_tags, wanted_tag):
    """Keep unrelated labels and replace only labels owned by this module."""
    if wanted_tag not in MANAGED_TAGS:
        raise ValueError("Unknown checking tag")
    existing = [tag.strip() for tag in (current_tags or "").split(",") if tag.strip()]
    retained = list(dict.fromkeys(tag for tag in existing if tag not in MANAGED_TAGS))
    return "," + ",".join([*retained, wanted_tag])


def ensure_tag_masters():
    for tag in MANAGED_TAGS:
        if not frappe.db.exists("Tag", tag):
            frappe.get_doc({"doctype": "Tag", "name": tag}).insert(
                ignore_permissions=True, ignore_if_duplicate=True
            )


def get_checking(invoice_name, excluded_checking=None):
    filters = {"purchase_invoice": invoice_name}
    if excluded_checking:
        filters["name"] = ["!=", excluded_checking]
    records = frappe.get_all(
        CHECKING_DOCTYPE,
        filters=filters,
        fields=["name", "workflow_state", "docstatus"],
        order_by="modified desc, creation desc, name desc",
        limit_page_length=1,
    )
    return records[0] if records else None


def set_invoice_tag(invoice_name, wanted_tag):
    """Synchronize both native tag storage and Tag Link in the caller's transaction.

    The service runs only from server-side document hooks or a migration, not
    from a whitelisted API. Its privilege is limited to tag metadata on the
    invoice referenced by the authorized checking document.
    """
    if wanted_tag not in MANAGED_TAGS:
        raise ValueError("Unknown checking tag")
    invoices = frappe.db.sql(
        "SELECT name, title, _user_tags FROM `tabPurchase Invoice` WHERE name = %s FOR UPDATE",
        (invoice_name,),
        as_dict=True,
    )
    if not invoices:
        return {"exists": False, "changed": False, "tags": None}
    invoice = invoices[0]
    merged = merge_status_tag(invoice.get("_user_tags"), wanted_tag)
    changed = merged != (invoice.get("_user_tags") or "")
    if changed:
        frappe.db.set_value(INVOICE_DOCTYPE, invoice_name, "_user_tags", merged, update_modified=False)

    links = frappe.get_all(
        "Tag Link",
        filters={"document_type": INVOICE_DOCTYPE, "document_name": invoice_name, "tag": ["in", MANAGED_TAGS]},
        fields=["name", "tag"],
        order_by="creation asc, name asc",
    )
    has_wanted = False
    for link in links:
        if link.tag == wanted_tag and not has_wanted:
            has_wanted = True
        else:
            # Remove only obsolete/duplicate links for this module's six labels.
            frappe.db.delete("Tag Link", {"name": link.name})
            changed = True
    if not has_wanted:
        if not frappe.db.exists("Tag", wanted_tag):
            frappe.get_doc({"doctype": "Tag", "name": wanted_tag}).insert(
                ignore_permissions=True, ignore_if_duplicate=True
            )
        frappe.get_doc({
            "doctype": "Tag Link",
            "document_type": INVOICE_DOCTYPE,
            "document_name": invoice_name,
            "title": invoice.get("title") or invoice_name,
            "tag": wanted_tag,
        }).insert(ignore_permissions=True)
        changed = True
    return {"exists": True, "changed": changed, "tags": merged}


def sync_purchase_invoice_tag(doc, method=None):
    checking = get_checking(doc.name)
    result = set_invoice_tag(doc.name, tag_for_checking(checking))
    if result["exists"]:
        # Keep the document returned by insert/save consistent with the database.
        doc.set("_user_tags", result["tags"])


def sync_checking_invoice_tag(doc, method=None):
    invoice_name = doc.get("purchase_invoice")
    if not invoice_name:
        return
    excluded = doc.name if method == "on_trash" else None
    checking = get_checking(invoice_name, excluded_checking=excluded)
    set_invoice_tag(invoice_name, tag_for_checking(checking))
    previous = doc.get_doc_before_save()
    if previous and previous.get("purchase_invoice") != invoice_name:
        old_invoice = previous.get("purchase_invoice")
        if old_invoice:
            set_invoice_tag(old_invoice, tag_for_checking(get_checking(old_invoice)))


def backfill_invoice_tags(dry_run=False):
    """Backfill existing invoices; caller/migration owns commit and rollback."""
    dry_run = bool(dry_run)
    if not dry_run:
        ensure_tag_masters()
    checks = frappe.get_all(
        CHECKING_DOCTYPE,
        fields=["name", "purchase_invoice", "workflow_state", "docstatus"],
        order_by="modified desc, creation desc, name desc",
    )
    by_invoice = {}
    for checking in checks:
        by_invoice.setdefault(checking.purchase_invoice, checking)
    counts = {tag: 0 for tag in MANAGED_TAGS}
    changed = 0
    invoices = frappe.get_all(INVOICE_DOCTYPE, pluck="name", order_by="name asc")
    for invoice_name in invoices:
        wanted = tag_for_checking(by_invoice.get(invoice_name))
        counts[wanted] += 1
        if not dry_run:
            changed += int(set_invoice_tag(invoice_name, wanted)["changed"])
    return {"dry_run": dry_run, "invoices": len(invoices), "changed": changed, "counts": counts}
