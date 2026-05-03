# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document



class CheckingTheInvoice(Document):


    def before_save(self):
        """Calcul automatique des totaux et écarts"""
        for item in self.items:
            item.total = (
                (item.qte_1 or 0) +
                (item.qte_2 or 0) +
                (item.qte_3 or 0) +
                (item.qte_4 or 0)
            )
            item.ecart = item.total - (item.qte_facturee or 0)
    def onload(self):
     if self.workflow_state == "Pending":
        has_ecart = any((item.ecart or 0) != 0 for item in self.items)
        
        if not has_ecart:
            try:
                doc = frappe.get_doc("Checking The Invoice", self.name)
                frappe.model.workflow.apply_workflow(doc, "Approve")
                frappe.db.commit()
                frappe.msgprint("✅ Aucun écart détecté. Approbation automatique.", indicator="green", alert=True)
                self.workflow_state = "Approved"
            except Exception as e:
                frappe.log_error(str(e), "Auto Approve Failed - onload")
            

    def on_submit(self):
        """Création des documents d'ajustement côté vendeur uniquement"""
        
        invoice = frappe.get_doc("Purchase Invoice", self.purchase_invoice)

        print(" the status ====> " , self.workflow_state)

        if self.workflow_state == "Rejected":
            frappe.msgprint("❌ Cet ajustement a été rejeté.")
            return
        
        # Séparer les retours et suppléments
        retours     = []
        supplements = [] 

        for item in self.items:
            if item.ecart < 0:
                retours.append(item)
            elif item.ecart > 0:
                supplements.append(item)

        # ============================================
        # CÔTÉ VENDEUR (création Sales Invoices en draft)
        # Les Purchase Invoices seront créées automatiquement par ERPNext
        # lors de la validation des Sales Invoices
        # ============================================
        self.create_vendor_side_documents(invoice, retours, supplements)
        
        self.db_update()
        


    # =========================================
    # FONCTIONS CÔTÉ VENDEUR
    # =========================================
    
    def create_vendor_side_documents(self, purchase_invoice, retours, supplements):
        """
        Crée les documents miroir côté vendeur si transaction inter-compagnie
        Les Purchase Invoices correspondantes seront créées automatiquement
        par ERPNext lors de la validation de ces Sales Invoices
        """
        
        # 1. Vérifier si le fournisseur est interne
        supplier_data = frappe.db.get_value(
            "Supplier",
            {"name": purchase_invoice.supplier},
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
        
        # 4. Créer les documents côté vendeur (en draft)
        if retours:
            vendor_credit = self.create_vendor_credit_note(
                sales_inv, 
                retours, 
                internal_customer,
                supplier_company
            )
            self.db_set("supplier_return", vendor_credit.name)
        
        if supplements:
            vendor_invoice = self.create_vendor_sales_invoice(
                sales_inv,
                supplements,
                internal_customer,
                supplier_company
            )
            self.db_set("supplier_invoice", vendor_invoice.name)





    def find_original_sales_invoice(self, purchase_invoice):
        """
        Trouve la Sales Invoice d'origine liée à cette Purchase Invoice
        """
        # Méthode 1 : Via le champ bill_no
        si_name = purchase_invoice.bill_no
        if si_name and frappe.db.exists("Sales Invoice", si_name):
            return si_name

        return None



    def create_vendor_credit_note(self, original_si, items, customer, company):
        """
        Crée un avoir de vente (Sales Invoice Return) côté vendeur EN BROUILLON
        """
        print("================> we are hereeeeeeeeeeeeeeeee!!!!")
        credit = frappe.new_doc("Sales Invoice")
        credit.customer = customer
        credit.company = company
        credit.posting_date = self.date
        credit.is_return = 1
        credit.price_list = original_si.selling_price_list
        credit.return_against = original_si.name
        credit.update_stock = 1
        credit.custom_checking_status = "Checked"
        credit.update_outstanding_for_self = 0
        credit.custom_checking_invoice_peice = self.name
        
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

        
        # Set missing values (like currency, income accounts, etc.)
        credit.set_missing_values()
        # Calculate taxes and totals so grand_total is not None
        credit.calculate_taxes_and_totals()

        credit.flags.ignore_permissions = True
        credit.insert()
        credit.submit()
        
        frappe.msgprint(
            f"✅ Avoir de vente créé en brouillon : {credit.name}<br>"
            f"💡 La Purchase Invoice Return sera créée automatiquement lors de la validation",
            indicator="blue"
        )
        return credit


    def create_vendor_sales_invoice(self, original_si, items, customer, company):
        """
        Crée une facture de vente supplémentaire côté vendeur EN BROUILLON
        
        """
        
        inv = frappe.new_doc("Sales Invoice")
        inv.customer = customer
        inv.company = company
        inv.posting_date = self.date
        inv.price_list = original_si.selling_price_list
        inv.update_stock = 1
        inv.custom_checking_invoice_peice = self.name
        inv.custom_checking_status = "Checked"
        
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
        
        # Set missing values (like currency, income accounts, etc.)
        inv.set_missing_values()
        # Calculate taxes and totals so grand_total is not None
        inv.calculate_taxes_and_totals()

        inv.flags.ignore_permissions = True
        inv.insert()
        inv.submit()
        
        frappe.msgprint(
            f"✅ Facture de vente créée en brouillon : {inv.name}<br>"
            f"💡 La Purchase Invoice sera créée automatiquement lors de la validation",
            indicator="blue"
        )
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
    
    def get_original_si_item(self, sales_invoice, item_code):
        """Trouve l'article dans la Sales Invoice"""
        for item in sales_invoice.items:
            if item.item_code == item_code:
                return item
        return None



@frappe.whitelist()
def show_action_btn(purchase_invoice_name , status):
    user = frappe.session.user

    # Admin always allowed
    if user == "Administrator":
        return True

    if status == "Draft":
        return True

    companies = frappe.get_all(
        "User Permission",
        filters={
            "user": user,
            "allow": "Company",
            "apply_to_all_doctypes" : 1
        },
        pluck="for_value"
    )

    companies_specific = frappe.get_all(
        "User Permission",
        filters={
            "user": user,
            "allow": "Company",
            "apply_to_all_doctypes" : 0,
            "applicable_for" : "Checking The Invoice"
        },
        pluck="for_value"
    )

    purchase_invoice = frappe.get_doc("Purchase Invoice", purchase_invoice_name)

    supplier = purchase_invoice.supplier
    supplier_company = frappe.db.get_value("Supplier", supplier, "represents_company")

    if supplier_company in companies or supplier_company in companies_specific:
        return True
    else:
        return False
    


    

