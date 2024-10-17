(() => {
  // ../pos_ar/pos_ar/pos_ar/page/pos/posController.js
  pos_ar.PointOfSale.Controller = class {
    constructor(wrapper) {
      this.wrapper = $(wrapper).find(".layout-main-section");
      this.page = wrapper.page;
      this.customersList = [];
      this.itemGroupList = [];
      this.itemList = [];
      this.itemPrices = [];
      this.priceLists = [];
      let initPos = frappe.model.get_new_doc("POS Invoice");
      initPos.items = [];
      this.selectedItemMaps = /* @__PURE__ */ new Map();
      this.warehouseList = [];
      this.PosProfileList = [];
      this.binList = [];
      this.selectedItem = {};
      this.selectedField = {};
      this.selectedTab = { "tabName": "" };
      this.selectedPaymentMethod = { "methodName": "" };
      this.selectedCustomer = { "name": "", "customer_name": "" };
      this.selectedPosProfile = { "name": "" };
      this.selectedPriceList = { "name": "" };
      this.sales_taxes = [];
      this.sellInvoices = /* @__PURE__ */ new Map();
      this.POSOpeningEntry = {};
      this.invoiceData = { netTotal: 0, grandTotal: 0, paidAmount: 0, toChange: 0, discount: 0 };
      this.db = null;
      this.start_app();
    }
    async start_app() {
      this.db = new pos_ar.PointOfSale.pos_db();
      this.prepare_container();
      await this.prepare_app_defaults();
      await this.checkForPOSEntry();
      await this.prepare_components();
      this.setListeners();
      console.log("selectedItemMaps ::: ", this.selectedItemMaps);
    }
    async refreshApp() {
      console.log("refresh");
      this.$components_wrapper.text("");
      await this.checkForPOSEntry();
      await this.prepare_components();
      this.setListeners();
    }
    async prepare_app_defaults() {
      this.customersList = await this.fetchCustomers();
      this.itemGroupList = await this.fetchItemGroups();
      this.itemList = await this.fetchItems();
      this.itemPrices = await this.fetchItemPrice();
      this.priceLists = await this.fetchPriceList();
      this.warehouseList = await this.fetchWarehouseList();
      this.PosProfileList = await this.fetchPosProfileList();
      this.binList = await this.fetchBinList();
      this.sales_taxes_and_charges = await this.fetchSalesTaxesAndCharges();
      this.taxes_and_charges_template = await this.fetchSalesTaxesAndChargesTemplate();
      console.log("taxes and charges templates  => ", this.taxes_and_charges_template);
      console.log("taxes and charges            => ", this.sales_taxes_and_charges);
      console.log("debog check ==> ", this.sales_taxes);
      if (this.PosProfileList.length == 0) {
        frappe.set_route("Form", "POS Profile");
        return;
      }
      Object.assign(this.selectedPosProfile, this.PosProfileList[0]);
      console.log("selected pos profile 1 : ", this.selectedPosProfile);
      this.sales_taxes = this.getSalesTaxes();
      if (this.customersList.length > 0) {
        this.selectedCustomer = structuredClone(this.customersList[0]);
      } else {
        frappe.warn(
          "You dont have a customer",
          "please create a customer to continue",
          () => {
          },
          "Done",
          false
        );
      }
      if (this.priceLists.length > 0) {
        Object.assign(this.selectedPriceList, this.priceLists[0]);
      } else {
        frappe.warn(
          "You dont have a single price list",
          "please create a priceList to continue",
          () => {
          },
          "Done",
          false
        );
      }
      let new_pos_invoice = frappe.model.get_new_doc("POS Invoice");
      new_pos_invoice.customer = this.selectedCustomer.name;
      new_pos_invoice.pos_profile = this.selectedPosProfile.name;
      new_pos_invoice.items = [];
      new_pos_invoice.taxes_and_charges = this.selectedPosProfile.taxes_and_charges;
      new_pos_invoice.additional_discount_percentage = this.invoiceData.discount;
      new_pos_invoice.paid_amount = 0;
      new_pos_invoice.base_paid_amount = 0;
      new_pos_invoice.creation_time = frappe.datetime.now_datetime();
      new_pos_invoice.payments = [{ "mode_of_payment": "Cash", "amount": 0 }];
      new_pos_invoice.is_pos = 1;
      new_pos_invoice.update_stock = 1;
      new_pos_invoice.docstatus = 0;
      new_pos_invoice.status = "Draft";
      this.selectedItemMaps.set("C1", new_pos_invoice);
      this.selectedTab.tabName = `C1`;
    }
    prepare_container() {
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/selectorBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/itemDetailsCart.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/paymentMethodCart.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/customerBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/cartBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/historyCarts.css">');
      this.wrapper.append('<div id="MainContainer" class="rowBox"></div>');
      this.$components_wrapper = this.wrapper.find("#MainContainer");
    }
    prepare_components() {
      console.log("selected pos profile 2 : ", this.selectedPosProfile);
      this.set_right_and_left_sections();
      console.log("selected pos profile 3 : ", this.selectedPosProfile);
      this.init_item_selector();
      console.log("selected pos profile 4 : ", this.selectedPosProfile);
      this.init_customer_box();
      console.log("selected pos profile 5 : ", this.selectedPosProfile);
      this.init_selected_item();
      console.log("selected pos profile 6 : ", this.selectedPosProfile);
      this.init_item_details();
      console.log("selected pos profile 7 : ", this.selectedPosProfile);
      this.init_paymentCart();
      console.log("selected pos profile 8 : ", this.selectedPosProfile);
      this.init_historyCart();
      console.log("selected pos profile 9 : ", this.selectedPosProfile);
    }
    async checkForPOSEntry() {
      try {
        const r = await frappe.db.get_list("POS Opening Entry", {
          filters: {
            "pos_profile": this.selectedPosProfile.name,
            "status": "Open",
            "user": frappe.session.user
          },
          fields: ["name", "pos_profile", "period_start_date", "company"],
          limit: 1
        });
        if (r.length === 0) {
          this.create_opening_voucher();
          return false;
        }
        Object.assign(this.POSOpeningEntry, r[0]);
        console.log("==> ", this.POSOpeningEntry);
        return true;
      } catch (error) {
        console.error("error occured : ", error);
        frappe.throw("Error checking for POS Opening Entry.");
        return false;
      }
    }
    create_opening_voucher() {
      const me = this;
      const table_fields = [
        {
          fieldname: "mode_of_payment",
          fieldtype: "Link",
          in_list_view: 1,
          label: "Mode of Payment",
          options: "Mode of Payment",
          reqd: 1
        },
        {
          fieldname: "opening_amount",
          fieldtype: "Currency",
          in_list_view: 1,
          label: "Opening Amount",
          options: "company:company_currency",
          change: function() {
            dialog.fields_dict.balance_details.df.data.some((d) => {
              if (d.idx == this.doc.idx) {
                d.opening_amount = this.value;
                dialog.fields_dict.balance_details.grid.refresh();
                return true;
              }
            });
          }
        }
      ];
      const fetch_pos_payment_methods = () => {
        const pos_profile = dialog.fields_dict.pos_profile.get_value();
        if (!pos_profile)
          return;
        frappe.db.get_doc("POS Profile", pos_profile).then(({ payments }) => {
          dialog.fields_dict.balance_details.df.data = [];
          payments.forEach((pay) => {
            const { mode_of_payment } = pay;
            dialog.fields_dict.balance_details.df.data.push({ mode_of_payment, opening_amount: "0" });
          });
          dialog.fields_dict.balance_details.grid.refresh();
        });
      };
      const dialog = new frappe.ui.Dialog({
        title: __("Create POS Opening Entry"),
        static: true,
        fields: [
          {
            fieldtype: "Link",
            label: __("Company"),
            default: frappe.defaults.get_default("company"),
            options: "Company",
            fieldname: "company",
            reqd: 1
          },
          {
            fieldtype: "Link",
            label: __("POS Profile"),
            options: "POS Profile",
            fieldname: "pos_profile",
            reqd: 1,
            get_query: () => pos_profile_query(),
            onchange: () => fetch_pos_payment_methods()
          },
          {
            fieldname: "balance_details",
            fieldtype: "Table",
            label: "Opening Balance Details",
            cannot_add_rows: false,
            in_place_edit: true,
            reqd: 1,
            data: [],
            fields: table_fields
          }
        ],
        primary_action: async function({ company, pos_profile, balance_details }) {
          if (!balance_details.length) {
            frappe.show_alert({
              message: __("Please add Mode of payments and opening balance details."),
              indicator: "red"
            });
            return frappe.utils.play_sound("error");
          }
          balance_details = balance_details.filter((d) => d.mode_of_payment);
          const method = "erpnext.selling.page.point_of_sale.point_of_sale.create_opening_voucher";
          const res = await frappe.call({
            method,
            args: { pos_profile, company, balance_details },
            freeze: true
          });
          !res.exc && me.prepare_app_defaults(res.message);
          Object.assign(me.POSOpeningEntry, { "name": res.message.name, "pos_profile": res.message.pos_profile, "period_start_date": res.message.period_start_date, "company": res.message.company });
          dialog.hide();
        },
        primary_action_label: __("Submit")
      });
      dialog.show();
      const pos_profile_query = () => {
        return {
          query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
          filters: { company: dialog.fields_dict.company.get_value() }
        };
      };
    }
    set_right_and_left_sections() {
      this.$components_wrapper.append('<div id="LeftSection" class="columnBox"></div>');
      this.$components_wrapper.append('<div id="RightSection" class="columnBox"></div>');
      this.$rightSection = this.$components_wrapper.find("#RightSection");
      this.$leftSection = this.$components_wrapper.find("#LeftSection");
    }
    init_item_selector() {
      console.log("item list from controller : ", this.itemList);
      this.item_selector = new pos_ar.PointOfSale.pos_item_selector(
        this.$leftSection,
        this.itemList,
        this.itemGroupList,
        this.itemPrices,
        (item) => {
          this.itemClick_selector(item);
        }
      );
    }
    init_customer_box() {
      this.customer_box = new pos_ar.PointOfSale.pos_customer_box(
        this.$rightSection,
        this.customersList,
        this.selectedCustomer,
        this.backHome.bind(this),
        this.onSync.bind(this),
        this.onClosePOS.bind(this),
        this.onHistoryClick.bind(this)
      );
    }
    init_selected_item() {
      this.selected_item_cart = new pos_ar.PointOfSale.pos_selected_item_cart(
        this.$rightSection,
        this.selectedItemMaps,
        this.sales_taxes,
        this.invoiceData,
        this.selectedTab,
        this.selectedItem,
        this.selectedField,
        (item) => {
          this.onSelectedItemClick(item);
        },
        (tab) => {
          this.onClose_details();
        },
        (action, key) => {
          this.onKeyPressed(action, key);
        },
        this.createNewTab.bind(this),
        this.onCheckout.bind(this)
      );
    }
    init_item_details() {
      console.log("warehouse ==> ", this.selectedPosProfile.warehouse);
      this.item_details = new pos_ar.PointOfSale.pos_item_details(
        this.$leftSection,
        this.selectedPosProfile.warehouse,
        this.priceLists,
        this.itemPrices,
        this.binList,
        this.selectedItem,
        this.selectedField,
        (event2, field, value) => {
          this.onInput(event2, field, value);
        },
        this.onClose_details.bind(this)
      );
    }
    init_paymentCart() {
      this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
        this.$leftSection,
        this.selectedItemMaps,
        this.selectedTab,
        this.selectedPaymentMethod,
        this.invoiceData,
        this.onClose_payment_cart.bind(this),
        this.onCompleteOrder.bind(this),
        (event2, field, value) => {
          this.onInput(event2, field, value);
        }
      );
    }
    init_historyCart() {
      this.history_cart = new pos_ar.PointOfSale.pos_history(
        this.wrapper,
        this.db,
        this.sales_taxes_and_charges,
        this.historyCartClick.bind(this)
      );
    }
    itemClick_selector(item) {
      const itemCloned = structuredClone(item);
      itemCloned.discount_amount = 0;
      itemCloned.discount_percentage = 0;
      this.addItemToPosInvoice(item);
      console.log("updated ===> ", this.selectedItemMaps);
      this.selected_item_cart.calculateNetTotal();
      this.selected_item_cart.calculateVAT();
      this.selected_item_cart.calculateQnatity();
      this.selected_item_cart.calculateGrandTotal();
      this.selected_item_cart.refreshSelectedItem();
    }
    onSelectedItemClick(item) {
      this.selectedItem = structuredClone(item);
      console.log("selected item clicked ::: ", this.selectedItem);
      console.log("item_details :: ", this.item_details);
      console.log("item_selector :: ", this.item_selector);
      console.log("payment_cart :: ", this.payment_cart);
      this.item_details.show_cart();
      this.selected_item_cart.showKeyboard();
      this.item_selector.hideCart();
      this.payment_cart.hideCart();
      this.selected_item_cart.setKeyboardOrientation("landscape");
      this.item_details.refreshDate(item);
    }
    onCheckout() {
      const pos_checkout = this.selectedItemMaps.get(this.selectedTab.tabName);
      console.log("pos on checkout : ", pos_checkout);
      this.db.savePosInvoice(
        pos_checkout,
        (event2) => {
          console.log("sucess => ", event2);
        },
        (event2) => {
          console.log("failure => ", event2);
        }
      );
      this.payment_cart.showCart();
      this.item_selector.hideCart();
      this.item_details.hide_cart();
      this.payment_cart.calculateGrandTotal();
      this.selected_item_cart.setKeyboardOrientation("landscape");
      this.selected_item_cart.cleanHeighlight();
      this.selected_item_cart.showKeyboard();
    }
    onClose_details() {
      this.item_selector.showCart();
      this.payment_cart.hideCart();
      this.item_details.hide_cart();
      this.selected_item_cart.hideKeyboard();
      this.selected_item_cart.setKeyboardOrientation("portrait");
      this.selected_item_cart.cleanHeighlight();
    }
    onClose_payment_cart() {
      this.item_selector.showCart();
      this.item_details.hide_cart();
      this.payment_cart.hideCart();
      this.selected_item_cart.hideKeyboard();
      this.selected_item_cart.setKeyboardOrientation("portrait");
      this.selected_item_cart.cleanHeighlight();
    }
    onHistoryClick() {
      console.log("selected pos profile 10 : ", this.selectedPosProfile);
      console.log("history ::", this.history_cart);
      this.history_cart.show_cart();
      this.payment_cart.hideCart();
      this.item_details.hide_cart();
      this.item_selector.hideCart();
      this.selected_item_cart.hideCart();
      this.customer_box.hideActionBar();
    }
    backHome() {
      this.item_selector.showCart();
      this.customer_box.showActionBar();
      this.selected_item_cart.showCart();
      this.payment_cart.hideCart();
      this.item_details.hide_cart();
      this.history_cart.hide_cart();
    }
    createNewTab(counter) {
      let new_pos_invoice = frappe.model.get_new_doc("POS Invoice");
      new_pos_invoice.customer = this.selectedCustomer.name;
      new_pos_invoice.pos_profile = this.selectedPosProfile.name;
      new_pos_invoice.items = [];
      new_pos_invoice.taxes_and_charges = this.selectedPosProfile.taxes_and_charges;
      new_pos_invoice.additional_discount_percentage = this.invoiceData.discount;
      new_pos_invoice.paid_amount = 0;
      new_pos_invoice.base_paid_amount = 0;
      new_pos_invoice.creation_time = frappe.datetime.now_datetime();
      new_pos_invoice.payments = [{ "mode_of_payment": "Cash", "amount": 0 }];
      new_pos_invoice.is_pos = 1;
      new_pos_invoice.update_stock = 1;
      new_pos_invoice.docstatus = 0;
      new_pos_invoice.status = "Draft";
      this.selectedItemMaps.set(`C${counter}`, new_pos_invoice);
      this.selectedTab.tabName = `C${counter}`;
    }
    historyCartClick(event2, message) {
      if (event2 == "edit") {
        const tab = this.selected_item_cart.createTabForEditPOS();
        this.selectedItemMaps.set(`C${tab}`, message);
        this.selectedTab.tabName = `C${tab}`;
        console.log("change ::: item map ==> ", this.selectedItemMaps, " selected tab ==> ", this.selectedTab);
        this.item_selector.showCart();
        this.customer_box.showActionBar();
        this.selected_item_cart.showCart();
        this.item_details.hide_cart();
        this.payment_cart.hideCart();
        this.history_cart.hide_cart();
        this.selected_item_cart.refreshTabs();
        this.selected_item_cart.refreshSelectedItem();
      }
    }
    onInput(event2, field, value) {
      if (event2 == "focus" || event2 == "blur") {
        if (event2 == "focus")
          Object.assign(this.selectedField, { field_name: field });
        if (event2 == "blur")
          Object.assign(this.selectedField, { field_name: null });
        this.item_details.makeSelectedFieldHighlighted();
        this.selected_item_cart.makeSelectedButtonHighlighted();
        return;
      }
      if (field == "quantity") {
        this.selectedItem.qty = parseFloat(value);
        this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
        this.selected_item_cart.refreshSelectedItem();
      } else if (field == "rate") {
        this.selectedItem.rate = parseFloat(value);
        let oldRate = this.selectedItem.rate;
        let persont = this.selectedItem.discount_percentage;
        let montant = oldRate * (persont / 100);
        this.selectedItem.discount_percentage = persont;
        this.selectedItem.discount_amount = montant;
        this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
        this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
        this.selected_item_cart.refreshSelectedItem();
        this.item_details.refreshDate(this.selectedItem);
      } else if (field == "discount_percentage") {
        let oldRate = this.selectedItem.rate;
        let montant = oldRate * (parseFloat(value) / 100);
        this.selectedItem.discount_percentage = parseFloat(value);
        this.selectedItem.discount_amount = montant;
        this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
        this.editPosItemDiscountPercentage(this.selectedItem.name, this.selectedItem.discount_percentage);
        this.selected_item_cart.refreshSelectedItem();
        this.item_details.refreshDate(this.selectedItem);
      } else if (field == "discount_amount") {
        let oldRate = this.selectedItem.rate;
        let persent = (parseFloat(value) * 100 / oldRate).toFixed(2);
        let montant = parseFloat(value);
        if (persent > 100) {
          persent = 100;
        }
        if (parseFloat(value) > oldRate) {
          montant = oldRate;
        }
        this.selectedItem.discount_percentage = parseFloat(persent);
        this.selectedItem.discount_amount = montant;
        this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
        this.editPosItemDiscountPercentage(this.selectedItem.name, this.selectedItem.discount_percentage);
        console.log("item ==>>> ", this.selectedItem);
        this.selected_item_cart.refreshSelectedItem();
        this.item_details.refreshDate(this.selectedItem);
      }
    }
    onKeyPressed(action, key) {
      var _a;
      console.log("<<we are in onKeyPressed function >>");
      console.log("action ::: ", action, " key ::: ", key);
      if (action == "quantity") {
        this.item_details.requestFocus("quantity");
      } else if (action == "rate") {
        this.item_details.requestFocus("rate");
      } else if (action == "discount") {
        this.item_details.requestFocus("discount_percentage");
      } else if (action == "remove") {
        this.deleteItemFromPOsInvoice(this.selectedItem.name);
        this.selected_item_cart.refreshSelectedItem();
        this.onClose_details();
      } else if (action == "delete") {
        let newValue = parseFloat(this.item_details.deleteCharacter());
        if (this.selectedField.field_name == "quantity") {
          this.selectedItem.qty = newValue;
          const posItems = this.selectedItemMaps.get(this.selectedTab.tabName);
        } else if (this.selectedField.field_name == "rate") {
          this.selectedItem.rate = newValue;
          const posItems = this.selectedItemMaps.get(this.selectedTab.tabName);
          let oldRate = this.selectedItem.rate;
          let persont = this.selectedItem.discount_percentage;
          let montant = oldRate * (persont / 100);
          this.selectedItem.discount_amount = montant;
        } else if (this.selectedField.field_name == "discount_percentage") {
          let oldRate = this.selectedItem.rate;
          let montant = oldRate * (newValue / 100);
          this.selectedItem.discount_percentage = newValue;
          this.selectedItem.discount_amount = montant;
        } else if (this.selectedField.field_name == "discount_percentage") {
          let oldRate = this.selectedItem.rate;
          let montant = oldRate * (newValue / 100);
          this.selectedItem.discount_percentage = newValue;
          this.selectedItem.discount_rate = montant;
        }
      } else if (action == "addToField") {
        if (this.selectedField.field_name == "cash") {
          this.payment_cart.handleInput(key);
        } else {
          if (this.selectedField.field_name == "quantity") {
            const newVal = this.selectedItem.qty + key;
            this.selectedItem.qty = parseFloat(newVal);
            console.log("we are here, with : ", this.selectedItem.qty);
          } else if (this.selectedField.field_name == "rate") {
            const newVal = this.selectedItem.rate + key;
            this.selectedItem.rate = parseFloat(newVal);
          } else if (this.selectedField.field_name == "discount_percentage") {
            let oldRate = this.selectedItem.rate;
            let old_percentage = (_a = this.selectedItem.discount_percentage) != null ? _a : 0;
            let input = `${old_percentage}` + key;
            let discount_percentage = parseFloat(input);
            if (discount_percentage > 100) {
              discount_percentage = 100;
            }
            let montant = oldRate * (discount_percentage / 100);
            let newRate = oldRate - montant;
            this.selectedItem.discount_percentage = discount_percentage;
            this.selectedItem.discount_amount = montant;
          }
        }
      }
      this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
      this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
      this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
      this.selected_item_cart.refreshSelectedItem();
      this.item_details.refreshDate(this.selectedItem);
    }
    onCompleteOrder() {
      if (this.selectedCustomer.name == "") {
        frappe.warn(
          "Customer didnt selected!",
          "you have to select a customer",
          () => {
          },
          "Done",
          false
        );
      }
      let items = [];
      this.selectedItemMaps.get(this.selectedTab.tabName).items.forEach((item) => {
        let newItem = {
          "item_name": item.name,
          "item_code": item.name,
          "rate": item.rate,
          "qty": item.qty,
          "description": item.name,
          "image": item.image,
          "expense_account": "Cost of Goods Sold - MS",
          "use_serial_batch_fields": 1,
          "discount_percentage": item.discount_percentage,
          "discount_amount": item.discount_amount,
          "warehouse": this.selectedPosProfile.warehouse,
          "income_account": this.selectedPosProfile.income_account,
          "item_tax_rate": {}
        };
        items.push(newItem);
      });
      this.selectedItemMaps.get(this.selectedTab.tabName).items = items;
      if (items.length == 0)
        return;
      this.selectedItemMaps.get(this.selectedTab.tabName).paid_amount = this.invoiceData.paidAmount;
      this.selectedItemMaps.get(this.selectedTab.tabName).base_paid_amount = this.invoiceData.paidAmount;
      this.selectedItemMaps.get(this.selectedTab.tabName).payments = [{ "mode_of_payment": "Cash", "amount": this.invoiceData.paidAmount }];
      this.selectedItemMaps.get(this.selectedTab.tabName).status = "Paid";
      this.selectedItemMaps.get(this.selectedTab.tabName).docstatus = 1;
      this.selectedItemMaps.get(this.selectedTab.tabName).customer = this.selectedCustomer.name;
      this.sellInvoices.set(this.selectedItemMaps.get(this.selectedTab.tabName).name, this.selectedItemMaps.get(this.selectedTab.tabName));
      this.db.updatePosInvoice(
        this.selectedItemMaps.get(this.selectedTab.tabName),
        (event2) => {
          console.log("sucess => ", event2);
        },
        (event2) => {
          console.log("failure => ", event2);
        }
      );
      this.customer_box.setNotSynced();
      this.selectedItemMaps.delete(this.selectedTab.tabName);
      let tabs = Array.from(this.selectedItemMaps.keys());
      if (tabs.length > 0) {
        this.selectedTab.tabName = tabs[0];
        this.selected_item_cart.refreshTabs();
        this.selected_item_cart.refreshSelectedItem();
      } else {
        this.selected_item_cart.createNewTab();
      }
      this.onClose_payment_cart();
    }
    onSync() {
      if (this.POSOpeningEntry.name == "") {
        this.checkForPOSEntry();
        return;
      }
      let all_invoices = Array.from(this.sellInvoices.keys());
      if (all_invoices.length == 0) {
        frappe.msgprint({
          title: __("Sync Complete"),
          indicator: "green",
          message: __("All data is already synchronized.")
        });
        return;
      }
      frappe.show_progress("Syncing Invoices...", 0, all_invoices.length, "syncing");
      let counter = 0;
      let failure = 0;
      let seccess = 0;
      let invoicesRef = [];
      all_invoices.forEach((invoiceName) => {
        frappe.db.insert(
          this.sellInvoices.get(invoiceName)
        ).then((r) => {
          invoicesRef.push({ "pos_invoice": r.name, "customer": r.customer });
          this.sellInvoices.delete(invoiceName);
          counter += 1;
          frappe.show_progress("Syncing Invoices...", counter, all_invoices.length, "syncing");
          if (counter == all_invoices.length) {
            frappe.hide_progress();
            this.customer_box.setSynced();
          }
        }).catch((err) => {
          counter += 1;
          failure += 1;
        });
      });
    }
    onClosePOS() {
      let all_tabs = Array.from(this.sellInvoices.keys());
      if (all_tabs.length > 0) {
        frappe.throw(__(`you have ${all_tabs.length} invoice to sync first.`));
      }
      let voucher = frappe.model.get_new_doc("POS Closing Entry");
      voucher.pos_opening_entry = this.POSOpeningEntry.name;
      voucher.pos_profile = this.POSOpeningEntry.pos_profile;
      voucher.company = this.POSOpeningEntry.company;
      voucher.user = frappe.session.user;
      voucher.posting_date = frappe.datetime.now_date();
      voucher.posting_time = frappe.datetime.now_time();
      frappe.set_route("Form", "POS Closing Entry", voucher.name);
      this.POSOpeningEntry.name = "";
    }
    setListeners() {
      window.addEventListener("offline", function() {
        frappe.msgprint("you lose the connection (offline mode)");
      });
      window.addEventListener("online", function() {
        frappe.msgprint("the connection is back (online mode)");
      });
    }
    getItemPrice(itemId) {
      const price = this.itemPrices.find((itemPrice) => itemPrice.item_code == itemId);
      return price ? price.price_list_rate : 0;
    }
    checkServiceWorker() {
      if (!("serviceWorker" in navigator)) {
        return;
      }
      window.addEventListener("DOMContentLoaded", () => {
        navigator.serviceWorker.register("./sw.js").then((reg) => console.log("Service Worker registered successfully.")).catch((err) => console.log(`Service Worker registration failed: ${err}`));
      });
      this.sw = new pos_ar.PointOfSale.Sw();
      if (document.readyState === "complete") {
        console.log("DOM was already loaded");
        navigator.serviceWorker.register("../assets/pos_ar/public/js/sw.js").then((reg) => console.log("Service Worker registered successfully.")).catch((err) => console.log(`Service Worker registration failed: ${err}`));
      }
    }
    addItemToPosInvoice(clickedItem) {
      let clonedItem = {};
      Object.assign(clonedItem, clickedItem);
      console.log("clicked item ::: ", clickedItem);
      const posInvoice = this.selectedItemMaps.get(this.selectedTab.tabName);
      const posItems = posInvoice.items;
      let exist = false;
      posItems.forEach((item) => {
        if (item.name == clickedItem.name) {
          exist = true;
          item.qty += 1;
        }
      });
      if (!exist) {
        clonedItem.discount_amount = 0;
        clonedItem.discount_percentage = 0;
        clonedItem.qty = 1;
        clonedItem.rate = this.getItemPrice(clickedItem.name);
        posItems.push(clonedItem);
      }
    }
    deleteItemFromPOsInvoice(itemId) {
      const posInvoice = this.selectedItemMaps.get(this.selectedTab.tabName);
      const posItems = posInvoice.items;
      posInvoice.items = posItems.filter((item) => item.name != itemId);
      this.selectedItem = structuredClone({ name: "" });
      console.log("new pos invoice : ", posInvoice.items);
    }
    editPosItemQty(itemName, qty) {
      let items = this.selectedItemMaps.get(this.selectedTab.tabName).items;
      items.forEach((item) => {
        if (item.name == itemName) {
          item.qty = qty;
        }
      });
    }
    editPosItemRate(itemName, rate) {
      let items = this.selectedItemMaps.get(this.selectedTab.tabName).items;
      items.forEach((item) => {
        if (item.name == itemName) {
          item.rate = rate;
        }
      });
    }
    editPosItemDiscountPercentage(itemName, discountPercentage) {
      let items = this.selectedItemMaps.get(this.selectedTab.tabName).items;
      items.forEach((item) => {
        if (item.name == itemName) {
          item.discount_percentage = discountPercentage;
        }
      });
    }
    editPosItemDiscountAmount(itemName, discountAmount) {
      let items = this.selectedItemMaps.get(this.selectedTab.tabName).items;
      items.forEach((item) => {
        if (item.name == itemName) {
          item.discount_amount = discountAmount;
        }
      });
    }
    getSalesTaxes() {
      const taxTemplateId = this.selectedPosProfile.taxes_and_charges;
      let salesTax = [];
      console.log("selected pos profile 11", this.selectedPosProfile);
      console.log("taxTemplateId : ", taxTemplateId, "the profile : ", this.selectedPosProfile);
      this.sales_taxes_and_charges.forEach((tax) => {
        if (tax.parent == taxTemplateId) {
          console.log("debuging ==> parent : ", tax.parent, " taxTemplateId : ", taxTemplateId);
          salesTax.push(tax);
        }
      });
      console.log("sales tax : ", salesTax);
      return salesTax;
    }
    async fetchCustomers() {
      try {
        return await frappe.db.get_list("Customer", {
          fields: ["name", "customer_name"],
          filters: {},
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    }
    async fetchItemGroups() {
      try {
        return await frappe.db.get_list("Item Group", {
          fields: ["name", "item_group_name", "parent_item_group", "is_group"],
          filters: {},
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchItems() {
      try {
        return await frappe.db.get_list("Item", {
          fields: ["name", "item_name", "image", "item_group", "stock_uom"],
          filters: { disabled: 0 },
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchItemPrice() {
      try {
        return await frappe.db.get_list("Item Price", {
          fields: ["name", "item_code", "item_name", "price_list", "price_list_rate"],
          filters: { price_list: "Standard Selling" },
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchPriceList() {
      try {
        return await frappe.db.get_list("Price List", {
          fields: ["name", "price_list_name", "currency"],
          filters: { selling: 1 },
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchWarehouseList() {
      try {
        return await frappe.db.get_list("Warehouse", {
          fields: ["name", "warehouse_name"],
          filters: {},
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Warehouse list : ", error);
        return [];
      }
    }
    async fetchPosProfileList() {
      try {
        return await frappe.db.get_list("POS Profile", {
          fields: ["name", "warehouse", "income_account", "write_off_account", "write_off_cost_center", "taxes_and_charges", "tax_category"],
          filters: { disabled: 0 },
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Warehouse list : ", error);
        return [];
      }
    }
    async fetchSalesTaxesAndChargesTemplate() {
      try {
        return await frappe.db.get_list("Sales Taxes and Charges Template", {
          fields: ["name", "title", "is_default", "company", "tax_category", "taxes"],
          filters: { disabled: 0 },
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Warehouse list : ", error);
        return [];
      }
    }
    async fetchSalesTaxesAndCharges() {
      try {
        return await frappe.db.get_list("Sales Taxes and Charges", {
          fields: ["name", "cost_center", "description", "included_in_print_rate", "rate", "included_in_paid_amount", "parent"],
          filters: { parenttype: "Sales Taxes and Charges Template" },
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Warehouse list : ", error);
        return [];
      }
    }
    async fetchBinList() {
      try {
        return await frappe.db.get_list("Bin", {
          fields: ["actual_qty", "item_code", "warehouse"],
          filters: {},
          limit: 1
        });
      } catch (error) {
        console.error("Error fetching Bin list : ", error);
        return [];
      }
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_item_selector.js
  pos_ar.PointOfSale.pos_item_selector = class {
    constructor(wrapper, item_list, item_group_list, item_prices, onItemClick) {
      this.wrapper = wrapper;
      this.item_list = item_list;
      this.item_group_list = item_group_list;
      this.item_prices = item_prices;
      this.on_item_click = onItemClick;
      this.start_item_selector();
    }
    start_item_selector() {
      this.prepare_select_box();
      this.setItemGroupsInList();
      this.setItemInFlow(this.getItemByItemGroup(""));
      this.setListeners();
    }
    prepare_select_box() {
      this.wrapper.append('<div id="SelectorBox" class="columnBox"></div>');
      this.selectorBox = this.wrapper.find("#SelectorBox");
      this.selectorBox.append('<div id="selectorBoxHeader" class="rowBox header"></div>');
      this.header = this.selectorBox.find("#selectorBoxHeader");
      this.header.append('<h4 class="CartTitle">Items</h4>');
      this.header.append('<div id="inputsBox" class="rowBox align_center"></div>');
      this.inputBox = this.header.find("#inputsBox");
      this.inputBox.append('<input type="text" autocomplete="off"  maxlength="140" placeholder="Search by item code, serial number or barcode" id="ItemInput" name="item" placeHolder="Enter the customer">');
      this.inputBox.append('<input list="ItemGroupList"  id="ItemGroupInput" name="ItemGroup" placeHolder="Item Group">');
      this.inputBox.append('<datalist id="ItemGroupList"></datalist>');
      this.itemGroupList = this.inputBox.find("#ItemGroupList");
      this.itemGroupList.append("<option>fetching Item Groups ...</option>");
      this.selectorBox.append('<div id="itemsContainer" class="rowBox row_wrap"></div>');
      this.itemsContainer = this.selectorBox.find("#itemsContainer");
    }
    setItemGroupsInList() {
      const groupItemList_html = document.getElementById("ItemGroupList");
      groupItemList_html.innerHTML = "";
      this.item_group_list.forEach((group_item) => {
        const option = document.createElement("option");
        option.value = group_item.name;
        option.textContent = group_item.customer_name;
        groupItemList_html.appendChild(option);
      });
    }
    setItemInFlow(filtered_item_list) {
      const itemsContainer_html = document.getElementById("itemsContainer");
      itemsContainer_html.innerHTML = "";
      filtered_item_list.forEach((item) => {
        const itemBox = document.createElement("div");
        itemBox.classList.add("itemBox");
        itemBox.classList.add("columnBox");
        itemBox.classList.add("C_A_Center");
        itemBox.addEventListener("click", (event2) => {
          this.on_item_click(item);
        });
        if (item.image) {
          const itemImage = document.createElement("img");
          itemImage.classList.add("itemImage");
          itemImage.src = item.image;
          itemBox.appendChild(itemImage);
        } else {
          const itemImageHolder = document.createElement("div");
          itemImageHolder.classList.add("itemImage");
          itemImageHolder.classList.add("rowBox");
          itemImageHolder.classList.add("centerItem");
          const firstLatter = document.createElement("h1");
          firstLatter.textContent = item.item_name[0];
          firstLatter.style.color = "#707070";
          itemImageHolder.appendChild(firstLatter);
          itemBox.appendChild(itemImageHolder);
        }
        const itemName = document.createElement("div");
        itemName.textContent = item.name;
        itemName.classList.add("itemTitle");
        itemBox.appendChild(itemName);
        const price = document.createElement("div");
        price.classList.add("itemPrice");
        price.textContent = this.getItemPrice(item.name) + " DA";
        itemBox.appendChild(price);
        itemsContainer_html.appendChild(itemBox);
      });
    }
    showCart() {
      this.selectorBox.css("display", "flex");
    }
    hideCart() {
      this.selectorBox.css("display", "none");
    }
    setListeners() {
      const groupItemListInput = document.getElementById("ItemGroupInput");
      groupItemListInput.addEventListener("input", (even) => {
        this.setItemInFlow(this.getItemByItemGroup(event.target.value));
      });
    }
    getItemByItemGroup(item_group) {
      let groups = [];
      let getChild = (grp) => {
        groups.push(grp);
        this.item_group_list.forEach((g) => {
          if (g.parent_item_group == grp) {
            groups.push(g.name);
            if (g.is_group) {
              getChild(g.name);
            }
          }
        });
      };
      getChild(item_group);
      let filtredItemList = [];
      let getFiltredItems = (group) => {
        this.item_list.forEach((item) => {
          if (item.item_group == group) {
            filtredItemList.push(item);
          }
        });
      };
      groups.forEach((group) => {
        getFiltredItems(group);
      });
      return filtredItemList;
    }
    getItemPrice(itemId) {
      const price = this.item_prices.find((itemPrice) => itemPrice.item_code == itemId);
      return price ? price.price_list_rate : 0;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_customer_box.js
  pos_ar.PointOfSale.pos_customer_box = class {
    constructor(wrapper, customersList, selectedCustomer, backHome, onSync, onClosePOS, onHistoryClick) {
      this.wrapper = wrapper;
      this.customers_list = customersList;
      this.selected_customer = selectedCustomer;
      this.back_home = backHome;
      this.on_sync = onSync;
      this.on_close_pos = onClosePOS;
      this.on_history_click = onHistoryClick;
      this.online = true;
      this.show_menu = false;
      this.start_work();
    }
    start_work() {
      this.prepare_customer_box();
      this.setCustomersInList();
      this.setListeners();
    }
    prepare_customer_box() {
      this.wrapper.append('<div id="ActionsContainerBox" class="rowBox align_center">');
      this.actionContainer = this.wrapper.find("#ActionsContainerBox");
      this.actionContainer.append('<div id="CustomerBox" class="rowBox align_center">');
      this.actionContainer.append('<div id="MenuBox"     class="rowBox centerItem">');
      this.actionContainer.append('<div id="HomeBox"     class="rowBox centerItem"  style="display:none;">');
      this.home = this.actionContainer.find("#HomeBox");
      this.home.append('<img src="/assets/pos_ar/images/home.png" alt="Home" id="homeBoxIcon" >');
      this.menu = this.actionContainer.find("#MenuBox");
      this.menu.append('<img src="/assets/pos_ar/images/menu.png" alt="Menu" id="MenuBtn" >');
      this.menu.append('<div id="menuItemsContainer"     class="columnBox">');
      this.menuItemsContainer = this.actionContainer.find("#menuItemsContainer");
      this.menuItemsContainer.append('<div id="posInvoiceMenuItem" class="menuItem">Recent POS Invoices</div>');
      this.menuItemsContainer.append('<div id="closePosMenuItem"   class="menuItem">Close the POS</div>');
      this.menuItemsContainer.append('<div id="settingMenuItem"    class="menuItem">Setting</div>');
      this.pos_invoices = this.menuItemsContainer.find("#posInvoiceMenuItem");
      this.close_pos = this.menuItemsContainer.find("#closePosMenuItem");
      this.setting = this.menuItemsContainer.find("#settingMenuItem");
      this.customerBox = this.actionContainer.find("#CustomerBox");
      this.customerBox.append('<select  id="CustomerInput" placeHolder="Enter the customer"></select>');
      this.customer_selecte = this.customerBox.find("#CustomerInput");
      this.customerBox.append('<div id="syncBtn" class="Synced">Sync</div>');
      this.sync_btn = this.customerBox.find("#syncBtn");
    }
    setCustomersInList() {
      const customerList_html = document.getElementById("CustomerInput");
      customerList_html.innerHTML = "";
      this.customers_list.forEach((customer) => {
        const option = document.createElement("option");
        option.value = customer.name;
        option.textContent = customer.customer_name;
        customerList_html.appendChild(option);
      });
    }
    hideActionBar() {
      this.customerBox.css("display", "none");
      this.home.css("display", "flex");
      this.actionContainer.css("flex-direction", "row-reverse");
    }
    showActionBar() {
      this.customerBox.css("display", "flex");
      this.home.css("display", "none");
      this.actionContainer.css("flex-direction", "row");
    }
    setListeners() {
      this.customerBox.find("#syncBtn").on("click", (event2) => {
        this.on_sync();
      });
      this.customerBox.find("#CustomerInput").on("input", (event2) => {
        const customer_value = event2.target.value;
        this.customers_list.forEach((customer) => {
          if (customer.name == customer_value) {
            console.log("selected customer : ", customer);
          }
        });
      });
      this.close_pos.on("click", (event2) => {
        this.on_close_pos();
      });
      this.pos_invoices.on("click", (event2) => {
        this.on_history_click();
      });
      this.menu.on("click", (event2) => {
        if (this.show_menu) {
          this.show_menu = !this.show_menu;
          this.menuItemsContainer.css("visibility", "hidden");
          this.menuItemsContainer.css("opacity", "0");
        } else {
          this.show_menu = !this.show_menu;
          this.menuItemsContainer.css("visibility", "visible");
          this.menuItemsContainer.css("opacity", "1");
        }
      });
      this.home.on("click", (event2) => {
        this.back_home();
      });
    }
    setSynced() {
      this.sync_btn.addClass("Synced");
      this.sync_btn.removeClass("NotSynced");
    }
    setNotSynced() {
      this.sync_btn.addClass("NotSynced");
      this.sync_btn.removeClass("Synced");
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_selected_item_cart.js
  pos_ar.PointOfSale.pos_selected_item_cart = class {
    constructor(wrapper, selectedItemMaps, salesTaxes, invoiceData, selectedTab, selectedItem, selectedField, onSelectedItemClick, onTabClick, onKeyPressed, createNewTab, onCheckoutClick) {
      this.wrapper = wrapper;
      this.selected_item_maps = selectedItemMaps;
      this.sales_taxes = salesTaxes;
      this.invoice_data = invoiceData;
      this.selected_tab = selectedTab;
      this.selected_item = selectedItem;
      this.selected_field = selectedField;
      this.on_key_pressed = onKeyPressed;
      this.on_checkout_click = onCheckoutClick;
      this.on_selected_item_click = onSelectedItemClick;
      this.on_tab_click = onTabClick;
      this.create_new_tab = createNewTab;
      this.taxes_map = /* @__PURE__ */ new Map();
      this.total_tax_amout = 0;
      this.counter = 1;
      this.show_discount = false;
      this.start_work();
    }
    start_work() {
      this.prepare_selected_item_cart();
      this.setButtonsListeners();
      this.setListener();
    }
    prepare_selected_item_cart() {
      this.wrapper.append('<div id="tabs"    class="rowBox"><div id="tabs_container" class="rowBox"></div></div>');
      this.wrapper.append('<div id="CartBox" class="columnBox"></div>');
      this.tabs_bar = this.wrapper.find("#tabs");
      this.tabs_container = this.tabs_bar.find("#tabs_container");
      this.cartBox = this.wrapper.find("#CartBox");
      this.tabs_container.append('<div class="tab selected rowBox align_center"><div class="tabName">C1</div><img src="/assets/pos_ar/images/cancel.png" width="10px" height="10px" class="tabDeleteBtn"></div>');
      this.tabs_bar.append('<div id="addTabBtn" class="tab unselected">+</div>');
      this.add_tab_button = this.tabs_bar.find("#addTabBtn");
      this.cartBox.append('<div id="CartBoxTopBar" class=" rowBox align_center  row_sbtw"><div>');
      this.cartBox.append('<div id="cartHeader" class="rowBox row_sbtw align_center"></div>');
      this.cartBox.append('<div id="selectedItemsContainer" class="columnBox"></div>');
      this.cartBox.append('<div id="cartFooter" class="columnBox"></div>');
      this.cartTopBar = this.cartBox.find("#CartBoxTopBar");
      this.cartTopBar.append('<h4 class="CartTitle">Item Cart</h4>');
      this.cartTopBar.append('<div id="selectedItemsPriceListInput"></div>');
      this.priceListInput = this.cartTopBar.find("#selectedItemsPriceListInput");
      this.priceListInput.append('<input list="PriceList"  id="PriceListInput" name="PriceList" placeHolder="Choice a Price list">');
      this.priceListInput.append(' <datalist id="PriceList"></datalist>');
      this.cartHeader = this.cartBox.find("#cartHeader");
      this.cartHeader.append("<div><h6>Item</h6></div>");
      this.cartHeader.append('<div id="cartHeaderTitles" class="rowBox"></div>');
      this.cartHeaderTitles = this.cartHeader.find("#cartHeaderTitles");
      this.cartHeaderTitles.append('<div id="quantityTitle"><h6>Quantity</h6></div>');
      this.cartHeaderTitles.append('<div id="amountTitle">  <h6>Amount  </h6></div>');
      this.selectedItemContainer = this.cartBox.find("#selectedItemsContainer");
      this.cartFooter = this.cartBox.find("#cartFooter");
      this.cartFooter.append('<div id="cartDetails" class="columnBox"></div>');
      this.cartFooter.append('<div id="editSelectedItemCart"></div>');
      this.cartFooter.append('<button type="button" id="checkoutBtn"> Checkout </button>');
      this.cartDetails = this.cartFooter.find("#cartDetails");
      this.cartDetails.append('<div id="discount" class="rowBox align_center row_sbtw"></div>');
      this.cartDetails.append('<div id="totalQuantity" class="rowBox align_center row_sbtw"></div>');
      this.cartDetails.append('<div id="netTotal" class="rowBox align_center row_sbtw"></div>');
      this.cartDetails.append('<div id="VAT" class="columnBox"></div>');
      this.cartDetails.append('<div id="grandTotal" class="rowBox align_center row_sbtw"></div>');
      this.discount = this.cartDetails.find("#discount");
      this.discount.append('<div id="addDiscountTitle">Add Discount % </div>');
      this.discount.append('<input type="number" id="addGlobalDiscountInput" value="0" step="1" min="0" max="100" >');
      this.discountInput = this.discount.find("#addGlobalDiscountInput");
      this.discountTitle = this.discount.find("#addDiscountTitle");
      this.totalQuantity = this.cartDetails.find("#totalQuantity");
      this.totalQuantity.append('<div id="totalQuantityTitle">Total Quantity</div>');
      this.totalQuantity.append('<div id="totalQuantityValue">0</div>');
      this.netTotal = this.cartDetails.find("#netTotal");
      this.netTotal.append('<div id="netTotalTitle">Net Total</div>');
      this.netTotal.append('<div id="netTotalValue">0.00</div>');
      this.vat = this.cartDetails.find("#VAT");
      this.sales_taxes.forEach((tax) => {
        this.vat.append(`<div id="taxConatiner_${tax.name}" class="rowBox align_center row_sbtw"></div>`);
        const taxContainer = this.vat.find(`#taxConatiner_${tax.name}`);
        taxContainer.append(`<div id="tax_${tax.name}_Title">${tax.description}</div>`);
        taxContainer.append(`<div id="tax_${tax.name}_Value">0.00</div>`);
      });
      this.grandTotal = this.cartDetails.find("#grandTotal");
      this.grandTotal.append('<div id="grandTotalTitle">Grand Total</div>');
      this.grandTotal.append('<div id="grandTotalValue">0.00</div>');
      this.editSelectedItem = this.cartFooter.find("#editSelectedItemCart");
      this.editSelectedItem.append('<div class="grid-container">');
      this.buttonsContainer = this.editSelectedItem.find(".grid-container");
      this.buttonsContainer.append('<button id="key_1"        class="grid-item">1</button>');
      this.buttonsContainer.append('<button id="key_2"        class="grid-item">2</button>');
      this.buttonsContainer.append('<button id="key_3"        class="grid-item">3</button>');
      this.buttonsContainer.append('<button id="key_quantity" class="grid-item">Quantity</button>');
      this.buttonsContainer.append('<button id="key_4"        class="grid-item">4</button>');
      this.buttonsContainer.append('<button id="key_5"        class="grid-item">5</button>');
      this.buttonsContainer.append('<button id="key_6"        class="grid-item">6</button>');
      this.buttonsContainer.append('<button id="key_rate"     class="grid-item">Rate</button>');
      this.buttonsContainer.append('<button id="key_7"        class="grid-item">7</button>');
      this.buttonsContainer.append('<button id="key_8"        class="grid-item">8</button>');
      this.buttonsContainer.append('<button id="key_9"        class="grid-item">9</button>');
      this.buttonsContainer.append('<button id="key_discount" class="grid-item">Discount</button>');
      this.buttonsContainer.append('<button id="key_point"    class="grid-item">.</button>');
      this.buttonsContainer.append('<button id="key_0"        class="grid-item">0</button>');
      this.buttonsContainer.append('<button id="key_delete"   class="grid-item">Delete</button>');
      this.buttonsContainer.append('<button id="key_remove"   class="grid-item" style="color:red;font-weight:700;">Remove</button>');
      this.checkoutBtn = this.cartFooter.find("#checkoutBtn");
      this.checkoutBtn.on("mousedown", (event2) => {
        this.on_checkout_click();
      });
    }
    refreshTabs() {
      this.tabs_container.empty();
      for (let key of this.selected_item_maps.keys()) {
        if (key == this.selected_tab.tabName) {
          this.tabs_container.append(`<div class="tab selected rowBox align_center"><div class="tabName">${key}</div>  <img src="/assets/pos_ar/images/cancel.png" width="10px" height="10px"  class="tabDeleteBtn"  >  </div>`);
        } else {
          this.tabs_container.append(`<div class="tab">  <div class="tabName">${key}</div>  </div>`);
        }
      }
      this.tabs_container.find(".tab").on("click", (event2) => {
        const clickedTab = $(event2.target).closest(".tab").find(".tabName").text();
        this.selected_tab.tabName = clickedTab;
        console.log("clicked tab : ", clickedTab, "selected one : ", this.selected_tab, " clicked element : ", event2.target);
        this.refreshTabs();
        this.refreshSelectedItem();
        this.calculateNetTotal();
        this.calculateQnatity();
        this.calculateGrandTotal();
        this.on_tab_click(clickedTab);
      });
      this.tabs_container.find(".tabDeleteBtn").on("click", (event2) => {
        event2.stopPropagation();
        const clickedTab = $(event2.target).closest(".tab").find(".tabName").text();
        this.selected_item_maps.delete(clickedTab);
        if (this.selected_item_maps.size > 0) {
          this.selected_tab.tabName = Array.from(this.selected_item_maps.keys())[0];
          console.log("this.selected_tab.tabName : ", this.selected_tab);
        } else {
          this.createNewTab();
        }
        this.refreshTabs();
        this.refreshSelectedItem();
      });
    }
    refreshSelectedItem() {
      const selectedItemsContainer = document.getElementById("selectedItemsContainer");
      selectedItemsContainer.innerHTML = "";
      this.selected_item_maps.get(this.selected_tab.tabName).items.forEach((item) => {
        const itemElement = document.createElement("div");
        const leftGroup = document.createElement("div");
        const rightGroup = document.createElement("div");
        const itemName = document.createElement("h5");
        const itemQuantity = document.createElement("div");
        const itemPrice = document.createElement("div");
        if (item.image) {
          const itemImage = document.createElement("img");
          itemImage.src = item.image;
          itemImage.classList.add("selectedItemImage");
          leftGroup.appendChild(itemImage);
        } else {
          const itemImageHolder = document.createElement("div");
          const itemImageLatter = document.createElement("div");
          itemImageHolder.classList.add("selectedItemImage", "rowBox", "centerItem");
          itemImageLatter.textContent = item.name[0];
          itemImageHolder.appendChild(itemImageLatter);
          leftGroup.appendChild(itemImageHolder);
        }
        itemName.textContent = item.name;
        itemName.classList.add("selectedItemName");
        leftGroup.appendChild(itemName);
        itemQuantity.textContent = item.qty;
        itemQuantity.classList.add("itemQuantity");
        rightGroup.appendChild(itemQuantity);
        itemPrice.textContent = item.rate - item.discount_amount + " DA";
        itemPrice.classList.add("itemPrice");
        rightGroup.appendChild(itemPrice);
        leftGroup.classList.add("rowBox", "align_center", "leftGroup");
        itemElement.appendChild(leftGroup);
        rightGroup.classList.add("rowBox", "align_center", "rightGroup");
        itemElement.appendChild(rightGroup);
        itemElement.classList.add("rowBox", "align_center", "row_sbtw", "ItemElement", "pointer");
        if (item.name == this.selected_item.name)
          itemElement.classList.add("selected");
        itemElement.addEventListener("click", (event2) => {
          console.log("we are click");
          this.makeItemHighlight(itemElement);
          this.on_selected_item_click(item);
        });
        selectedItemsContainer.appendChild(itemElement);
      });
      this.calculateNetTotal();
      this.calculateVAT();
      this.calculateQnatity();
      this.calculateGrandTotal();
    }
    createNewTab() {
      this.counter += 1;
      this.create_new_tab(this.counter);
      this.refreshTabs();
      this.refreshSelectedItem();
    }
    createTabForEditPOS() {
      this.counter += 1;
      return this.counter;
    }
    showKeyboard() {
      this.editSelectedItem.css("display", "flex");
    }
    hideKeyboard() {
      this.editSelectedItem.css("display", "none");
    }
    setKeyboardOrientation(orientation) {
      const discount = this.cartDetails.find("#discount");
      const quantity = this.cartDetails.find("#totalQuantity");
      const netTotal = this.cartDetails.find("#netTotal");
      const grandTotal = this.cartDetails.find("#grandTotal");
      if (orientation == "landscape") {
        this.cartDetails.css("display", "flex");
        this.cartDetails.addClass("rowBox align_center");
        this.cartDetails.removeClass("columnBox");
        discount.css("display", "none");
        this.vat.css("display", "none");
        quantity.css("font-size", "smaller");
        netTotal.css("font-size", "smaller");
        grandTotal.css("font-size", "small");
        grandTotal.css("font-weight", "500");
      } else {
        this.cartDetails.addClass("columnBox");
        this.cartDetails.removeClass("rowBox");
        discount.css("display", "flex");
        this.vat.css("display", "flex");
        quantity.css("font-size", "small");
        netTotal.css("font-size", "small");
        grandTotal.css("font-size", "larger");
        grandTotal.css("font-weight", "700");
      }
    }
    makeSelectedButtonHighlighted() {
      const quantityButton = this.buttonsContainer.find("#key_quantity");
      const rateButton = this.buttonsContainer.find("#key_rate");
      const discountButton = this.buttonsContainer.find("#key_discount");
      if (this.selected_field.field_name == "quantity") {
        quantityButton.addClass("selected");
        rateButton.removeClass("selected");
        discountButton.removeClass("selected");
      } else if (this.selected_field.field_name == "rate") {
        quantityButton.removeClass("selected");
        rateButton.addClass("selected");
        discountButton.removeClass("selected");
      } else if (this.selected_field.field_name == "discount_percentage") {
        quantityButton.removeClass("selected");
        rateButton.removeClass("selected");
        discountButton.addClass("selected");
      } else {
        quantityButton.removeClass("selected");
        rateButton.removeClass("selected");
        discountButton.removeClass("selected");
      }
    }
    hideCart() {
      this.tabs_bar.css("display", "none");
      this.cartBox.css("display", "none");
    }
    showCart() {
      this.tabs_bar.css("display", "flex");
      this.cartBox.css("display", "flex");
    }
    setButtonsListeners() {
      const key_0 = this.buttonsContainer.find("#key_0");
      const key_1 = this.buttonsContainer.find("#key_1");
      const key_2 = this.buttonsContainer.find("#key_2");
      const key_3 = this.buttonsContainer.find("#key_3");
      const key_4 = this.buttonsContainer.find("#key_4");
      const key_5 = this.buttonsContainer.find("#key_5");
      const key_6 = this.buttonsContainer.find("#key_6");
      const key_7 = this.buttonsContainer.find("#key_7");
      const key_8 = this.buttonsContainer.find("#key_8");
      const key_9 = this.buttonsContainer.find("#key_9");
      const key_quantity = this.buttonsContainer.find("#key_quantity");
      const key_discount = this.buttonsContainer.find("#key_discount");
      const key_rate = this.buttonsContainer.find("#key_rate");
      const key_remove = this.buttonsContainer.find("#key_remove");
      const key_delete = this.buttonsContainer.find("#key_delete");
      const key_point = this.buttonsContainer.find("#key_point");
      let keys = [key_0, key_1, key_2, key_3, key_4, key_5, key_6, key_7, key_8, key_9, key_quantity, key_discount, key_rate, key_remove, key_delete, key_point];
      keys.forEach((key) => {
        key.on("mousedown", (event2) => {
          event2.preventDefault();
          const keyContent = key.text();
          if (!isNaN(keyContent)) {
            this.on_key_pressed("addToField", key.text());
          } else if (keyContent == ".") {
            this.on_key_pressed("addToField", key.text());
          } else if (keyContent == "Quantity") {
            this.on_key_pressed("quantity", null);
          } else if (keyContent == "Rate") {
            this.on_key_pressed("rate", null);
          } else if (keyContent == "Discount") {
            this.on_key_pressed("discount", null);
          } else if (keyContent == "Remove") {
            this.on_key_pressed("remove", null);
          } else if (keyContent == "Delete") {
            this.on_key_pressed("delete", null);
          }
        });
      });
    }
    setListener() {
      this.add_tab_button.on("mousedown", (event2) => {
        this.createNewTab();
      });
      this.tabs_container.find(".tabDeleteBtn").on("click", (event2) => {
      });
      this.discountInput.on("input", (event2) => {
        if (event2.target.value == "") {
          this.invoice_data.discount = 0;
          return;
        } else if (event2.target.value > 100) {
          this.invoice_data.discount = 100;
          return;
        }
        this.invoice_data.discount = parseFloat(event2.target.value);
        console.log("value ::: ", this.invoice_data.discount);
        this.calculateNetTotal();
        this.calculateVAT();
        this.calculateGrandTotal();
      });
      this.discountInput.on("blur", (event2) => {
        if (event2.target.value == "") {
          event2.target.value = 0;
        } else if (event2.target.value > 100) {
          event2.target.value = 100;
        }
        console.log("value ::: ", this.invoice_data.discount);
        this.calculateNetTotal();
        this.calculateVAT();
        this.calculateGrandTotal();
      });
    }
    calculateNetTotal() {
      let netTotal = 0;
      this.selected_item_maps.get(this.selected_tab.tabName).items.forEach((item) => {
        netTotal += item.rate * item.qty;
      });
      if (this.invoice_data.discount > 0) {
        netTotal -= netTotal * (this.invoice_data.discount / 100);
      }
      const netTotal_HTML = document.getElementById("netTotalValue");
      netTotal_HTML.textContent = netTotal;
      this.invoice_data.netTotal = netTotal;
    }
    calculateVAT() {
      console.log("VAT ========> start ");
      this.sales_taxes.forEach((tax) => {
        let saleTaxAmount = 0;
        let taxPercentage = tax.rate / 100;
        const calculatedTax = (this.invoice_data.netTotal * taxPercentage).toFixed(2);
        this.taxes_map.set(tax.name, calculatedTax);
        const tax_HTML = document.getElementById(`tax_${tax.name}_Value`);
        tax_HTML.textContent = this.taxes_map.get(tax.name);
      });
    }
    calculateTotalTaxAmount() {
      let result = 0;
      this.taxes_map.forEach((tax) => {
        result += tax;
      });
      return result;
    }
    calculateQnatity() {
      let quantity = 0;
      this.selected_item_maps.get(this.selected_tab.tabName).items.forEach((item) => {
        quantity += item.qty;
      });
      const totalQuantity_HTML = document.getElementById("totalQuantityValue");
      totalQuantity_HTML.textContent = quantity;
    }
    calculateGrandTotal() {
      let grandTotal = 0;
      let netTotal = this.invoice_data.netTotal;
      let taxAmount = 0;
      this.taxes_map.forEach((tax) => {
        taxAmount += parseFloat(tax);
      });
      grandTotal = netTotal + taxAmount;
      const grandTotal_HTML = document.getElementById("grandTotalValue");
      grandTotal_HTML.textContent = grandTotal.toFixed(2);
      this.invoice_data.grandTotal = grandTotal;
    }
    makeItemHighlight(itemElement) {
      const selectedItemsContainer = document.getElementById("selectedItemsContainer");
      const selectedItems = selectedItemsContainer.querySelectorAll(".selected");
      selectedItems.forEach((selectedItem) => {
        selectedItem.classList.remove("selected");
      });
      itemElement.classList.add("selected");
    }
    cleanHeighlight() {
      const selectedItemsContainer = document.getElementById("selectedItemsContainer");
      const selectedItems = selectedItemsContainer.querySelectorAll(".selected");
      selectedItems.forEach((selectedItem) => {
        selectedItem.classList.remove("selected");
      });
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_item_details.js
  pos_ar.PointOfSale.pos_item_details = class {
    constructor(wrapper, warehouse, priceLists, itemPrices, binList, selectedItem, selectedField, onInput, onClose) {
      this.wrapper = wrapper;
      this.warehouse = warehouse;
      this.price_lists = priceLists;
      this.item_prices = itemPrices;
      this.selected_item = selectedItem;
      this.selected_field = selectedField;
      this.on_input = onInput;
      this.on_close_cart = onClose;
      this.bin_list = binList;
      this.start_the_work();
    }
    start_the_work() {
      this.prepare_item_details_cart();
      this.setDetailsFieldsListeners();
    }
    prepare_item_details_cart() {
      this.wrapper.append('<div id="itemDetailsCart" class="columnBox align_center"><div>');
      this.item_details_cart = this.wrapper.find("#itemDetailsCart");
      this.item_details_cart.append('<div id="itemDetailsCartHeader" class="rowBox header align_center row_sbtw"></div>');
      this.cart_header = this.item_details_cart.find("#itemDetailsCartHeader");
      this.cart_header.append('<h4 class="CartTitle">Item Details</h4>');
      this.cart_header.append('<img src="/assets/pos_ar/images/cancel.png" alt="Cancel Button" id="itemDetailsCartXBtn" class="xBtn">');
      this.close_btn = this.cart_header.find("#itemDetailsCartXBtn").on("click", (event2) => {
        this.on_close_cart();
      });
      this.item_details_cart.append('<div id="itemDetailsHeader" class="rowBox"></div>');
      this.header_details = this.item_details_cart.find("#itemDetailsHeader");
      this.header_details.append('<div id="detailsItemImage" class="rowBox centerItem"></div>');
      this.header_details.append('<div id="price_and_name" class="columnBox"></div>');
      this.price_and_name_details = this.header_details.find("#price_and_name");
      this.price_and_name_details.append('<div id="detailsItemName" class="rowBox align_center"></div>');
      this.price_and_name_details.append('<div id="detailsItemGroupWarhouseContainer" class="rowBox align_center row_sa"></divr>');
      this.item_group_warehouse_details = this.price_and_name_details.find("#detailsItemGroupWarhouseContainer");
      this.item_group_warehouse_details.append('<div id="detailsItemGroup" class="rowBox align_center">Group : ...</div>');
      this.item_group_warehouse_details.append('<div id="detailsItemWarehouse" class="rowBox align_center">Warehouse : ...</div>');
      this.item_details_cart.append('<div id="itemDetailsAll"  class="rowBox"></div>');
      this.details_all = this.item_details_cart.find("#itemDetailsAll");
      this.details_all.append('<div id="itemDetails_C1" class="columnBox"></div>');
      this.c1 = this.details_all.find("#itemDetails_C1");
      this.c1.append('<div class="columnBox"><label for="itemDetailsQuantityInput">Quantity</label><input type="float" id="itemDetailsQuantityInput" class="pointerCursor"></div>');
      this.c1.append('<div class="columnBox"><label for="itemDetailsRateInput">Rate</label><input type="float" id="itemDetailsRateInput" class="pointerCursor"></div>');
      this.c1.append('<div class="columnBox"><label for="itemDetailsDiscountInput">Discount (%)</label><input type="float" id="itemDetailsDiscountInput" class="pointerCursor"></div>');
      this.c1.append('<div class="columnBox"><label for="itemDetailsAvailableInput">Available Qty at Warehouse</label><input type="float" id="itemDetailsAvailableInput" disabled></div>');
      this.details_all.append('<div id="itemDetails_C2" class="columnBox"></div>');
      this.c2 = this.details_all.find("#itemDetails_C2");
      this.c2.append('<div class="columnBox"><label for="itemDetailsUomInput">UOM *</label><input type="text" id="itemDetailsUomInput"  disabled></div>');
      this.c2.append('<div class="columnBox"><label for="detailsRateWithDescount">Discounted Rate</label>  <input type="text" id="discountedRateInput" disabled>  </div>');
      this.c2.append('<div class="columnBox hideMe"><label for="detailsPriceList">Price List *</label><input list="detailsPriceList" id="detailsItemPriceListInput" class ="rowBox align_center pointerCursor"><datalist id="detailsPriceList"><option>fetching Price Lists ...</option></datalist></div>');
      this.c2.append('<div class="columnBox"><label for="itemDetailsDiscountMontantInput">Discount (montant)</label><input type="float" id="itemDetailsDiscountMontantInput" class="pointerCursor"></div>');
      this.c2.append('<div class="columnBox"><label for="itemDetailsPriceListRateInput">Price List Rate</label><input type="text" id="itemDetailsPriceListRateInput" disabled></div>');
    }
    refreshDate(item) {
      var _a, _b;
      const imageContainer = document.getElementById("detailsItemImage");
      const name = document.getElementById("detailsItemName");
      const warehouse = document.getElementById("detailsItemWarehouse");
      const itemGroup = document.getElementById("detailsItemGroup");
      const quantity = document.getElementById("itemDetailsQuantityInput");
      const rate = document.getElementById("itemDetailsRateInput");
      const discountedRate = document.getElementById("discountedRateInput");
      const discount_percentage = document.getElementById("itemDetailsDiscountInput");
      const discount_amount = document.getElementById("itemDetailsDiscountMontantInput");
      const available = document.getElementById("itemDetailsAvailableInput");
      const uom = document.getElementById("itemDetailsUomInput");
      const priceList = document.getElementById("detailsItemPriceListInput");
      const priceListRate = document.getElementById("itemDetailsPriceListRateInput");
      if (item.image) {
        const image = document.createElement("img");
        image.src = item.image;
        imageContainer.innerHTML = "";
        imageContainer.appendChild(image);
      } else {
        const image = document.createElement("div");
        image.textContent = item.item_name[0];
        image.style.fontSize = "xx-large";
        image.style.fontWeight = "700";
        imageContainer.innerHTML = "";
        imageContainer.appendChild(image);
      }
      name.textContent = item.item_name;
      name.classList.add("rowBox", "align_center");
      quantity.value = item.qty;
      rate.value = item.rate;
      discountedRate.value = item.rate - item.discount_amount;
      discount_amount.value = (_a = item.discount_amount) != null ? _a : 0;
      discount_percentage.value = (_b = item.discount_percentage) != null ? _b : 0;
      available.value = this.getQtyInWarehouse(item.name, this.warehouse);
      uom.value = item.stock_uom;
      priceList.value = this.price_lists[0].price_list_name;
      warehouse.textContent = "Warehouse : " + this.warehouse;
      itemGroup.textContent = "Item Group : " + item.item_group;
      priceListRate.value = this.getItemPrice(item.name) + "DA";
      console.log("end ref");
      this.makeSelectedFieldHighlighted();
    }
    show_cart() {
      this.item_details_cart.css("display", "flex");
    }
    hide_cart() {
      this.item_details_cart.css("display", "none");
    }
    makeSelectedFieldHighlighted() {
      if (this.selected_field.field_name == "quantity") {
        this.c1.find("#itemDetailsQuantityInput").addClass("selected");
        this.c1.find("#itemDetailsRateInput").removeClass("selected");
        this.c1.find("#itemDetailsDiscountInput").removeClass("selected");
      } else if (this.selected_field.field_name == "rate") {
        this.c1.find("#itemDetailsQuantityInput").removeClass("selected");
        this.c1.find("#itemDetailsRateInput").addClass("selected");
        this.c1.find("#itemDetailsDiscountInput").removeClass("selected");
      } else if (this.selected_field.field_name == "discount_percentage") {
        this.c1.find("#itemDetailsQuantityInput").removeClass("selected");
        this.c1.find("#itemDetailsRateInput").removeClass("selected");
        this.c1.find("#itemDetailsDiscountInput").addClass("selected");
      } else {
        this.c1.find("#itemDetailsQuantityInput").removeClass("selected");
        this.c1.find("#itemDetailsRateInput").removeClass("selected");
        this.c1.find("#itemDetailsDiscountInput").removeClass("selected");
      }
    }
    requestFocus(field) {
      if (field == "quantity") {
        this.c1.find("#itemDetailsQuantityInput").focus();
      } else if (field == "rate") {
        this.c1.find("#itemDetailsRateInput").focus();
      } else if (field == "discount_percentage") {
        this.c1.find("#itemDetailsDiscountInput").focus();
      } else if (field == "discount_amount") {
        this.c1.find("#itemDetailsDiscountMontantInput").focus();
      }
    }
    addToField(field, value) {
      console.log("field : ", field, "value : ", value);
      if (field == "quantity") {
        this.c1.find("#itemDetailsQuantityInput").val((index, currentValue) => {
          if (value == "." && currentValue.includes("."))
            return currentValue;
          else
            return currentValue + value;
        });
      } else if (field == "rate") {
        this.c1.find("#itemDetailsRateInput").val((index, currentValue) => {
          if (value == "." && currentValue.includes("."))
            return currentValue;
          else
            return currentValue + value;
        });
      } else if (field == "discount_percentage") {
        this.c1.find("#itemDetailsDiscountInput").val((index, currentValue) => {
          if (value == "." && currentValue.includes("."))
            return currentValue;
          else
            return currentValue + value;
        });
      } else if (field == "discount_amount") {
        this.c1.find("#itemDetailsDiscountInput").val((index, currentValue) => {
          if (value == "." && currentValue.includes("."))
            return currentValue;
          else
            return currentValue + value;
        });
      }
    }
    deleteCharacter() {
      let field = this.selected_field.field_name;
      let newValue = 0;
      if (field == "quantity") {
        let field2 = this.c1.find("#itemDetailsQuantityInput");
        let cursor = field2[0].selectionStart;
        console.log(field2.val());
        field2.val((index, currentValue) => {
          console.log("length : ", currentValue, " cursor : ", cursor);
          if (currentValue.length < 0) {
            newValue = 0;
            return 0;
          } else if (currentValue.length == 1) {
            newValue = 0;
            return 0;
          } else if (cursor == 0) {
            newValue = currentValue;
            return currentValue;
          } else if (cursor == currentValue.length) {
            newValue = currentValue.slice(0, cursor - 1);
            return currentValue.slice(0, cursor - 1);
          } else {
            newValue = currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
            return currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
          }
        });
        setTimeout(() => {
          field2[0].setSelectionRange(cursor - 1, cursor - 1);
          field2[0].focus();
        }, 0);
      }
      if (field == "rate") {
        let field2 = this.c1.find("#itemDetailsRateInput");
        let cursor = field2[0].selectionStart;
        field2.val((index, currentValue) => {
          if (currentValue.length < 0) {
            newValue = 0;
            return 0;
          } else if (currentValue.length == 1) {
            newValue = 0;
            return 0;
          } else if (cursor == 0) {
            newValue = currentValue;
            return currentValue;
          } else if (cursor == currentValue.length) {
            newValue = currentValue.slice(0, cursor - 1);
            return currentValue.slice(0, cursor - 1);
          } else {
            newValue = currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
            return currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
          }
        });
        setTimeout(() => {
          field2[0].setSelectionRange(cursor - 1, cursor - 1);
          field2[0].focus();
        }, 0);
      }
      if (field == "discount_percentage") {
        let field2 = this.c1.find("#itemDetailsDiscountInput");
        let cursor = field2[0].selectionStart;
        field2.val((index, currentValue) => {
          if (currentValue.length < 0) {
            newValue = 0;
            return 0;
          } else if (currentValue.length == 1) {
            newValue = 0;
            return 0;
          } else if (cursor == 0) {
            newValue = currentValue;
            return currentValue;
          } else if (cursor == currentValue.length) {
            newValue = currentValue.slice(0, cursor - 1);
            return currentValue.slice(0, cursor - 1);
          } else {
            newValue = currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
            return currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
          }
        });
        setTimeout(() => {
          field2[0].setSelectionRange(cursor - 1, cursor - 1);
          field2[0].focus();
        }, 0);
      }
      console.log("we reach to here ");
      return newValue;
    }
    setDetailsFieldsListeners() {
      this.quantityInput = this.c1.find("#itemDetailsQuantityInput");
      this.rateInput = this.c1.find("#itemDetailsRateInput");
      this.discountInput = this.c1.find("#itemDetailsDiscountInput");
      this.discountMontantInput = this.c2.find("#itemDetailsDiscountMontantInput");
      this.quantityInput.on("input", (event2) => {
        const value = event2.target.value;
        if (value.length == 0) {
          event2.target.value = 0;
        } else if (!value.slice(0, -1).includes(".") && value[value.length - 1] == ".") {
          event2.target.value = value;
        } else if (value[value.length - 1] == ".") {
          event2.target.value = value.slice(0, -1);
        } else if (value[value.length - 1] == " ") {
          event2.target.value = value.slice(0, -1);
        } else if (isNaN(value[value.length - 1])) {
          event2.target.value = value.slice(0, -1);
        } else {
          event2.target.value = value;
        }
        let newQuantity = parseFloat(this.quantityInput.val());
        if (isNaN(newQuantity)) {
          console.warn("Invaide Quantity value =>", this.quantityInput.val());
          return;
        } else if (newQuantity <= 0) {
          newQuantity = 0;
        }
        this.on_input("input", "quantity", newQuantity);
      });
      this.quantityInput.on("focus", (event2) => {
        this.on_input("focus", "quantity", null);
      });
      this.quantityInput.on("blur", (event2) => {
        this.on_input("blur", "quantity", null);
      });
      this.rateInput.on("input", (event2) => {
        const value = event2.target.value;
        if (value.length == 0) {
          event2.target.value = 0;
        } else if (!value.slice(0, -1).includes(".") && value[value.length - 1] == ".") {
          event2.target.value = value;
        } else if (value[value.length - 1] == ".") {
          event2.target.value = value.slice(0, -1);
        } else if (isNaN(value[value.length - 1])) {
          event2.target.value = value.slice(0, -1);
        } else {
          event2.target.value = value;
        }
        let newRate = parseFloat(this.rateInput.val());
        console.log("new rate : ", newRate);
        if (isNaN(newRate)) {
          console.warn("Invalide Rate value");
          return;
        }
        this.on_input("input", "rate", newRate);
      });
      this.rateInput.on("focus", (event2) => {
        this.on_input("focus", "rate", null);
      });
      this.rateInput.on("blur", (event2) => {
        this.on_input("blur", "rate", null);
      });
      this.discountInput.on("input", (event2) => {
        const value = event2.target.value;
        if (value.length == 0) {
          event2.target.value = 0;
        } else if (!value.slice(0, -1).includes(".") && value[value.length - 1] == ".") {
          event2.target.value = value;
        } else if (value[value.length - 1] == ".") {
          event2.target.value = value.slice(0, -1);
        } else if (isNaN(value[value.length - 1])) {
          event2.target.value = value.slice(0, -1);
        } else {
          event2.target.value = value;
        }
        let newDiscount = this.discountInput.val();
        console.log("the new value ", newDiscount);
        if (isNaN(newDiscount)) {
          console.warn("Invalide discount value");
          return;
        }
        if (newDiscount < 100) {
          this.on_input("input", "discount_percentage", newDiscount);
        } else {
          event2.target.value = 100;
          this.on_input("input", "discount_percentage", 100);
        }
      });
      this.discountInput.on("focus", (event2) => {
        this.on_input("focus", "discount_percentage", null);
      });
      this.discountInput.on("blur", (event2) => {
        this.on_input("blur", "discount_percentage", null);
      });
      this.discountMontantInput.on("input", (event2) => {
        const value = event2.target.value;
        if (value.length == 0) {
          event2.target.value = 0;
        } else if (!value.slice(0, -1).includes(".") && value[value.length - 1] == ".") {
          event2.target.value = value;
        } else if (value[value.length - 1] == ".") {
          event2.target.value = value.slice(0, -1);
        } else if (isNaN(value[value.length - 1])) {
          event2.target.value = value.slice(0, -1);
        } else {
          event2.target.value = value;
        }
        let newDiscount = this.discountMontantInput.val();
        if (isNaN(newDiscount)) {
          console.warn("Invalide discount value");
          return;
        }
        this.on_input("input", "discount_amount", newDiscount);
      });
      this.discountMontantInput.on("focus", (event2) => {
        console.log("we are here");
        this.on_input("focus", "discount_amount", null);
      });
      this.discountMontantInput.on("blur", (event2) => {
        this.on_input("blur", "discount_amount", null);
      });
    }
    getItemPrice(itemId) {
      const price = this.item_prices.find((itemPrice) => itemPrice.item_code == itemId);
      return price ? price.price_list_rate : 0;
    }
    getQtyInWarehouse(itemId, warehouseId) {
      const bin = this.bin_list.find((bin2) => bin2.item_code == itemId && bin2.warehouse == warehouseId);
      return bin ? bin.actual_qty : 0;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_payment_cart.js
  pos_ar.PointOfSale.pos_payment_cart = class {
    constructor(wrapper, selectedItemMap, selectedTab, selectedPaymentMythod, invoiceData, onClose, onComplete, onInput) {
      this.wrapper = wrapper;
      this.selected_item_map = selectedItemMap;
      this.selected_tab = selectedTab;
      this.selected_payment_method = selectedPaymentMythod;
      this.invoice_data = invoiceData;
      this.on_close_cart = onClose;
      this.on_complete = onComplete;
      this.on_input = onInput;
      console.log("starting with  ==> ", this.invoice_data.grandTotal);
      this.start_work();
    }
    start_work() {
      this.prepare_payment_cart();
      this.calculateGrandTotal();
      this.setListeners();
      console.log("helloooooooooooooooooooooooooooo ");
    }
    prepare_payment_cart() {
      this.wrapper.append('<div id="paymentMethodCart" class="columnBox align_center"></div>');
      this.cart = this.wrapper.find("#paymentMethodCart");
      this.cart.append('<div id="paymentMethodCartHeader" class="rowBox header align_center row_sbtw"></div>');
      this.cart.append('<div id="paymentMethodContent" class="columnBox align_center"></div>');
      this.cart.append('<div id="paymentMethodCartFooter" class="columnBox align_center"></div>');
      this.cart_header = this.cart.find("#paymentMethodCartHeader");
      this.cart_content = this.cart.find("#paymentMethodContent");
      this.cart_footer = this.cart.find("#paymentMethodCartFooter");
      this.cart_header.append('<h4 class="CartTitle">Item Details</h4>');
      this.cart_header.append('<img src="/assets/pos_ar/images/cancel.png" alt="Cancel Button" id="paymentMethodCartXBtn" class="xBtn">');
      this.cart_header.find("#paymentMethodCartXBtn").on("click", (event2) => {
        this.on_close_cart();
      });
      this.cart_content.append('<div id="paymentContentTopSection" class="rowBox"></div>');
      this.cart_content.append('<div id="paymentContentBottomSection" class="columnBox"></div>');
      this.cart_content_top_section = this.cart_content.find("#paymentContentTopSection");
      this.cart_content_bottom_section = this.cart_content.find("#paymentContentBottomSection");
      this.cart_content_top_section.append('<div id="cashBox" class="paymentMethodBox"><div id="cashBoxTitle" class="title">Cash</div><input type="float" id="cachInput" value="0"  ></div>');
      this.cart_content_top_section.append('<div id="paymentOnTimeBox" class="paymentMethodBox"><div id="paymentOnTimeBoxTitle" class="title">On Time</div><input type="float" id="paymentOnTimeInput" value="0" ></div>');
      this.cart_content_top_section.append('<div id="redeemLoyaltyPoints" class="paymentMethodBox"><div id="redeemLoyaltyPointsTitle" class="title">Redeem Loyalty Points</div><input type="float" id="RedeemLayoutPointsInput" value="0" disabled></div>');
      this.cashBox = this.cart_content_top_section.find("#cashBox");
      this.onTimeBox = this.cart_content_top_section.find("#paymentOnTimeBox");
      this.redeemLoyaltyBox = this.cart_content_top_section.find("#redeemLoyaltyPoints");
      this.cart_content_bottom_section.append("<h4>Additional Information</h4>");
      this.cart_footer.append('<div id="paymentDetailsContainer" class="rowBox align_center"></div>');
      this.cart_footer.append('<button type="button" id="completeOrderBtn">Complete Order</button>');
      this.payment_details = this.cart_footer.find("#paymentDetailsContainer");
      this.payment_details.append('<div class="columnBox"><div id="paymentGrandTotalTitle" class="rowBox centerItem">Grand Total</div><div id="paymentGrandTotalValue" class="rowBox centerItem"></div></div>');
      this.payment_details.append("<hr>");
      this.payment_details.append(`<div id="paymentPaidAmount" class="columnBox"><div id="paymentPaidAmountTitle" class="rowBox centerItem">Paid Amount</div><div id="paimentPaidAmountValue"  class="rowBox centerItem"> 0 DA </div></div>`);
      this.payment_details.append("<hr>");
      this.payment_details.append(`<div id="paymentToChange" class="columnBox"><div id="paimentToChangeTitle" class="rowBox centerItem">To Change</div><div id="paimentToChangeValue"  class="rowBox centerItem"> ${this.toChange}DA </div></div>`);
    }
    showCart() {
      this.cart.css("display", "flex");
      this.clearData();
    }
    hideCart() {
      this.cart.css("display", "none");
    }
    clearData() {
      this.invoice_data.paidAmount = 0;
      this.invoice_data.toChange = 0;
      this.cashBox.find("#cachInput").val(0);
      this.calculateGrandTotal();
      this.calculateToChange();
      this.refreshPaidAmount();
    }
    refreshData() {
      console.log("refreshing data");
      this.cashBox.find("#cachInput").val(this.invoice_data.paidAmount);
      this.calculateGrandTotal();
      this.calculateToChange();
      this.refreshPaidAmount();
    }
    setListeners() {
      this.cashBox.on("click", (event2) => {
        this.selected_payment_method.methodName = "cash";
        this.cashBox.addClass("selected");
        this.onTimeBox.removeClass("selected");
        this.redeemLoyaltyBox.removeClass("selected");
        this.invoice_data.paidAmount = this.cashBox.find("#cachInput").val();
        this.refreshPaidAmount();
      });
      this.onTimeBox.on("click", (event2) => {
        this.selected_payment_method.methodName = "onTime";
        this.cashBox.removeClass("selected");
        this.onTimeBox.addClass("selected");
        this.redeemLoyaltyBox.removeClass("selected");
        this.invoice_data.paidAmount = this.onTimeBox.find("#paymentOnTimeInput").val();
        this.refreshPaidAmount();
      });
      this.redeemLoyaltyBox.on("click", (event2) => {
        this.selected_payment_method.methodName = "redeemLoyalty";
        this.cashBox.removeClass("selected");
        this.onTimeBox.removeClass("selected");
        this.redeemLoyaltyBox.addClass("selected");
        this.invoice_data.paidAmount = 0;
        this.refreshPaidAmount();
      });
      this.cashBox.find("#cachInput").on("input", (event2) => {
        console.log("we are here 1:)");
        const value = event2.target.value;
        if (value.length == 0) {
          event2.target.value = 0;
        } else if (!value.slice(0, -1).includes(".") && value[value.length - 1] == ".") {
          event2.target.value = value;
        } else if (value[value.length - 1] == ".") {
          event2.target.value = value.slice(0, -1);
        } else if (value[value.length - 1] == " ") {
          event2.target.value = value.slice(0, -1);
        } else if (isNaN(value[value.length - 1])) {
          event2.target.value = value.slice(0, -1);
        } else {
          event2.target.value = value;
        }
        this.invoice_data.paidAmount = event2.target.value;
        this.refreshPaidAmount();
        this.calculateToChange();
        console.log("input", event2.target.value);
      });
      this.cashBox.find("#cachInput").on("focus", (event2) => {
        this.on_input("focus", "cash", null);
      });
      this.onTimeBox.find("#paymentOnTimeInput").on("input", (event2) => {
        const value = event2.target.value;
        if (value.length == 0) {
          event2.target.value = 0;
        } else if (!value.slice(0, -1).includes(".") && value[value.length - 1] == ".") {
          event2.target.value = value;
        } else if (value[value.length - 1] == ".") {
          event2.target.value = value.slice(0, -1);
        } else if (value[value.length - 1] == " ") {
          event2.target.value = value.slice(0, -1);
        } else if (isNaN(value[value.length - 1])) {
          event2.target.value = value.slice(0, -1);
        } else {
          event2.target.value = value;
        }
        this.invoice_data.paidAmount = event2.target.value;
        this.refreshPaidAmount();
        this.calculateToChange();
        console.log("input", event2.target.value);
      });
      this.redeemLoyaltyBox.find("#RedeemLayoutPointsInput").on("input", (event2) => {
        const value = event2.target.value;
        if (value.length == 0) {
          event2.target.value = 0;
        } else if (!value.slice(0, -1).includes(".") && value[value.length - 1] == ".") {
          event2.target.value = value;
        } else if (value[value.length - 1] == ".") {
          event2.target.value = value.slice(0, -1);
        } else if (value[value.length - 1] == " ") {
          event2.target.value = value.slice(0, -1);
        } else if (isNaN(value[value.length - 1])) {
          console.log("===}> ", value[value.length - 1]);
          event2.target.value = value.slice(0, -1);
        } else {
          event2.target.value = value;
        }
        console.log("input", event2.target.value);
      });
      this.cart_footer.find("#completeOrderBtn").on("click", (event2) => {
        console.log("grand total ==> ", this.invoice_data.grandTotal, "the paid amount ==> ", this.invoice_data.paidAmount);
        if (this.invoice_data.grandTotal > this.invoice_data.paidAmount) {
          console.log("here we go 1");
          frappe.warn(
            "Paid amount is less than the Total!",
            "Please set the correct paid amount value",
            () => {
            },
            "Done",
            false
          );
          return;
        } else if (this.invoice_data.grandTotal == 0) {
          console.log("here we go 2");
          frappe.warn(
            "No item",
            "Please select some items.",
            () => {
            },
            "Done",
            false
          );
          return;
        }
        frappe.confirm(
          "Submit the invoice ?",
          () => {
            this.on_complete();
          },
          () => {
          }
        );
      });
    }
    handleInput(key) {
      let previousValue = this.cashBox.find("#cachInput").val();
      if (previousValue.includes(".") && key == ".") {
        return;
      }
      this.invoice_data.paidAmount += key;
      this.refreshData();
    }
    calculateGrandTotal() {
      console.log("calculateGrandTotal called with ==> ", this.invoice_data.grandTotal);
      this.payment_details.find("#paymentGrandTotalValue").text(`${this.invoice_data.grandTotal} DA`);
      this.generateProposedPaidAmount(this.invoice_data.grandTotal);
    }
    calculateToChange() {
      this.invoice_data.toChange = this.invoice_data.paidAmount - this.invoice_data.grandTotal;
      this.payment_details.find("#paimentToChangeValue").text(`${this.invoice_data.toChange} DA`);
    }
    refreshPaidAmount() {
      this.payment_details.find("#paimentPaidAmountValue").text(`${this.invoice_data.paidAmount} DA`);
      const paid_amount_DA = this.payment_details.find("#paimentPaidAmountValue").text();
      const paid_amount_txt = paid_amount_DA.slice(0, -2);
      const paid_amount = parseFloat(paid_amount_txt);
      this.invoice_data.paidAmount = paid_amount;
      console.log("paid_amount : ", paid_amount, "paid_amount_txt ", paid_amount_txt, "paid_amount_DA", paid_amount_DA);
    }
    generateProposedPaidAmount(total) {
      const money = [10, 20, 50, 100, 200, 500, 1e3, 2e3];
      let counter = 0;
      let pointer = 7;
      while (counter < total) {
        counter += money[pointer];
      }
      console.log("counter : ", counter);
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_history.js
  pos_ar.PointOfSale.pos_history = class {
    constructor(wrapper, db, salesTaxesAndCharges, onClick) {
      this.wrapper = wrapper;
      this.db = db;
      this.sales_taxes_and_charges = salesTaxesAndCharges;
      this.on_click = onClick;
      this.localPosInvoice = { lastTime: null, pos_invoices: [] };
      this.filter = "";
      this.filtered_pos_list = [];
      this.selected_pos = null;
      this.start_work();
    }
    start_work() {
      this.prepare_history_cart();
      this.db.getAllPosInvoice(
        (result) => {
          console.log("the db data ", result);
          this.localPosInvoice.pos_invoices = result;
          this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter((pos) => {
            console.log("pos : ", pos, "its status ", pos.status);
            if (pos.status == "Draft") {
              return true;
            } else {
              return false;
            }
          });
          console.log("log init data : ", this.filtered_pos_list);
          if (this.filtered_pos_list.length == 0) {
            this.selected_pos = null;
            console.log("first condition");
          } else {
            this.selected_pos = structuredClone(this.filtered_pos_list[0]);
            console.log("second condition");
          }
          this.refreshData();
        },
        (error) => {
          console.log(error);
        }
      );
      this.setListener();
    }
    prepare_history_cart() {
      this.wrapper.find("#LeftSection").append('<div id="historyLeftContainer" class="columnBox"></div>');
      this.wrapper.find("#RightSection").append('<div id="historyRightContainer" class="columnBox"></div>');
      this.left_container = this.wrapper.find("#historyLeftContainer");
      this.right_container = this.wrapper.find("#historyRightContainer");
      this.left_container.append('<div id="PosContentHeader" class="rowBox" ><div class="c1 columnBox"><div id="posCustomer">Customer</div><div id="posSoldBy">Sold by : User</div></div><div class="c2 columnBox"><div id="posCost">0,0000 DA</div><div id="posId">ACC-PSINV-2024-ID</div><div id="posStatus">POS Status</div></div></div>');
      this.pos_header = this.left_container.find("#PosContentHeader");
      this.left_container.append('<div id="posContent" class="columnBox"></div>');
      this.pos_content = this.left_container.find("#posContent");
      this.pos_content.append('<div id="posItemContainer"><div class="posSectionTitle">Items</div><div id="posItemList"></div></div>');
      this.itemContainer = this.pos_content.find("#posItemContainer");
      this.itemList = this.itemContainer.find("#posItemList");
      this.pos_content.append('<div id="posTotalsContainer"><div class="posSectionTitle">Totals</div><div id="posTotalList"></div></div>');
      this.totalsContainer = this.pos_content.find("#posTotalsContainer");
      this.totalList = this.pos_content.find("#posTotalList");
      this.pos_content.append('<div id="posPaymentsContainer"><div class="posSectionTitle">Payments</div><div id="posMethodList"></div></div>');
      this.paymentsContainer = this.pos_content.find("#posPaymentsContainer");
      this.methodList = this.pos_content.find("#posMethodList");
      this.left_container.append('<div id="posActionsContainer" class="rowBox align_content"  style="display = none ;" > <div id="posPrintBtn" class="actionBtn rowBox centerItem"> Print Receipt </div>  <div id="posEmailBtn" class="actionBtn rowBox centerItem"> Email Receipt </div>   <div id="posReturnBtn" class="actionBtn rowBox centerItem"> Return </div>  </div>');
      this.left_container.append('<div id="posDraftActionsContainer" class="rowBox align_content" style="display = none ;"> <div id="posEditBtn" class="actionBtn rowBox centerItem"> Edit Invoice </div>  <div id="posDeleteBtn" class="actionBtn rowBox centerItem"> Delete Invoice </div>  </div>');
      this.actionButtonsContainer = this.left_container.find("#posActionsContainer");
      this.printBtn = this.actionButtonsContainer.find("#posPrintBtn");
      this.emailBtn = this.actionButtonsContainer.find("#posEmailBtn");
      this.returnBtn = this.actionButtonsContainer.find("#posReturnBtn");
      this.draftActionButtonsContainer = this.left_container.find("#posDraftActionsContainer");
      this.deleteBtn = this.draftActionButtonsContainer.find("#posDeleteBtn");
      this.editBtn = this.draftActionButtonsContainer.find("#posEditBtn");
      this.right_container.append('<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4></div>');
      this.right_container.append('<div id="historyRightSearchContainer" class="rowBox align_center" ></div>');
      this.search_container = this.right_container.find("#historyRightSearchContainer");
      this.search_container.append('<select  id="PosInvoiceTypeInput" placeholder="POS Invoice Type">');
      this.filter_input = this.search_container.find("#PosInvoiceTypeInput");
      this.filter_input.append('<option value="Draft">Draft</option><option value="Paid">Paid</option><option value="Consolidated">Consolidated</option>');
      this.search_container.append('<input type="text" id="historyInput" placeholder="Search by invoice id or custumer name">');
      this.right_container.append('<div id="historyRecentInvoicesContainer" ></div>');
      this.right_data_container = this.right_container.find("#historyRecentInvoicesContainer");
    }
    refreshData() {
      this.right_data_container.html("");
      console.log("looke at here now : ", this.filtered_pos_list);
      this.filtered_pos_list.forEach((record) => {
        var _a;
        const posContainer = document.createElement("div");
        posContainer.classList.add("posInvoiceContainer");
        posContainer.classList.add("columnBox");
        posContainer.classList.add("align_content");
        const l1 = document.createElement("div");
        l1.classList.add("l1");
        l1.classList.add("rowBox");
        l1.classList.add("align_content");
        const posName = document.createElement("div");
        posName.classList.add("posName");
        posName.textContent = record.name;
        const posCost = document.createElement("div");
        posCost.classList.add("posCost");
        posCost.textContent = (_a = record.paid_amount) != null ? _a : 0 + " DA";
        l1.appendChild(posName);
        l1.appendChild(posCost);
        const l2 = document.createElement("div");
        l2.classList.add("l2");
        l2.classList.add("rowBox");
        l2.classList.add("align_content");
        const customer = document.createElement("div");
        customer.classList.add("customer");
        customer.classList.add("rowBox");
        customer.classList.add("align_content");
        const customerLogo = document.createElement("img");
        customerLogo.src = "/assets/pos_ar/images/customer.png";
        customerLogo.width = 16;
        customerLogo.height = 16;
        customerLogo.classList.add("customerLogo");
        const customerName = document.createElement("div");
        customerName.textContent = record.customer;
        customerName.classList.add("customerName");
        customer.appendChild(customerLogo);
        customer.appendChild(customerName);
        l2.appendChild(customer);
        const creationTime = document.createElement("div");
        creationTime.textContent = record.creation_time;
        l2.appendChild(creationTime);
        posContainer.appendChild(l1);
        posContainer.appendChild(l2);
        posContainer.addEventListener("click", () => {
          this.selected_pos = record;
          this.refreshPosDetailsData();
        });
        this.right_data_container.append(posContainer);
      });
      this.refreshPosDetailsData();
    }
    refreshPosDetailsData() {
      var _a, _b, _c;
      if (this.selected_pos == null) {
        this.setEmpty();
        return;
      } else {
        this.setData();
      }
      this.pos_header.find("#posCustomer").text((_a = this.selected_pos.customer) != null ? _a : "CustomerName");
      this.pos_header.find("#posCost").text((_b = this.selected_pos.paid_amount) != null ? _b : 0 + "DA");
      this.pos_header.find("#posId").text((_c = this.selected_pos.name) != null ? _c : "POS Invoice Name");
      this.pos_header.find("#posStatus").text(this.selected_pos.status);
      this.pos_header.find("#posStatus").removeClass().addClass(`${this.selected_pos.status}`);
      if (this.selected_pos.status == "Draft") {
        this.draftActionButtonsContainer.css("display", "flex");
        this.actionButtonsContainer.css("display", "none");
      } else {
        this.draftActionButtonsContainer.css("display", "none");
        this.actionButtonsContainer.css("display", "flex");
      }
      this.itemList.html("");
      this.selected_pos.items.forEach((item) => {
        this.itemList.append(`<div class="rowBox align_item">    <div class="itemName rowBox align_center">${item.item_name}</div>   <div class="itemQuantity rowBox align_center">${item.qty}</div>   <div class="itemCost rowBox align_center">${item.qty * item.rate} DA</div>  </div>`);
      });
      this.totalList.html("");
      let netTotal = 0;
      this.selected_pos.items.forEach((item) => {
        netTotal += item.rate * item.qty;
      });
      this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">Net Total</div> <div class="price rowBox align_center">${netTotal} DA</div> </div>`);
      const salesTaxes = this.getSalesTaxes(this.selected_pos);
      let allTax = 0;
      if (this.selected_pos.taxes_and_charges != "" && this.selected_pos.taxes_and_charges != null) {
        salesTaxes.forEach((tax) => {
          allTax += tax.rate / 100 * netTotal;
          this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">${tax.description}</div> <div class="price rowBox align_center">${tax.rate / 100 * netTotal} DA</div> </div>`);
        });
      }
      this.totalList.append(`<div class="rowBox align_item"> <div class="grandTotalName rowBox align_center">Grand Total</div> <div class="grandTotalPrice rowBox align_center">${netTotal + allTax} DA</div> </div>`);
      this.methodList.html("");
      const payments = this.selected_pos.payments;
      if (payments != null && payments != "") {
        payments.forEach((method) => {
          this.methodList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">${method.mode_of_payment}</div> <div class="price rowBox align_center">${method.amount} DA</div> </div>`);
        });
      }
    }
    show_cart() {
      this.left_container.css("display", "flex");
      this.right_container.css("display", "flex");
      const filter = this.filter_input.val();
      console.log("filter : ", filter);
      this.db.getAllPosInvoice(
        (result) => {
          this.localPosInvoice.pos_invoices = result;
          this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter((pos) => {
            if (pos.status == filter) {
              return true;
            } else {
              return false;
            }
          });
          if (this.filtered_pos_list.length == 0) {
            this.selected_pos = null;
          } else {
            this.selected_pos = structuredClone(this.filtered_pos_list[0]);
          }
          this.refreshData();
        },
        (error) => {
          console.log(error);
        }
      );
    }
    hide_cart() {
      this.left_container.css("display", "none");
      this.right_container.css("display", "none");
    }
    setEmpty() {
      this.pos_header.css("display", "none");
      this.pos_content.css("display", "none");
      this.actionButtonsContainer.css("display", "none");
      this.draftActionButtonsContainer.css("display", "none");
    }
    setData() {
      this.pos_header.css("display", "flex");
      this.pos_content.css("display", "flex");
    }
    setListener() {
      this.filter_input.on("input", (event2) => {
        const filter = event2.target.value;
        console.log("filter : ", filter);
        this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter((pos) => {
          if (filter == "") {
            return true;
          } else if (filter == pos.status) {
            return true;
          } else {
            return false;
          }
        });
        if (this.filtered_pos_list.length == 0) {
          this.selected_pos = null;
        } else {
          this.selected_pos = this.filtered_pos_list[0];
        }
        this.refreshData();
      });
      this.deleteBtn.on("click", (event2) => {
        this.db.deletePosInvoice(
          this.selected_pos.name,
          (event3) => {
            this.filtered_pos_list = this.filtered_pos_list.filter((pos) => pos.name != this.selected_pos.name);
            if (this.filtered_pos_list.length > 0) {
              this.selected_pos = this.filtered_pos_list[0];
            } else {
              this.selected_pos = null;
            }
            this.refreshData();
          },
          (error) => {
            console.log("error on deleting the pos : ", error);
          }
        );
      });
      this.editBtn.on("click", (event2) => {
        this.on_click("edit", this.selected_pos);
      });
    }
    getSalesTaxes(pos) {
      const taxTemplateId = pos.taxes_and_charges;
      let salesTax = [];
      this.sales_taxes_and_charges.forEach((tax) => {
        if (tax.parent == taxTemplateId) {
          console.log("debuging ==> parent : ", tax.parent, " taxTemplateId : ", taxTemplateId);
          salesTax.push(tax);
        }
      });
      console.log("sales tax :=:=> ", salesTax);
      return salesTax;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_db.js
  pos_ar.PointOfSale.pos_db = class POSDatabase {
    constructor() {
      this.dbName = "POSDB_test8";
      this.dbVersion = 14;
      this.db = null;
      this.openDatabase();
    }
    openDatabase() {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = (event2) => {
        console.log(" there is an error : ", request.error);
      };
      request.onsuccess = (event2) => {
        this.db = event2.target.result;
        this.setupDatabase();
        console.log(" the db is opend successefully : ", event2.target.result);
      };
      request.onupgradeneeded = (event2) => {
        const db = event2.target.result;
        if (!db.objectStoreNames.contains("Customer")) {
          db.createObjectStore("Customer", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("Item Group")) {
          db.createObjectStore("Item Group", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("Item")) {
          db.createObjectStore("Item", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("Item Price")) {
          db.createObjectStore("Item Price", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("Price List")) {
          db.createObjectStore("Price List", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("Warehouse")) {
          db.createObjectStore("Warehouse", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("POS Profile")) {
          db.createObjectStore("POS Profile", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("Bin")) {
          db.createObjectStore("Bin", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("POS Invoice")) {
          const posInvoiceStore = db.createObjectStore("POS Invoice", { keyPath: "name" });
          posInvoiceStore.createIndex("docstatus", "docstatus", { unique: false });
        }
      };
    }
    setupDatabase() {
      this.db.onerror = (event2) => {
        var _a;
        console.error(`Database error: ${(_a = event2.target.error) == null ? void 0 : _a.message}`);
      };
    }
    savePosInvoice(posInvoice, onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const request = store.put(posInvoice);
      request.onsuccess = (event2) => {
        onSuccess(event2);
      };
      request.onerror = (event2) => {
        onFailure(event2);
      };
    }
    updatePosInvoice(posInvoice, onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const request = store.put(posInvoice);
      request.onsuccess = (event2) => {
        onSuccess(event2);
      };
      request.onerror = (event2) => {
        onFailure(event2);
      };
    }
    getAllPosInvoice(onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const result = store.getAll().onsuccess = (event2) => {
        const value = event2.target.result;
        onSuccess(value);
      };
    }
    getDraftPosInvoice(onSuccess, onFailure) {
      const transaction_posInvoice = this.db.transaction(["POS Invoice"], "readwrite");
      const store_posInvoice = transaction_posInvoice.objectStore("POS Invoice");
      const index_docstatus_posInvoice = store_posInvoice.index("docstatus");
      const request = index_docstatus_posInvoice.getAll(0);
      request.onsuccess = (event2) => {
        onSuccess(event2.target.result);
      };
      request.onerror = (event2) => {
        onFailure(event2);
      };
    }
    deletePosInvoice(invoiceName, onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const request = store.delete(invoiceName);
      request.onsuccess = (event2) => {
        onSuccess(event2);
      };
      request.onerror = (event2) => {
        onFailure(event2);
      };
    }
  };
})();
//# sourceMappingURL=pos.bundle.BOLG6SEC.js.map
