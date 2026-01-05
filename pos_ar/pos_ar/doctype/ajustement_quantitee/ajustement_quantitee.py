import frappe
from frappe.model.document import Document

class AjustementQuantitee(Document):

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
        invoice = frappe.get_doc("Purchase Invoice", self.facture_achat)
       

        retours = []
        supplements = []

        for item in self.articles:
            if item.ecart < 0:
                retours.append(item)
            elif item.ecart > 0:
                supplements.append(item)

        if retours:
            credit = self.create_credit_note(invoice, retours)
            self.avoir_cree = credit.name

        if supplements:
            new_inv = self.create_supplier_invoice(invoice, supplements)
            self.facture_supplementaire_creee = new_inv.name

        self.db_update()
      
    # -------------------------
    # AVOIR FOURNISSEUR
    # -------------------------
    def create_credit_note(self, original_invoice, items):
        credit = frappe.new_doc("Purchase Invoice")
        credit.supplier = original_invoice.supplier
        credit.company = original_invoice.company
        credit.posting_date = self.date
        credit.is_return = 1
        credit.return_against = original_invoice.name
        credit.update_stock = 1

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
    def create_supplier_invoice(self, original_invoice, items):
        inv = frappe.new_doc("Purchase Invoice")
        inv.supplier = original_invoice.supplier
        inv.company = original_invoice.company
        inv.posting_date = self.date
        inv.update_stock = 1

        for item in items:
            orig = self.get_original_item(original_invoice, item.article)
            if not orig:
                continue

            inv.append("items", {
                "item_code": item.article,
                "qty":item.ecart,
                "rate": orig.rate,
                "warehouse": orig.warehouse
            })

        inv.insert(ignore_permissions=True)
        inv.submit()
        return inv

    def get_original_item(self, invoice, item_code):
        for item in invoice.items:
            if item.item_code == item_code:
                return item
        return None
