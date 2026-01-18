import frappe
from frappe.model.document import Document

class ReceiveChecking(Document):

    def before_save(self):
        """Calcul automatique des totaux et écarts"""
        for item in self.articles:
            item.total = (
                (item.qte_1 or 0) +
                (item.qte_2 or 0) +
                (item.qte_3 or 0) +
                (item.qte_4 or 0)
            )
            item.ecart = item.total - (item.qte_facturee or 0)

    def on_submit(self):
        """Création des documents d'ajustement côté acheteur ET vendeur"""
        
        invoice = frappe.get_doc("Purchase Invoice", self.facture_achat)
        
        # Séparer les retours et suppléments
        retours = []
        supplements = []

        for item in self.articles:
            if item.ecart < 0:
                retours.append(item)
            elif item.ecart > 0:
                supplements.append(item)

        # ============================================
        # CÔTÉ ACHETEUR (logique existante)
        # ============================================
        if retours:
            credit = self.create_credit_note(invoice, retours)
            self.avoir_cree = credit.name

        if supplements:
            new_inv = self.create_supplier_invoice(invoice, supplements)
            self.facture_supplementaire_creee = new_inv.name

        # ============================================
        # CÔTÉ VENDEUR (miroir inter-compagnie)
        # ============================================
        self.create_vendor_side_documents(invoice, retours, supplements)
        
        self.db_update()
        


    def on_cancel(self):
     """
     Annule tous les documents créés automatiquement
     lors du on_submit de l'Ajustement Quantitee
      """

     frappe.msgprint("🔄 Annulation des documents liés à l'ajustement...")

     documents = [
        ("Purchase Invoice", self.avoir_cree),
        ("Purchase Invoice", self.facture_supplementaire_creee),
        ("Sales Invoice", self.avoir_vendeur_cree),
        ("Sales Invoice", self.facture_vendeur_creee),
     ]

     for doctype, name in documents:
        if not name:
            continue

        if not frappe.db.exists(doctype, name):
            continue

        doc = frappe.get_doc(doctype, name)

        if doc.docstatus == 1:
            doc.flags.ignore_permissions = True
            doc.cancel()
            frappe.msgprint(f"❌ {doctype} annulée : {name}")

     # Nettoyer les champs après annulation
     self.db_set("avoir_cree", None)
     self.db_set("facture_supplementaire_creee", None)
     self.db_set("avoir_vendeur_cree", None)
     self.db_set("facture_vendeur_creee", None)
		

    # =========================================
    # FONCTIONS CÔTÉ ACHETEUR
    # =========================================
    
    def create_credit_note(self, original_invoice, items):
        """Crée un avoir d'achat (Purchase Invoice Return)"""
        
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

        credit.flags.ignore_permissions = True
        credit.insert()
        credit.submit()
        
        frappe.msgprint(f"✅ Avoir d'achat créé : {credit.name}")
        return credit

    def create_supplier_invoice(self, original_invoice, items):
        """Crée une facture d'achat supplémentaire"""
        
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
                "qty": item.ecart,
                "rate": orig.rate,
                "warehouse": orig.warehouse
            })

        inv.flags.ignore_permissions = True
        inv.insert()
        inv.submit()
        
        frappe.msgprint(f"✅ Facture d'achat supplémentaire créée : {inv.name}")
        return inv

    # =========================================
    # FONCTIONS CÔTÉ VENDEUR (CORRIGÉ)
    # =========================================
    
    def create_vendor_side_documents(self, purchase_invoice, retours, supplements):
        """
        Crée les documents miroir côté vendeur si transaction inter-compagnie
        """
        
        # 1. Vérifier si le fournisseur est interne
        # CORRECTION : Utiliser filters au lieu de passer directement le nom
        supplier_data = frappe.db.get_value(
            "Supplier",
            {"name": purchase_invoice.supplier},  # ← CORRECTION ICI
            ["represents_company", "is_internal_supplier"],
            as_dict=True
        )
        
        if not supplier_data or not supplier_data.get("is_internal_supplier"):
            frappe.msgprint("ℹ️ Fournisseur externe : pas de document miroir côté vendeur.")
            return
        
        supplier_company = supplier_data.get("represents_company")
        
        if not supplier_company:
            frappe.msgprint("ℹ️ Le fournisseur n'a pas de 'represents_company' défini.")
            return
        
        frappe.msgprint(f"🔄 Transaction inter-compagnie détectée avec {supplier_company}")
        
        # 2. Trouver la Sales Invoice d'origine
        original_sales_invoice = self.find_original_sales_invoice(purchase_invoice)
        
        if not original_sales_invoice:
            frappe.msgprint("⚠️ Sales Invoice d'origine introuvable. Documents vendeur non créés.")
            return
        
        sales_inv = frappe.get_doc("Sales Invoice", original_sales_invoice)
        
        # 3. Trouver le client interne
        internal_customer = self.find_internal_customer(
            supplier_company, 
            purchase_invoice.company
        )
        
        if not internal_customer:
            frappe.msgprint(
                f"⚠️ Aucun client interne trouvé dans {supplier_company} "
                f"pour {purchase_invoice.company}. Crée-le d'abord."
            )
            return
        
        # 4. Créer les documents côté vendeur
        if retours:
            vendor_credit = self.create_vendor_credit_note(
                sales_inv, 
                retours, 
                internal_customer,
                supplier_company
            )
            self.db_set("avoir_vendeur_cree", vendor_credit.name)
        
        if supplements:
            vendor_invoice = self.create_vendor_sales_invoice(
                sales_inv,
                supplements,
                internal_customer,
                supplier_company
            )
            self.db_set("facture_vendeur_creee", vendor_invoice.name)

    def find_original_sales_invoice(self, purchase_invoice):
        """
        Trouve la Sales Invoice d'origine liée à cette Purchase Invoice
        """
        
        # Méthode 1 : Via le champ bill_no
        si_name = purchase_invoice.bill_no
        
        if si_name and frappe.db.exists("Sales Invoice", si_name):
            return si_name
        
        # Méthode 2 : Via champ custom linked_sales_invoice
        if hasattr(purchase_invoice, 'linked_sales_invoice') and purchase_invoice.linked_sales_invoice:
            return purchase_invoice.linked_sales_invoice
        
        # Méthode 3 : Recherche dans Purchase Invoice avec filtre
        linked_si = frappe.db.get_value(
            "Purchase Invoice",
            {"name": purchase_invoice.name},
            "bill_no"
        )
        
        if linked_si and frappe.db.exists("Sales Invoice", linked_si):
            return linked_si
        
        return None

    def create_vendor_credit_note(self, original_si, items, customer, company):
        """
        Crée un avoir de vente (Sales Invoice Return) côté vendeur
        """
        
        credit = frappe.new_doc("Sales Invoice")
        credit.customer = customer
        credit.company = company
        credit.posting_date = self.date
        credit.is_return = 1
        credit.return_against = original_si.name
        credit.update_stock = 1
        credit.update_outstanding_for_self = 0
        
        # Entrepôt par défaut du vendeur
        vendor_warehouse = frappe.db.get_value(
            "Company", 
            company, 
            "custom_default_warehouse"
        )

        for item in items:
            orig = self.get_original_si_item(original_si, item.article)
            if not orig:
                continue

            credit.append("items", {
                "item_code": item.article,
                "qty": item.ecart,
                "rate": orig.rate,
                "warehouse": vendor_warehouse or orig.warehouse
            })

        credit.flags.ignore_permissions = True
        credit.insert()
        credit.submit()
        
        frappe.msgprint(f"✅ Avoir de vente créé côté vendeur : {credit.name}", indicator="green")
        return credit

    def create_vendor_sales_invoice(self, original_si, items, customer, company):
        """
        Crée une facture de vente supplémentaire côté vendeur
        """
        
        inv = frappe.new_doc("Sales Invoice")
        inv.customer = customer
        inv.company = company
        inv.posting_date = self.date
        inv.update_stock = 1
        
        vendor_warehouse = frappe.db.get_value(
            "Company", 
            company, 
            "custom_default_warehouse"
        )

        for item in items:
            orig = self.get_original_si_item(original_si, item.article)
            if not orig:
                continue

            inv.append("items", {
                "item_code": item.article,
                "qty": item.ecart,
                "rate": orig.rate,
                "warehouse": vendor_warehouse or orig.warehouse
            })

        inv.flags.ignore_permissions = True
        inv.insert()
        inv.submit()
        
        frappe.msgprint(f"✅ Facture de vente créée côté vendeur : {inv.name}", indicator="green")
        return inv

    # =========================================
    # FONCTIONS UTILITAIRES
    # =========================================
    
    def find_internal_customer(self, vendor_company, buyer_company):
        """
        Trouve le client interne dans vendor_company qui représente buyer_company
        """
        
        customer = frappe.db.get_value(
            "Customer",
            {
                "represents_company": buyer_company,
                "is_internal_customer": 1
            },
            "name"
        )
        
        return customer

    def get_original_item(self, invoice, item_code):
        """Trouve l'article dans la Purchase Invoice"""
        for item in invoice.items:
            if item.item_code == item_code:
                return item
        return None
    
    def get_original_si_item(self, sales_invoice, item_code):
        """Trouve l'article dans la Sales Invoice"""
        for item in sales_invoice.items:
            if item.item_code == item_code:
                return item
        return None