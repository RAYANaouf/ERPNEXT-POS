import frappe
from frappe import _
from frappe.model.document import Document


class AjustementQuantite(Document):

    def before_save(self):
       
        for item in self.articles:
            item.total = (
                (item.qte_1 or 0) +
                (item.qte_2 or 0) +
                (item.qte_3 or 0) +
                (item.qte_4 or 0)
            )

            item.ecart = item.total - (item.qte_facturee or 0)


    def on_submit(self):
     
        try:
            invoice = frappe.get_doc("Sales Invoice", self.facture_de_vente)

            retours = []
            supplements = []

            for item in self.articles:
                if item.ecart < 0:
                    retours.append(item)
                elif item.ecart > 0:
                    supplements.append(item)

            if retours:
                credit_note = self.create_credit_note(invoice, retours)
                frappe.msgprint(
                    _("Note de crédit créée : {0}").format(credit_note.name),
                    alert=True
                )

            if supplements:
                new_invoice = self.create_new_invoice(invoice, supplements)
                frappe.msgprint(
                    _("Facture supplémentaire créée : {0}").format(new_invoice.name),
                    alert=True
                )


        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                "Erreur Ajustement Quantité"
            )
            frappe.throw(_("Erreur lors du traitement de l’ajustement"))


    # -------------------------
    # NOTE DE CRÉDIT (RETOUR)
    # -------------------------
    def create_credit_note(self, original_invoice, items):
        credit = frappe.new_doc("Sales Invoice")
        credit.customer = original_invoice.customer
        credit.company = original_invoice.company
        credit.posting_date = self.date
        credit.is_return = 1
        credit.return_against = original_invoice.name
        credit.update_stock = 0
        credit.set_posting_time = 1

        for item in items:
            orig = self.get_original_item(original_invoice, item.article)
            if not orig:
                continue

            
            credit.append("items", {
                "item_code": item.article,
                "qty": item.ecart,
                "rate": orig.rate,
                "warehouse": orig.warehouse
            })

        credit.insert(ignore_permissions=True)
        credit.submit()
        return credit


    # -------------------------
    # FACTURE SUPPLÉMENTAIRE
    # -------------------------
    def create_new_invoice(self, original_invoice, items):
        new_inv = frappe.new_doc("Sales Invoice")
        new_inv.customer = original_invoice.customer
        new_inv.company = original_invoice.company
        new_inv.posting_date = self.date
        new_inv.set_posting_time = 1

        for item in items:
            orig = self.get_original_item(original_invoice, item.article)
            if not orig:
                continue

            new_inv.append("items", {
                "item_code": item.article,
                "qty": item.ecart,
                "rate": orig.rate,
                "warehouse": orig.warehouse
            })

        new_inv.insert(ignore_permissions=True)
        new_inv.submit()
        return new_inv


    def get_original_item(self, invoice, item_code):
        for item in invoice.items:
            if item.item_code == item_code:
                return item
        return None
