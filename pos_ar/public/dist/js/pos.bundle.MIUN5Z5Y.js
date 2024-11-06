(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

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
      this.warehouseList = [];
      this.PosProfileList = [];
      this.binList = [];
      this.selectedItemMaps = /* @__PURE__ */ new Map();
      this.selectedItem = { "name": "" };
      this.selectedField = { "field_name": "" };
      this.selectedTab = { "tabName": "" };
      this.selectedPaymentMethod = { "methodName": "" };
      this.defaultCustomer = { "name": "", "customer_name": "" };
      this.selectedPosProfile = { "name": "" };
      this.defaultPriceList = { "name": "" };
      this.taxes_and_charges_template = null;
      this.taxes_and_charges = [];
      this.POSOpeningEntry = {};
      this.invoiceData = { netTotal: 0, grandTotal: 0, paidAmount: 0, toChange: 0, discount: 0 };
      this.db = null;
      this.start_app();
    }
    async start_app() {
      try {
        this.db = await pos_ar.PointOfSale.pos_db.openDatabase();
        this.settings_data = new pos_ar.PointOfSale.posSettingsData(this.db);
        this.dataHandler = new pos_ar.PointOfSale.FetchHandler();
        this.appData = new pos_ar.PointOfSale.posAppData(this.db, this.dataHandler);
        this.prepare_container();
        await this.prepare_app_data();
        await this.checkForPOSEntry();
        await this.prepare_components();
        this.checkUnSyncedPos();
        this.setListeners();
      } catch (err) {
        console.error("halfware POS Err ==> ", err);
      }
    }
    async prepare_app_data() {
      try {
        this.customersList = await this.dataHandler.fetchCustomers();
        this.brandsList = await this.dataHandler.fetchBrands();
        this.itemGroupList = await this.dataHandler.fetchItemGroups();
        this.itemList = await this.dataHandler.fetchItems();
        this.itemPrices = await this.dataHandler.fetchItemPrice();
        this.priceLists = await this.dataHandler.fetchPriceList();
        this.warehouseList = await this.dataHandler.fetchWarehouseList();
        this.PosProfileList = await this.dataHandler.fetchPosProfileList();
        this.binList = await this.dataHandler.fetchBinList();
        await this.handleAppData();
        let new_pos_invoice = frappe.model.get_new_doc("POS Invoice");
        new_pos_invoice.customer = this.defaultCustomer.name;
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
        new_pos_invoice.priceList = this.defaultPriceList.name;
        new_pos_invoice.refNum = this.selectedPosProfile.name + "-0";
        this.selectedItemMaps.set("C1", new_pos_invoice);
        this.selectedTab.tabName = `C1`;
      } catch (err) {
        console.error("Hlafware POS Error ==> ", err);
        throw err;
      }
    }
    async handleAppData() {
      if (this.PosProfileList.length == 0) {
        frappe.set_route("Form", "POS Profile");
        throw new Error("there is no pos profile");
      }
      Object.assign(this.selectedPosProfile, this.PosProfileList[0]);
      if (this.selectedPosProfile.taxes_and_charges != null) {
        this.taxes_and_charges_template = await this.dataHandler.fetchSalesTaxesAndChargesTemplate(this.selectedPosProfile.taxes_and_charges);
        this.taxes_and_charges = this.taxes_and_charges_template.taxes;
      }
      if (this.selectedPosProfile.company != null && this.selectedPosProfile.company != "") {
        this.company = await this.dataHandler.fetchCompany(this.selectedPosProfile.company);
      }
      if (this.customersList.length > 0) {
        this.defaultCustomer = structuredClone(this.customersList[0]);
      } else {
        frappe.warn(
          "You dont have a customer",
          "please create a customer to continue",
          () => {
            frappe.set_route("Form", "Customer");
          },
          "Create",
          false
        );
        throw new Error("there is no customer");
      }
      if (this.priceLists.length > 0) {
        this.defaultPriceList.name = this.selectedPosProfile.selling_price_list;
      } else {
        frappe.warn(
          "You dont have a single price list",
          "please create a priceList to continue",
          () => {
            frappe.set_route("Form", "Price List");
          },
          "Create",
          false
        );
        throw new Error("there is no price list");
      }
    }
    prepare_container() {
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/selectorBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/checkInOutCart.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/itemDetailsCart.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/paymentMethodCart.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/customerBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/cartBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/historyCarts.css">');
      this.wrapper.append('<div id="MainContainer" class="rowBox"></div>');
      this.$components_wrapper = this.wrapper.find("#MainContainer");
    }
    prepare_components() {
      this.set_right_and_left_sections();
      this.init_item_selector();
      this.init_customer_box();
      this.init_selected_item();
      this.init_item_details();
      this.init_paymentCart();
      this.init_historyCart();
      this.init_checkInOutCart();
      this.init_settingsCart();
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
          !res.exc && me.prepare_app_data(res.message);
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
      this.item_selector = new pos_ar.PointOfSale.pos_item_selector(
        this.$leftSection,
        this.itemList,
        this.itemGroupList,
        this.itemPrices,
        this.defaultPriceList,
        this.getItemPrice.bind(this),
        (item) => {
          this.itemClick_selector(item);
        }
      );
    }
    init_customer_box() {
      this.customer_box = new pos_ar.PointOfSale.pos_customer_box(
        this.$rightSection,
        this.customersList,
        this.defaultCustomer,
        this.backHome.bind(this),
        this.onSync.bind(this),
        this.saveCheckInOut.bind(this),
        this.onMenuClick.bind(this)
      );
    }
    init_selected_item() {
      this.selected_item_cart = new pos_ar.PointOfSale.pos_selected_item_cart(
        this.$rightSection,
        this.settings_data,
        this.selectedItemMaps,
        this.priceLists,
        this.customersList,
        this.brandsList,
        this.taxes_and_charges,
        this.invoiceData,
        this.selectedTab,
        this.selectedItem,
        this.selectedField,
        this.getItemPrice.bind(this),
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
        this.selectedPosProfile,
        this.company,
        this.taxes_and_charges,
        this.historyCartClick.bind(this)
      );
    }
    init_checkInOutCart() {
      this.check_in_out_cart = new pos_ar.PointOfSale.pos_check_in_out(
        this.wrapper,
        this.db
      );
    }
    init_settingsCart() {
      this.settings_cart = new pos_ar.PointOfSale.pos_settings(
        this.wrapper,
        this.settings_data,
        this.PosProfileList,
        this.selectedPosProfile,
        this.onSettingsChange.bind(this)
      );
    }
    itemClick_selector(item) {
      const itemCloned = structuredClone(item);
      itemCloned.discount_amount = 0;
      itemCloned.discount_percentage = 0;
      this.addItemToPosInvoice(item);
      this.selected_item_cart.calculateNetTotal();
      this.selected_item_cart.calculateVAT();
      this.selected_item_cart.calculateQnatity();
      this.selected_item_cart.calculateGrandTotal();
      this.selected_item_cart.refreshSelectedItem();
    }
    onSelectedItemClick(item) {
      this.selectedItem = structuredClone(item);
      this.item_details.show_cart();
      this.selected_item_cart.showKeyboard();
      this.item_selector.hideCart();
      this.payment_cart.hideCart();
      this.settings_cart.hideCart();
      this.selected_item_cart.setKeyboardOrientation("landscape");
      this.item_details.refreshDate(item);
    }
    saveCheckInOut(checkInOut) {
      this.appData.saveCheckInOut(
        checkInOut,
        (res) => {
          this.check_in_out_cart.getAllCheckInOut();
        },
        (err) => {
          console.log("err to save checkInOut : ", err);
        }
      );
    }
    onSettingsChange(settingName) {
      if (settingName == "itemPriceBasedOn") {
        this.item_selector.refreshItemSelector();
      }
    }
    onCheckout() {
      if (this.checkIfRateZero(this.selectedItemMaps.get(this.selectedTab.tabName))) {
        frappe.throw("Item with rate equal 0");
        return;
      }
      this.selectedItemMaps.get(this.selectedTab.tabName).synced = false;
      this.appData.savePosInvoice(this.selectedItemMaps.get(this.selectedTab.tabName));
      this.payment_cart.showCart();
      this.item_selector.hideCart();
      this.item_details.hide_cart();
      this.settings_cart.hideCart();
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
      this.settings_cart.hideCart();
      this.selected_item_cart.setKeyboardOrientation("portrait");
      this.selected_item_cart.cleanHeighlight();
    }
    onClose_payment_cart() {
      this.item_selector.showCart();
      this.item_details.hide_cart();
      this.payment_cart.hideCart();
      this.selected_item_cart.hideKeyboard();
      this.settings_cart.hideCart();
      this.selected_item_cart.setKeyboardOrientation("portrait");
      this.selected_item_cart.cleanHeighlight();
    }
    onMenuClick(menu) {
      if (menu == "recent_pos") {
        this.history_cart.show_cart();
        this.customer_box.showHomeBar();
        this.payment_cart.hideCart();
        this.item_details.hide_cart();
        this.item_selector.hideCart();
        this.selected_item_cart.hideCart();
        this.customer_box.hideSyncBar();
        this.settings_cart.hideCart();
        this.check_in_out_cart.hideCart();
      } else if (menu == "close_pos") {
        this.onClosePOS();
      } else if (menu == "settings") {
        this.settings_cart.showCart();
        this.customer_box.showHomeBar();
        this.item_selector.hideCart();
        this.selected_item_cart.hideCart();
        this.item_details.hide_cart();
        this.payment_cart.hideCart();
        this.history_cart.hide_cart();
        this.check_in_out_cart.hideCart();
        this.customer_box.hideSyncBar();
      } else if (menu == "checkInOut") {
        this.check_in_out_cart.showCart();
        this.customer_box.showHomeBar();
        this.item_selector.hideCart();
        this.selected_item_cart.hideCart();
        this.item_details.hide_cart();
        this.payment_cart.hideCart();
        this.history_cart.hide_cart();
        this.settings_cart.hideCart();
        this.customer_box.hideSyncBar();
      }
    }
    backHome() {
      this.item_selector.showCart();
      this.customer_box.showSyncBar();
      this.selected_item_cart.showCart();
      this.payment_cart.hideCart();
      this.customer_box.hideHomeBar();
      this.item_details.hide_cart();
      this.history_cart.hide_cart();
      this.settings_cart.hideCart();
      this.check_in_out_cart.hideCart();
    }
    createNewTab(counter) {
      let new_pos_invoice = frappe.model.get_new_doc("POS Invoice");
      new_pos_invoice.customer = this.defaultCustomer.name;
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
      new_pos_invoice.priceList = this.defaultPriceList.name;
      this.selectedItemMaps.set(`C${counter}`, new_pos_invoice);
      this.selectedTab.tabName = `C${counter}`;
    }
    historyCartClick(event2, message) {
      if (event2 == "edit") {
        const tab = this.selected_item_cart.createTabForEditPOS();
        this.selectedItemMaps.set(`C${tab}`, message);
        this.selectedTab.tabName = `C${tab}`;
        this.item_selector.showCart();
        this.customer_box.showHomeBar();
        this.selected_item_cart.showCart();
        this.item_details.hide_cart();
        this.payment_cart.hideCart();
        this.history_cart.hide_cart();
        this.settings_cart.hideCart();
        this.selected_item_cart.refreshTabs();
        this.selected_item_cart.refreshSelectedItem();
      } else if (event2 == "return") {
        this.backHome();
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
        this.selected_item_cart.refreshSelectedItem();
        this.item_details.refreshDate(this.selectedItem);
      }
    }
    onKeyPressed(action, key) {
      var _a;
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
        } else if (this.selectedField.field_name == "cash") {
          this.payment_cart.deleteKeyPress();
        }
      } else if (action == "addToField") {
        if (this.selectedField.field_name == "cash") {
          this.payment_cart.handleInput(key);
        } else {
          if (this.selectedField.field_name == "quantity") {
            const newVal = this.selectedItem.qty + key;
            this.selectedItem.qty = parseFloat(newVal);
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
      if (this.defaultCustomer.name == "") {
        frappe.warn(
          "Customer didnt selected!",
          "you have to select a customer",
          () => {
          },
          "Done",
          false
        );
        return;
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
          "use_serial_batch_fields": 1,
          "cost_center": this.selectedPosProfile.cost_center,
          "discount_percentage": item.discount_percentage,
          "discount_amount": item.discount_amount,
          "warehouse": this.selectedPosProfile.warehouse,
          "income_account": this.selectedPosProfile.income_account
        };
        items.push(newItem);
      });
      this.selectedItemMaps.get(this.selectedTab.tabName).items = items;
      if (items.length == 0)
        return;
      this.selectedItemMaps.get(this.selectedTab.tabName).paid_amount = this.invoiceData.paidAmount;
      this.selectedItemMaps.get(this.selectedTab.tabName).base_paid_amount = this.invoiceData.paidAmount;
      this.selectedItemMaps.get(this.selectedTab.tabName).payments = [{ "mode_of_payment": "Cash", "amount": this.invoiceData.paidAmount }];
      this.selectedItemMaps.get(this.selectedTab.tabName).docstatus = 1;
      const status = this.checkIfPaid(this.selectedItemMaps.get(this.selectedTab.tabName));
      this.selectedItemMaps.get(this.selectedTab.tabName).status = status;
      const pos = structuredClone(this.selectedItemMaps.get(this.selectedTab.tabName));
      if (status == "Unpaid") {
        pos.synced = true;
        frappe.db.insert(
          pos
        ).then((r) => {
          this.appData.updatePosInvoice(pos);
        }).catch((err) => {
          console.log("cant push pos invoice : ", err);
        });
      } else {
        pos.synced = false;
        this.appData.updatePosInvoice(pos);
        this.unsyncedPos += 1;
        this.customer_box.setNotSynced(this.unsyncedPos);
      }
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
      if (this.unsyncedPos == 0) {
        frappe.msgprint({
          title: __("Sync Complete"),
          indicator: "green",
          message: __("All data is already synchronized.")
        });
        return;
      }
      let counter = 0;
      let failure = 0;
      let seccess = 0;
      this.appData.getNotSyncedPos(
        (allUnsyncedPos) => {
          frappe.show_progress("Syncing Invoices...", 0, allUnsyncedPos.length, "syncing");
          allUnsyncedPos.forEach((pos) => {
            frappe.db.insert(
              pos
            ).then((r) => {
              const updatedPos = structuredClone(pos);
              updatedPos.synced = true;
              this.appData.updatePosInvoice(updatedPos);
              counter += 1;
              frappe.show_progress("Syncing Invoices...", counter, allUnsyncedPos.length, "syncing");
              if (counter == allUnsyncedPos.length) {
                frappe.hide_progress();
                this.customer_box.setSynced();
                this.unsyncedPos = 0;
              }
            }).catch((err) => {
              counter += 1;
              failure += 1;
            });
          });
        },
        (err) => {
          console.log("cant get the unseced POS from local");
        }
      );
    }
    checkIfPaid(pos) {
      let netTotal = 0;
      let grandTotal = 0;
      let allTaxes = 0;
      let discount = 0;
      pos.items.forEach((item) => {
        netTotal += item.qty * item.rate;
      });
      this.taxes_and_charges.forEach((tax) => {
        allTaxes += tax.rate / 100 * netTotal;
      });
      discount = pos.additional_discount_percentage / 100 * netTotal;
      grandTotal = netTotal + allTaxes - discount;
      if (pos.paid_amount == 0) {
        return "Unpaid";
      } else if (pos.paid_amount < grandTotal) {
        return "Unpaid";
      } else {
        return "Paid";
      }
    }
    checkIfRateZero(pos) {
      return pos.items.some((item) => item.rate == 0);
    }
    onClosePOS() {
      if (this.unsyncedPos > 0) {
        frappe.throw(__(`you have ${all_tabs.length} invoice to sync first.`));
      }
      let voucher = frappe.model.get_new_doc("POS Closing Entry");
      voucher.pos_opening_entry = this.POSOpeningEntry.name;
      voucher.pos_profile = this.POSOpeningEntry.pos_profile;
      voucher.company = this.POSOpeningEntry.company;
      voucher.user = frappe.session.user;
      voucher.posting_date = frappe.datetime.now_date();
      voucher.posting_time = frappe.datetime.now_time();
      this.check_in_out_cart.checkList.forEach((check) => {
        let child = frappe.model.add_child(voucher, "check_in_out", "custom_check_in_out");
        child.check_type = check.check_type;
        child.creation_time = check.creation_time;
        child.amount = check.amount;
        child.reason = check.reason;
        child.user = check.owner;
      });
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
    getItemPrice(item, priceList) {
      const mode = this.settings_data.settings.itemPriceBasedOn;
      if (mode == "brand") {
        if (item.brand == null)
          return 0;
        const price = this.itemPrices.find((itemPrice2) => itemPrice2.brand == item.brand && itemPrice2.price_list == priceList);
        return price ? price.price_list_rate : 0;
      } else if (mode == "priceList") {
        const price = this.itemPrices.find((itemPrice2) => itemPrice2.item_code == item.item_name && itemPrice2.price_list == priceList);
        return price ? price.price_list_rate : 0;
      }
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
        navigator.serviceWorker.register("../assets/pos_ar/public/js/sw.js").then((reg) => console.log("Service Worker registered successfully.")).catch((err) => console.log(`Service Worker registration failed: ${err}`));
      }
    }
    checkUnSyncedPos() {
      this.appData.getNotSyncedPosNumber(
        (result) => {
          this.unsyncedPos = result;
          if (this.unsyncedPos == 0) {
            this.customer_box.setSynced(result);
          } else {
            this.customer_box.setNotSynced(result);
          }
        },
        (err) => {
          console.log(`error occured when check unSynced POS : ${err} `);
        }
      );
    }
    addItemToPosInvoice(clickedItem) {
      let clonedItem = {};
      Object.assign(clonedItem, clickedItem);
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
        clonedItem.rate = this.getItemPrice(clickedItem, this.selectedItemMaps.get(this.selectedTab.tabName).priceList);
        posItems.push(clonedItem);
      }
    }
    deleteItemFromPOsInvoice(itemId) {
      const posInvoice = this.selectedItemMaps.get(this.selectedTab.tabName);
      const posItems = posInvoice.items;
      posInvoice.items = posItems.filter((item) => item.name != itemId);
      this.selectedItem = structuredClone({ name: "" });
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
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_item_selector.js
  pos_ar.PointOfSale.pos_item_selector = class {
    constructor(wrapper, item_list, item_group_list, item_prices, selectedPriceList, getItemPrice, onItemClick) {
      this.wrapper = wrapper;
      this.item_list = item_list;
      this.item_group_list = item_group_list;
      this.item_prices = item_prices;
      this.selected_price_list = selectedPriceList;
      this.get_item_price = getItemPrice;
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
      this.inputBox.append('<input type="text" autocomplete="off"  maxlength="140" placeholder="Search by item code, item name or barcode" id="ItemInput" name="item" placeHolder="Enter the customer">');
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
    refreshItemSelector() {
      const seachField = document.getElementById("ItemInput");
      seachField.value = "";
      const groupItemListInput = document.getElementById("ItemGroupInput");
      this.setItemInFlow(this.getItemByItemGroup(groupItemListInput.value));
    }
    setItemInFlow(filtered_item_list) {
      const itemsContainer_html = document.getElementById("itemsContainer");
      itemsContainer_html.innerHTML = "";
      for (let i = 0; i < filtered_item_list.length && i < 800; i++) {
        let item = filtered_item_list[i];
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
        itemName.textContent = item.item_name;
        itemName.classList.add("itemTitle");
        itemBox.appendChild(itemName);
        const price = document.createElement("div");
        price.classList.add("itemPrice");
        price.textContent = this.get_item_price(item, this.selected_price_list.name) + " DA";
        itemBox.appendChild(price);
        itemsContainer_html.appendChild(itemBox);
      }
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
      const itemInput = document.getElementById("ItemInput");
      itemInput.addEventListener("input", (event2) => {
        this.setItemInFlow(this.filterListByItemData(event2.target.value));
      });
    }
    filterListByItemData(value) {
      return this.item_list.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()) || item.scan_barcode == value || item.item_name.toLowerCase().includes(value.toLowerCase()));
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
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_customer_box.js
  pos_ar.PointOfSale.pos_customer_box = class {
    constructor(wrapper, customersList, selectedCustomer, backHome, onSync, saveCheckInOut, onMenuClick) {
      this.wrapper = wrapper;
      this.customers_list = customersList;
      this.selected_customer = selectedCustomer;
      this.back_home = backHome;
      this.on_sync = onSync;
      this.on_menu_click = onMenuClick;
      this.save_check_in_out = saveCheckInOut;
      this.online = true;
      this.show_menu = false;
      this.start_work();
    }
    start_work() {
      this.prepare_customer_box();
      this.checkForSync();
      this.setListeners();
    }
    prepare_customer_box() {
      this.wrapper.append('<div id="ActionsContainerBox" class="rowBox align_center">');
      this.actionContainer = this.wrapper.find("#ActionsContainerBox");
      this.actionContainer.append('<div id="SyncBox"     class="rowBox centerItem" >');
      this.actionContainer.append('<div id="HomeBox"     class="rowBox centerItem"  style="display:none;">');
      this.actionContainer.append('<div id="exchangeBtn" class="rowBox centerItem" style="margin-right:16px;" >  <img src="/assets/pos_ar/images/exchange.png">  </div>');
      this.actionContainer.append('<div id="MenuBox"     class="rowBox centerItem">');
      this.sync_btn = this.actionContainer.find("#SyncBox");
      this.sync_btn.append('<div id="syncBoxContent"> Sync </div>');
      this.sync_btn_content = this.sync_btn.find("#syncBoxContent");
      this.exchange_btn = this.actionContainer.find("#exchangeBtn");
      this.home = this.actionContainer.find("#HomeBox");
      this.home.append('<img src="/assets/pos_ar/images/home.png" alt="Home" id="homeBoxIcon">');
      this.menu = this.actionContainer.find("#MenuBox");
      this.menu.append('<img src="/assets/pos_ar/images/menu.png" alt="Menu" id="MenuBtn" >');
      this.menu.append('<div id="menuItemsContainer"     class="columnBox">');
      this.menuItemsContainer = this.actionContainer.find("#menuItemsContainer");
      this.menuItemsContainer.append('<div id="posInvoiceMenuItem" class="menuItem">Recent POS Invoices</div>');
      this.menuItemsContainer.append('<div id="checkInOutMenuItem" class="menuItem">Check In/Out</div>');
      this.menuItemsContainer.append('<div id="closePosMenuItem"   class="menuItem">Close the POS</div>');
      this.menuItemsContainer.append('<div id="settingMenuItem"    class="menuItem">About</div>');
      this.pos_invoices = this.menuItemsContainer.find("#posInvoiceMenuItem");
      this.check_in_out = this.menuItemsContainer.find("#checkInOutMenuItem");
      this.close_pos = this.menuItemsContainer.find("#closePosMenuItem");
      this.setting = this.menuItemsContainer.find("#settingMenuItem");
      this.wrapper.append('<div id="darkFloatingBackground"></div>');
      this.dark_floating_background = this.wrapper.find("#darkFloatingBackground");
      this.wrapper.append('<div id="checkInOutDialog"></div>');
      this.check_in_out_dialog = this.wrapper.find("#checkInOutDialog");
      this.check_in_out_dialog.css("flex-direction", "column");
      this.check_in_out_dialog.append('<div id="checkTypeContainer"></div>');
      this.check_type_container = this.check_in_out_dialog.find("#checkTypeContainer");
      this.check_type_container.append('<div id="checkInType"  class="rowBox centerItem checkType selected "><div>Check In</div>  <img src=""></div>');
      this.check_type_container.append('<div id="checkOutType" class="rowBox centerItem checkType">  <div>Check Out</div>  <img src="">  </div>');
      this.check_in_box = this.check_type_container.find("#checkInType");
      this.check_out_box = this.check_type_container.find("#checkOutType");
      this.check_in_out_type = "In";
      this.check_in_out_dialog.append('<div class="inputGroup">  <input autocomplete="off" required="" type="number" id="check_in_out_input"><label for="name">Amount</label>   </div>');
      this.check_in_out_dialog.append('<div class="inputGroup">  <textarea type="text" id="check_in_out_note_textarea"></textarea><label for="name">Reason</label>   </div>');
      this.check_in_out_input = this.check_in_out_dialog.find("#check_in_out_input");
      this.check_in_out_note = this.check_in_out_dialog.find("#check_in_out_note_textarea");
      this.check_in_out_dialog.append('<div id="btnsContainers" class="rowBox"> <div id="cancelBtn" class="dialogBtn rowBox centerItem">Cancel</div><div id="confirmBtn" class="dialogBtn rowBox centerItem">Done</div> </div>');
      this.cancel_dialog_btn = this.check_in_out_dialog.find("#cancelBtn");
      this.confirm_dialog_btn = this.check_in_out_dialog.find("#confirmBtn");
    }
    showHomeBar() {
      this.home.css("display", "flex");
    }
    hideHomeBar() {
      this.home.css("display", "none");
    }
    showSyncBar() {
      this.sync_btn.css("display", "flex");
    }
    hideSyncBar() {
      this.sync_btn.css("display", "none");
    }
    showCheckInOutDialog() {
      this.check_in_out_dialog.css("display", "flex");
      this.dark_floating_background.css("display", "flex");
    }
    hideCheckInOutDialog() {
      this.checkAmount = 0;
      this.check_in_out_dialog.css("display", "none");
      this.dark_floating_background.css("display", "none");
      this.check_in_out_input.val(0);
    }
    checkForSync() {
      this.sync_btn.addClass("Synced");
    }
    setListeners() {
      this.sync_btn.on("click", (event2) => {
        frappe.confirm(
          "Are you sure you want to sync",
          () => {
            this.on_sync();
          },
          () => {
            return;
          }
        );
      });
      this.close_pos.on("click", (event2) => {
        this.on_menu_click("close_pos");
      });
      this.pos_invoices.on("click", (event2) => {
        this.on_menu_click("recent_pos");
      });
      this.setting.on("click", (event2) => {
        this.on_menu_click("settings");
      });
      this.check_in_out.on("click", (event2) => {
        this.on_menu_click("checkInOut");
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
      this.exchange_btn.on("click", (event2) => {
        this.showCheckInOutDialog();
      });
      this.dark_floating_background.on("click", (event2) => {
        this.hideCheckInOutDialog();
      });
      this.check_in_box.on("click", (event2) => {
        this.check_in_out_type = "In";
        this.check_in_box.css("border", "3px solid #ac6500");
        this.check_in_box.css("background", "#ffffff");
        this.check_out_box.css("border", "2px solid #e0e0e0");
        this.check_out_box.css("background", "#fafafa");
      });
      this.check_out_box.on("click", (event2) => {
        this.check_in_out_type = "Out";
        this.check_out_box.css("border", "3px solid #ac6500");
        this.check_out_box.css("background", "#ffffff");
        this.check_in_box.css("border", "2px solid #e0e0e0");
        this.check_in_box.css("background", "#fafafa");
      });
      this.check_in_out_input.on("input", (event2) => {
      });
      this.cancel_dialog_btn.on("click", (event2) => {
        console.log("cancel");
        this.hideCheckInOutDialog();
      });
      this.confirm_dialog_btn.on("click", (event2) => {
        const checkInOut = frappe.model.get_new_doc("check_in_out");
        checkInOut.creation_time = frappe.datetime.now_datetime();
        checkInOut.user = frappe.session.user;
        checkInOut.check_type = this.check_in_out_type;
        checkInOut.amount = parseFloat(this.check_in_out_input.val());
        checkInOut.reason = this.check_in_out_note.val();
        if (parseFloat(this.check_in_out_input.val()) <= 0 || this.check_in_out_note.val() == "") {
          frappe.msgprint("you should fulfilled fileds.");
          return;
        }
        this.save_check_in_out(checkInOut);
        this.hideCheckInOutDialog();
        console.log("checkInOut : ", checkInOut);
      });
    }
    setSynced() {
      this.sync_btn.addClass("Synced");
      this.sync_btn.removeClass("NotSynced");
      this.sync_btn_content.html(`Synced`);
    }
    setNotSynced(counter) {
      this.sync_btn.addClass("NotSynced");
      this.sync_btn.removeClass("Synced");
      this.sync_btn_content.html(`Sync (${counter})`);
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_selected_item_cart.js
  pos_ar.PointOfSale.pos_selected_item_cart = class {
    constructor(wrapper, settingsData, selectedItemMaps, priceLists, customerList, brandList, salesTaxes, invoiceData, selectedTab, selectedItem, selectedField, getItemPrice, onSelectedItemClick, onTabClick, onKeyPressed, createNewTab, onCheckoutClick) {
      this.wrapper = wrapper;
      this.settings_data = settingsData;
      this.selected_item_maps = selectedItemMaps;
      this.price_lists = priceLists;
      this.customer_list = customerList;
      this.brand_list = brandList;
      this.sales_taxes = salesTaxes;
      this.invoice_data = invoiceData;
      this.selected_tab = selectedTab;
      this.selected_item = selectedItem;
      this.selected_field = selectedField;
      this.get_item_price = getItemPrice;
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
      this.fulfillingSelects();
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
      this.cartTopBar.append('<div id="selectedCustomerInput"></div>');
      this.cartTopBar.append('<div id="selectedBrandInput"></div>');
      this.cartTopBar.append('<div id="selectedItemsPriceListInput"></div>');
      this.customerInputContainer = this.cartTopBar.find("#selectedCustomerInput");
      this.customerInputContainer.append('<select  id="customerInput"  placeHolder="Choice a customer">');
      this.customerInput = this.customerInputContainer.find("#customerInput");
      this.priceListInputContainer = this.cartTopBar.find("#selectedItemsPriceListInput");
      this.priceListInputContainer.append('<select  id="PriceListInput" name="PriceList" placeHolder="Choice a Price list">');
      this.priceListInput = this.priceListInputContainer.find("#PriceListInput");
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
    fulfillingSelects() {
      this.price_lists.forEach((priceList) => {
        this.priceListInput.append(`<option value="${priceList.name}">${priceList.price_list_name}</option>`);
      });
      this.customer_list.forEach((customer) => {
        this.customerInput.append(`<option value="${customer.name}">${customer.customer_name}</option>`);
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
      this.priceListInput.val(this.selected_item_maps.get(this.selected_tab.tabName).priceList);
      this.customerInput.val(this.selected_item_maps.get(this.selected_tab.tabName).customer);
      const selectedItemsContainer = document.getElementById("selectedItemsContainer");
      selectedItemsContainer.innerHTML = "";
      this.selected_item_maps.get(this.selected_tab.tabName).items.forEach((item) => {
        const itemElement = document.createElement("div");
        const leftGroup = document.createElement("div");
        const rightGroup = document.createElement("div");
        const itemName = document.createElement("h5");
        const itemQuantity = document.createElement("div");
        const itemPrice2 = document.createElement("div");
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
        itemPrice2.textContent = item.rate - item.discount_amount + " DA";
        itemPrice2.classList.add("itemPrice");
        rightGroup.appendChild(itemPrice2);
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
      if (this.tabs_container.find("div.tab").length >= 7) {
        return;
      }
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
      this.discountInput.on("input", (event2) => {
        if (event2.target.value == "") {
          this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage = 0;
          this.invoice_data.discount = 0;
          return;
        } else if (event2.target.value > 100) {
          this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage = 100;
          this.invoice_data.discount = 100;
          return;
        }
        this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage = parseFloat(event2.target.value);
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
      this.priceListInput.on("input", (event2) => {
        this.selected_item_maps.get(this.selected_tab.tabName).priceList = event2.target.value;
        this.resetItemRateBaseOnPriceList();
        this.refreshSelectedItem();
      });
      this.customerInput.on("input", (event2) => {
        this.selected_item_maps.get(this.selected_tab.tabName).customer = event2.target.value;
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
    resetItemRateBaseOnPriceList() {
      this.selected_item_maps.get(this.selected_tab.tabName).items.forEach((item) => {
        item.rate = this.get_item_price(item, this.selected_item_maps.get(this.selected_tab.tabName).priceList);
      });
      console.log("resting ==> ", this.selected_item_maps.get(this.selected_tab.tabName));
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
      const price = this.item_prices.find((itemPrice2) => itemPrice2.item_code == itemId);
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
      this.cart_content_top_section.append('<div id="paymentOnTimeBox" class="paymentMethodBox"  style="display:none;" ><div id="paymentOnTimeBoxTitle" class="title">On Time</div><input type="float" id="paymentOnTimeInput" value="0" ></div>');
      this.cart_content_top_section.append('<div id="redeemLoyaltyPoints" class="paymentMethodBox" style="display:none;" ><div id="redeemLoyaltyPointsTitle" class="title"">Redeem Loyalty Points</div><input type="float" id="RedeemLayoutPointsInput" value="0" disabled></div>');
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
    deleteKeyPress() {
      console.log("we are here in deleteKeyPress Cash!");
      let cashField = this.cashBox.find("#cachInput");
      let newValue = 0;
      let cursor = cashField[0].selectionStart;
      cashField.val((index, currentValue) => {
        if (currentValue.length < 0) {
          console.log("cnd 1");
          newValue = 0;
          return 0;
        } else if (currentValue.length == 1) {
          console.log("cnd 2");
          newValue = 0;
          return 0;
        } else if (cursor == 0) {
          console.log("cnd 3");
          newValue = currentValue;
          return currentValue;
        } else if (cursor == currentValue.length) {
          console.log("cnd 4");
          newValue = currentValue.slice(0, cursor - 1);
          return currentValue.slice(0, cursor - 1);
        } else {
          console.log("cursor : ", cursor, " current val ==> ", currentValue, " cnd 5 newValue ==> ", currentValue.slice(0, cursor - 1) + currentValue.slice(cursor));
          newValue = currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
          return currentValue.slice(0, cursor - 1) + currentValue.slice(cursor);
        }
      });
      console.log("we are in newValue ==> ", newValue);
      this.invoice_data.paidAmount = newValue;
      setTimeout(() => {
        cashField[0].setSelectionRange(cursor - 1, cursor - 1);
        cashField[0].focus();
      }, 0);
      this.refreshData();
    }
    calculateGrandTotal() {
      this.payment_details.find("#paymentGrandTotalValue").text(`${this.invoice_data.grandTotal.toFixed(2)} DA`);
      this.generateProposedPaidAmount(this.invoice_data.grandTotal);
    }
    calculateToChange() {
      this.invoice_data.toChange = this.invoice_data.paidAmount - this.invoice_data.grandTotal;
      this.payment_details.find("#paimentToChangeValue").text(`${this.invoice_data.toChange.toFixed(2)} DA`);
    }
    refreshPaidAmount() {
      this.payment_details.find("#paimentPaidAmountValue").text(`${this.invoice_data.paidAmount} DA`);
      const paid_amount_DA = this.payment_details.find("#paimentPaidAmountValue").text();
      const paid_amount_txt = paid_amount_DA.slice(0, -2);
      const paid_amount = parseFloat(paid_amount_txt);
      this.invoice_data.paidAmount = paid_amount;
    }
    generateProposedPaidAmount(total) {
      const money = [10, 20, 50, 100, 200, 500, 1e3, 2e3];
      let counter = 0;
      let pointer = 7;
      while (counter < total) {
        counter += money[pointer];
      }
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_history.js
  pos_ar.PointOfSale.pos_history = class {
    constructor(wrapper, db, selectedPosProfile, company, salesTaxes, onClick) {
      this.wrapper = wrapper;
      this.db = db;
      this.selected_pos_profile = selectedPosProfile;
      this.company = company;
      this.sales_taxes = salesTaxes;
      this.on_click = onClick;
      console.log("here we are debuging : ", company);
      this.localPosInvoice = { lastTime: null, pos_invoices: [] };
      this.filter = "";
      this.filtered_pos_list = [];
      this.selected_pos = null;
      this.start_work();
    }
    async start_work() {
      this.prepare_history_cart();
      const result = await this.db.getAllPosInvoice();
      console.log("the db data ", result);
      this.localPosInvoice.pos_invoices = result;
      this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter((pos) => {
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
      this.setListener();
    }
    prepare_history_cart() {
      this.wrapper.find("#LeftSection").append('<div id="historyLeftContainer" class="columnBox"></div>');
      this.wrapper.find("#RightSection").append('<div id="historyRightContainer" class="columnBox"></div>');
      this.left_container = this.wrapper.find("#historyLeftContainer");
      this.right_container = this.wrapper.find("#historyRightContainer");
      this.left_container.append('<div id="PosContentHeader" class="rowBox" ><div class="c1 columnBox"><div id="posCustomer">Customer</div><div id="posSoldBy"></div></div><div class="c2 columnBox"><div id="posCost">0,0000 DA</div><div id="posId">ACC-PSINV-2024-ID</div><div id="posStatus">POS Status</div></div></div>');
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
      this.right_container.append(`<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4><img src="${this.company.company_logo}" style="width:30px;height:30px;"></div>`);
      this.right_container.append('<div id="historyRightSearchContainer" class="rowBox align_center" ></div>');
      this.search_container = this.right_container.find("#historyRightSearchContainer");
      this.search_container.append('<select  id="PosInvoiceTypeInput" placeholder="POS Invoice Type">');
      this.filter_input = this.search_container.find("#PosInvoiceTypeInput");
      this.filter_input.append('<option value="Draft">Draft</option><option value="Paid">Paid</option> <option value="Unpaid">Unpaid</option>');
      this.search_container.append('<input type="text" id="historyInput" placeholder="Search by invoice id or custumer name">');
      this.right_container.append('<div id="historyRecentInvoicesContainer" ></div>');
      this.right_data_container = this.right_container.find("#historyRecentInvoicesContainer");
    }
    refreshData() {
      this.right_data_container.html("");
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
      let allTax = 0;
      if (this.selected_pos.taxes_and_charges != "" && this.selected_pos.taxes_and_charges != null) {
        this.sales_taxes.forEach((tax) => {
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
      this.db.getAllPosInvoice_callback(
        (result) => {
          console.log("look at the result : ", result);
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
        this.db.deletePosInvoice_callback(
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
      this.returnBtn.on("click", (event2) => {
        this.on_click("return", null);
      });
      this.printBtn.on("click", (event2) => {
        this.print_receipt();
      });
    }
    print_receipt() {
      console.log("debuging : ", this.selected_pos);
      let netTotal = 0;
      let taxes = 0;
      let grandTotal = 0;
      const creation_time = this.selected_pos.creation_time;
      const [date, time] = creation_time.split(" ");
      let invoiceHTML = `<style>#company_container {width: 100% ; height: 40px ; display:flex; align-items:center; font-size : 12px;}table{border: 1px solid #505050; border-spacing:0px;width: 100%; margin-top:16px;}tr{width:100%; height:16px;}tr:nth-child(1){background:#eeeeee;}th{border-right:1px solid #505050;border-bottom:1px solid #505050;border-top:1px solid #505050;font-weight : 500;}td{border-right:1px solid #505050;}#logContainer{width: 100%;height:80px;display : flex;justify-content:center;}#logContainer img{width:50%; height:100%;}#top_data_container{width:100%;display:flex;}#top_data_container>div{width:50%;}#top_data_container>div.c2{display:flex;flex-direction:column;align-items:end;}td>div{height:18px; width:100%;font-size:12px;display:flex; justify-content:center; align-items:center;}#footer_message{height:20px;}</style><div style="display:flex; flex-direction:column;"><div id="logContainer"  ><div style="width:20%;"></div><img src="${this.company.company_logo}"><div style="width:20%;"></div></div><div id="company_container"><div style="flex-grow:1; border-bottom:1px dashed #505050; border-top:1px dashed #505050; "></div><p style="margin:0px 25px;">${this.company.company_name}</p><div style="flex-grow:1; border-bottom:1px dashed #505050; border-top:1px dashed #505050;"></div></div><div id="top_data_container"><div class="c1"><div class="customer"> Customer : ${this.selected_pos.customer} </div><div class="refrence"> Commande : ${this.selected_pos.refNum} </div></div><div class="c2"><div class="date"> ${date} </div><div class="time"> ${time} </div></div></div><table><tr><th>Nom</th><th>Qt\xE9</th><th>P.unit\xE9</th><th>Prix</th>`;
      this.selected_pos.items.forEach((item) => {
        netTotal += item.rate * item.qty;
        invoiceHTML += `<tr> <td><div>${item.item_name}</div></td>  <td><div>${item.qty}</div></td>  <td><div>${item.rate}</div></td>  <td><div>${item.rate * item.qty}</div></td></tr>`;
      });
      invoiceHTML += "</table>";
      invoiceHTML += `<div style="height:23px;"> <p style="font-size:16px;font-weight:500;" ><span style="font-size:16px;font-weight:600;">Sous-total : </span> ${netTotal} DA </p> </div>`;
      invoiceHTML += `<div style="height:23px;"> <p style="font-size:16px;font-weight:500;" ><span style="font-size:16px;font-weight:600;">Reduction : </span> ${this.selected_pos.additional_discount_percentage * netTotal} DA </p> </div>`;
      this.sales_taxes.forEach((tax) => {
        taxes += tax.rate;
        invoiceHTML += `<div style="height:23px;"> <p style="font-size:16px;font-weight:500;" ><span style="font-size:16px;font-weight:600;">${tax.description} : </span> ${tax.rate} % </p> </div>`;
      });
      invoiceHTML += `<div style="height:23px;"> <p style="font-size:16px;font-weight:500;" ><span style="font-size:16px;font-weight:700;">Total : </span> ${netTotal + netTotal * (taxes / 100) - this.selected_pos.additional_discount_percentage * netTotal} DA </p> </div>`;
      invoiceHTML += '<div id="footer_message" style="width:100%; display:flex; align-items:center; margin-top:30px;"><div style="flex-grow:1; border-bottom:2px dashed #505050;"></div><div style="margin:30px 25px;"> Thank You, Come Again</div><div style="flex-grow:1;border-bottom:2px dashed #505050;"></div></div>';
      invoiceHTML += "</div>";
      const printWindow = window.open("", "_blank");
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_db.js
  pos_ar.PointOfSale.pos_db = class POSDatabase {
    constructor(db) {
      this.db = db;
      this.setupDatabase();
    }
    static async openDatabase() {
      return new Promise((resolve, reject) => {
        const request2 = window.indexedDB.open("POSDB_test29", 1);
        request2.onerror = (event2) => {
          reject(request2.error);
        };
        request2.onsuccess = (event2) => {
          resolve(new pos_ar.PointOfSale.pos_db(event2.target.result));
        };
        request2.onupgradeneeded = (event2) => {
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
          if (!db.objectStoreNames.contains("check_in_out")) {
            db.createObjectStore("check_in_out", { keyPath: "name" });
          }
          if (!db.objectStoreNames.contains("POS Settings")) {
            db.createObjectStore("POS Settings", { keyPath: "id" });
          }
        };
      });
    }
    setupDatabase() {
      this.db.onerror = (event2) => {
        var _a;
        console.error(`Database error: ${(_a = event2.target.error) == null ? void 0 : _a.message}`);
      };
    }
    saveItemList(itemList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Item"], "readwrite");
        const store = transaction.objectStore("Item");
        itemList.forEach((item) => {
          const request2 = store.put(item);
          request2.onerror = (err) => {
            console.error("db => error saving Item : ", item, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (err) => {
          console.error("db => error saving Item.");
          reject(err);
        };
      });
    }
    getAllItems() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Item"], "readwrite");
        const store = transaction.objectStore("Item");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    savePosProfileList(posProfileList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Profile"], "readwrite");
        const store = transaction.objectStore("POS Profile");
        posProfileList.forEach((posProfile) => {
          const request2 = store.put(posProfile);
          request2.onerror = (err) => {
            console.error("db => error saving POS Profile : ", posProfile, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (err) => {
          console.error("db => error saving POS Profile.");
          reject(err);
        };
      });
    }
    getAllPosProfile() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Profile"], "readwrite");
        const store = transaction.objectStore("POS Profile");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          const value = event.target.result;
          reject(value);
        };
      });
    }
    saveBinList(binList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Bin"], "readwrite");
        const store = transaction.objectStore("Bin");
        binList.forEach((bin) => {
          const request2 = store.put(bin);
          request2.onerror = (err) => {
            console.error("db => error saving Bin : ", bin, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (err) => {
          console.error("db => error saving Bin.");
          reject(err);
        };
      });
    }
    getAllBin() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Bin"], "readwrite");
        const store = transaction.objectStore("Bin");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    saveWarehouseList(warehouseList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Warehouse"], "readwrite");
        const store = transaction.objectStore("Warehouse");
        warehousesList.forEach((warehouse) => {
          const request2 = store.put(warehouse);
          request2.onerror = (err) => {
            console.error("db => error saving Warehouse : ", warehouse, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (event2) => {
          console.error("db => error saving Warehouse List.");
          reject(event2);
        };
      });
    }
    getAllWarehouse() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Warehouse"], "readwrite");
        const store = transaction.objectStore("Warehouse");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    savePriceLists(priceLists) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Price List"], "readwrite");
        const store = transaction.objectStore("Price List");
        priceLists.forEach((priceList) => {
          const request2 = store.put(priceList);
          request2.onerror = (err) => {
            console.error("db => error saving Price List : ", itemPrice, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (err) => {
          console.error("db => error saving Price Lists.");
          reject(err);
        };
      });
    }
    getAllPriceList() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Price List"], "readwrite");
        const store = transaction.objectStore("Price List");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    saveItemPriceList(itemPriceList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Item Price"], "readwrite");
        const store = transaction.objectStore("Item Price");
        itemPriceList.forEach((itemPrice2) => {
          const request2 = store.put(itemPrice2);
          request2.onerror = (err) => {
            console.error("db => error saving Item Price : ", itemPrice2, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (err) => {
          console.error("db => error saving Item Price.");
          reject(err);
        };
      });
    }
    getAllItemPrice() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Item Price"], "readwrite");
        const store = transaction.objectStore("Item Price");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    saveItemGroupList(itemGroupList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Item Group"], "readwrite");
        const store = transaction.objectStore("Item Group");
        itemGroupList.forEach((itemGroup) => {
          const request2 = store.put(itemGroup);
          request2.onerror = (err) => {
            reject(err);
            console.error("db => error saving Item Group : ", itemGroup, "err : ", err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (err) => {
          console.error("db => error saving Item Group.");
          reject(err);
        };
      });
    }
    getAllItemGroup() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Item Group"], "readwrite");
        const store = transaction.objectStore("Item Group");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    saveCustomerList(customerList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Customer"], "readonly");
        const store = transaction.objectStore("Customer");
        customerList.forEach((customer) => {
          const request2 = store.put(customer);
          request2.onerror = (err) => {
            console.error("db => error saving customer : ", customer, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        request.onerror = (event2) => {
          console.error("db => error saving customer.");
          reject(event2);
        };
      });
    }
    getAllCustomers() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Customer"], "readonly");
        const store = transaction.objectStore("Customer");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (value) => {
          console.error("error when getting customer from db");
          reject(event);
        };
      });
    }
    savePosInvoice(posInvoice) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const request2 = store.put(posInvoice);
        request2.onsuccess = (event2) => {
          resolve(event2);
        };
        request2.onerror = (event2) => {
          reject(event2);
        };
      });
    }
    updatePosInvoice(posInvoice) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const request2 = store.put(posInvoice);
        request2.onsuccess = (event2) => {
          resolve(event2.target.result);
        };
        request2.onerror = (event2) => {
          reject(event2);
        };
      });
    }
    getAllPosInvoice() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    getAllPosInvoice_callback(onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const result = store.getAll();
      result.onsuccess = (event2) => {
        const value = event2.target.result;
        onSuccess(value);
      };
      result.onerror = (err) => {
        onFailure(err);
      };
    }
    getDraftPosInvoice() {
      return new Promise((resolve, reject) => {
        const transaction_posInvoice = this.db.transaction(["POS Invoice"], "readwrite");
        const store_posInvoice = transaction_posInvoice.objectStore("POS Invoice");
        const index_docstatus_posInvoice = store_posInvoice.index("docstatus");
        const request2 = index_docstatus_posInvoice.getAll(0);
        request2.onsuccess = (event2) => {
          resolve(event2.target.result);
        };
        request2.onerror = (err) => {
          reject(err);
        };
      });
    }
    getNotSyncedPosNumber(onSuccess, onFailure) {
      const transaction_posInvoice = this.db.transaction(["POS Invoice"], "readwrite");
      const store_posInvoice = transaction_posInvoice.objectStore("POS Invoice");
      const index_docstatus_posInvoice = store_posInvoice.index("docstatus");
      const request2 = index_docstatus_posInvoice.getAll(1);
      request2.onsuccess = (result) => {
        const filtredResult = result.target.result.filter((invoice) => invoice.synced == false);
        onSuccess(filtredResult.length);
      };
      request2.onerror = (err) => {
        onFailure(err);
      };
    }
    getNotSyncedPos(onSuccess, onFailure) {
      const transaction_posInvoice = this.db.transaction(["POS Invoice"], "readwrite");
      const store_posInvoice = transaction_posInvoice.objectStore("POS Invoice");
      const index_docstatus_posInvoice = store_posInvoice.index("docstatus");
      const request2 = index_docstatus_posInvoice.getAll(1);
      request2.onsuccess = (result) => {
        const filtredResult = result.target.result.filter((invoice) => invoice.synced == false);
        onSuccess(filtredResult);
      };
      request2.onerror = (err) => {
        onFailure(err);
      };
    }
    deletePosInvoice(invoiceName) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const request2 = store.delete(invoiceName);
        request2.onsuccess = () => {
          resolve();
        };
        request2.onerror = (err) => {
          reject(err);
        };
      });
    }
    deletePosInvoice_callback(invoiceName, onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const request2 = store.delete(invoiceName);
      request2.onsuccess = () => {
        onSuccess();
      };
      request2.onerror = (err) => {
        onFailure(err);
      };
    }
    deleteAllPosInvoice() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const request2 = store.clear();
        request2.onsuccess = () => {
          resolve();
        };
        request2.onerror = (err) => {
          reject(err);
        };
      });
    }
    saveCheckInOut(checkInOut, onSuccess, onFailure) {
      const transaction = this.db.transaction(["check_in_out"], "readwrite");
      const store = transaction.objectStore("check_in_out");
      const request2 = store.put(checkInOut);
      request2.onsuccess = (event2) => {
        onSuccess(event2.target.result);
      };
      request2.onerror = (err) => {
        onFailure(err);
      };
    }
    getAllCheckInOut() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["check_in_out"], "readwrite");
        const store = transaction.objectStore("check_in_out");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value);
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    getAllCheckInOut_callback(onSuccess, onFailure) {
      const transaction = this.db.transaction(["check_in_out"], "readwrite");
      const store = transaction.objectStore("check_in_out");
      const result = store.getAll();
      result.onsuccess = (event2) => {
        const value = event2.target.result;
        onSuccess(value);
      };
      result.onerror = (err) => {
        onFailure(err);
      };
    }
    deleteAllCheckInOut() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["check_in_out"], "readwrite");
        const store = transaction.objectStore("check_in_out");
        const request2 = store.clear();
        request2.onsuccess = () => {
          resolve();
        };
        request2.onerror = (err) => {
          reject(err);
        };
      });
    }
    updateSettings(settings) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Settings"], "readwrite");
        const store = transaction.objectStore("POS Settings");
        const request2 = store.put(__spreadValues({ id: 1 }, settings));
        request2.onsuccess = (event2) => {
          resolve(event2.target.result);
        };
        request2.onerror = (err) => {
          reject(err);
        };
      });
    }
    getSettings(onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Settings"], "readwrite");
      const store = transaction.objectStore("POS Settings");
      const request2 = store.get(1);
      request2.onsuccess = (event2) => {
        onSuccess(event2.target.result);
      };
      request2.onerror = (err) => {
        onFailure(err);
      };
    }
    deleteAllSettings() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Settings"], "readwrite");
        const store = transaction.objectStore("POS Settings");
        const request2 = store.clear();
        request2.onsuccess = () => {
          resolve();
        };
        request2.onerror = (err) => {
          reject(err);
        };
      });
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_settings.js
  pos_ar.PointOfSale.pos_settings = class {
    constructor(wrapper, settingsData, posProfileList, selectedPosProfile, onSettingsChange) {
      this.wrapper = wrapper;
      this.settings_data = settingsData;
      this.pos_profile_list = posProfileList;
      this.selected_pos_profile = selectedPosProfile;
      this.on_settings_change = onSettingsChange;
      this.scene = "pos_profile";
      this.start_work();
    }
    start_work() {
      this.prepareSettingsCart();
      this.refreshLeftSection();
      this.setListener();
    }
    prepareSettingsCart() {
      this.wrapper.find("#RightSection").append('<div id="settingsRightContainer" class="columnBox"></div>');
      this.wrapper.find("#LeftSection").append('<div id="settingsLeftContainer" class="columnBox"></div>');
      this.leftContainer = this.wrapper.find("#settingsLeftContainer");
      this.rightContainer = this.wrapper.find("#settingsRightContainer");
      this.rightContainer.append('<div id="pos_profile_btn"      class="settings_tab active" >POS Profile</div>');
      this.rightContainer.append('<div id="general_settings_btn" class="settings_tab"        >Generale Settings</div>');
      this.rightContainer.append('<div id="about_us_btn"         class="settings_tab"        >About Us</div>');
      this.pos_profile_btn = this.rightContainer.find("#pos_profile_btn");
      this.general_settings_btn = this.rightContainer.find("#general_settings_btn");
      this.about_us_btn = this.rightContainer.find("#about_us_btn");
    }
    refreshLeftSection() {
      this.leftContainer.html("");
      if (this.scene == "pos_profile") {
        this.refreshPosProfileScene();
      } else if (this.scene == "general_settings") {
        this.refreshGeneralSettings();
      } else if (this.scene == "about_us") {
        this.refreshAboutUs();
      }
    }
    refreshPosProfileScene() {
      this.leftContainer.addClass("columnBox");
      this.leftContainer.append('<h4 class="CartTitle" style="margin-bottom:35px; font-size:35px;" >POS Profile</h4>');
      this.leftContainer.append('<div id="settingsCartContentsContainer">  </div>');
      this.contentsContainer = this.leftContainer.find("#settingsCartContentsContainer");
      this.contentsContainer.append('<div id="posProfileContent" class="contentContainer rowBox" style="width:100%;"> <div class="c1 columnBox"></div>   <div class="c2 columnBox"></div> </div>');
      this.pos_profile_content = this.contentsContainer.find("#posProfileContent");
      this.c1 = this.pos_profile_content.find("div.c1");
      this.c2 = this.pos_profile_content.find("div.c2");
      this.c1.append('<label for="pos_profile"> POS Profile </label>');
      this.c1.append('<select  name="pos_profile" id="posProfileSelect" disabled ></select>');
      this.pos_profile_select = this.c1.find("#posProfileSelect");
      this.pos_profile_list.forEach((posProfile) => {
        if (posProfile.name == this.selected_pos_profile.name) {
          this.pos_profile_select.append(`<option value="${posProfile.name}">${posProfile.name}</option>`);
        } else {
          this.pos_profile_select.append(`<option value="${posProfile.name}" selected >${posProfile.name}</option>`);
        }
      });
      this.c1.append(`<label for="warehouse">POS Warehouse</label>`);
      this.c1.append(`<input name="warehouse" value="${this.selected_pos_profile.warehouse}" disabled>`);
      this.c1.append(`<label for="income_account">POS income account</label>`);
      this.c1.append(`<input name="income_account" value="${this.selected_pos_profile.income_account}" disabled>`);
      this.c2.append(`<label for="write_off_account">POS write off account</label>`);
      this.c2.append(`<input name="write_off_account" value="${this.selected_pos_profile.write_off_account}" disabled>`);
      this.c2.append(`<label for="write_off_cost_center">POS write off cost center</label>`);
      this.c2.append(`<input name="write_off_cost_center" value="${this.selected_pos_profile.write_off_cost_center}" disabled>`);
      this.c2.append(`<label for="taxes_and_charges">POS taxes and charges</label>`);
      this.c2.append(`<input name="taxes_and_charges" value="${this.selected_pos_profile.taxes_and_charges}" disabled>`);
    }
    refreshGeneralSettings() {
      const priceBase = this.settings_data.settings.itemPriceBasedOn;
      this.leftContainer.addClass("columnBox");
      this.leftContainer.append('<h4 class="CartTitle" style="margin-bottom:35px; font-size:35px;" >General Settings</h4>');
      this.leftContainer.append('<div id="settingsCartContentsContainer">  </div>');
      this.contentsContainer = this.leftContainer.find("#settingsCartContentsContainer");
      this.contentsContainer.append('<div id="generalSettingsContent" class="contentContainer rowBox" style="width:100%;"> <div class="c1 columnBox"></div>   <div class="c2 columnBox"></div> </div>');
      this.general_settings_content = this.contentsContainer.find("#generalSettingsContent");
      this.general_settings_c1 = this.general_settings_content.find("div.c1");
      this.general_settings_c2 = this.general_settings_content.find("div.c2");
      this.general_settings_c1.append('<label for="priceBasedOn"> Item Price Based On : </label>');
      this.general_settings_c1.append('<select  name="priceBasedOn" id="priceBasedOnSelect" ></select>');
      this.item_price_based_on_select = this.general_settings_c1.find("#priceBasedOnSelect");
      this.settings_data.getAllPriceBases().forEach((base) => {
        if (this.settings_data.settings.itemPriceBasedOn == base) {
          this.item_price_based_on_select.append(`<option value="${base}" selected> ${base} </option>`);
        } else {
          this.item_price_based_on_select.append(`<option value="${base}"> ${base} </option>`);
        }
      });
      this.item_price_based_on_select.on("input", (event2) => {
        this.settings_data.setPriceItemBasedOn(
          event2.target.value,
          () => {
            this.on_settings_change("itemPriceBasedOn");
          },
          () => {
            console.error("error to affect the ui by the settings changes (settings.js)");
          }
        );
      });
    }
    refreshAboutUs() {
      this.leftContainer.addClass("columnBox");
      this.leftContainer.append('<h4 class="CartTitle" style="margin-bottom:35px; font-size:35px;" >About Us</h4>');
      this.leftContainer.append('<div id="settingsCartContentsContainer">  </div>');
      this.contentsContainer = this.leftContainer.find("#settingsCartContentsContainer");
    }
    showCart() {
      this.rightContainer.css("display", "flex");
      this.leftContainer.css("display", "flex");
    }
    hideCart() {
      this.rightContainer.css("display", "none");
      this.leftContainer.css("display", "none");
    }
    setListener() {
      const tabs = document.querySelectorAll(".settings_tab");
      const all_content = document.querySelectorAll(".contentContainer");
      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
          tabs.forEach((tab2) => {
            tab2.classList.remove("active");
          });
          tab.classList.add("active");
        });
      });
      this.pos_profile_btn.on("click", (event2) => {
        this.scene = "pos_profile";
        this.refreshLeftSection();
      });
      this.general_settings_btn.on("click", (event2) => {
        this.scene = "general_settings";
        this.refreshLeftSection();
      });
      this.about_us_btn.on("click", (event2) => {
        this.scene = "about_us";
        this.refreshLeftSection();
      });
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_check_in_out.js
  pos_ar.PointOfSale.pos_check_in_out = class {
    constructor(wrapper, db) {
      this.wrapper = wrapper;
      this.db = db;
      this.checkList = [];
      this.filter = "All";
      this.selectedCheckInOut = null;
      this.start_work();
    }
    start_work() {
      this.prepare_checkInOut_cart();
      this.getAllCheckInOut();
      this.setListeners();
    }
    prepare_checkInOut_cart() {
      this.wrapper.find("#LeftSection").append('<div id="checkInOutLeftContainer" class="columnBox"></div>');
      this.wrapper.find("#RightSection").append('<div id="checkInOutRightContainer" class="columnBox"></div>');
      this.left_container = this.wrapper.find("#checkInOutLeftContainer");
      this.right_container = this.wrapper.find("#checkInOutRightContainer");
      this.right_container.append('<div id="checkInOutTabContainer" class="rowBox">  <div id="tabAll" class="tab selected">All</div> <div id="tabCheckIn" class="tab">Check In</div> <div id="tabCheckOut" class="tab">Check Out</div>  </div>');
      this.tab_container = this.right_container.find("#checkInOutTabContainer");
      this.tab_all = this.tab_container.find("#tabAll");
      this.tab_in = this.tab_container.find("#tabCheckIn");
      this.tab_out = this.tab_container.find("#tabCheckOut");
      this.right_container.append('<div id="checkInOutList" class="columnBox"></div>');
      this.check_in_out_list = this.right_container.find("#checkInOutList");
      const header = '<div id="detailsCheckInOutHeader" class="rowBox" ><div class="checkInAmount columnBox" ><div class="rowBox centerItem" style="width:100%;height:50%;"><div style="font-size:25px; font-weight:700;">Check In</div></div><div id="TotalCheckInValue" class="rowBox centerItem" style="height:50%; width:100%;">...DA</div></div><div class="checkOutAmount columnBox" ><div class="rowBox centerItem" style="width:100%;height:50%;" ><div style="font-size:25px; font-weight:700;">Check Out</div></div><div id="TotalCheckOutValue" class="rowBox centerItem" style="width:100%;height:50%;"> ...DA </div></div><div class="totalCheckInOutAmount columnBox centerItem"><div class="rowBox centerItem" style="width:100%;height:50%;"><div style="font-size:25px; font-weight:700;">Total</div></div><div id="TotalCheckInOutValue" class="rowBox centerItem" style="height:50%; width:100%;">...DA</div></div></div>';
      this.left_container.append(header);
      this.details_checkInOut_header = this.left_container.find("#detailsCheckInOutHeader");
      this.check_in_amount = this.details_checkInOut_header.find("#TotalCheckInValue");
      this.check_out_amount = this.details_checkInOut_header.find("#TotalCheckOutValue");
      this.check_total_in_out_amount = this.details_checkInOut_header.find("#TotalCheckInOutValue");
      this.left_container.append('<div id="detailsCheckInOutContent" class="columnBox"></div>');
      this.detailsCheckInOutContent = this.left_container.find("#detailsCheckInOutContent");
      const details = '<div class="l1 rowBox"><div><span class="key">Check Type :<span> <span id="selectedCheckInOutType" class="value"> THE_TYPE </span></div><div><span class="value" id="selectedCheckInOutCreationTime"> THE_DATE </span></div></div><div class="l2 rowBox"><div><span class="key">Amount :</span> <span id="selectedCheckInOutAmount" class="value">THE AMOUNT</span></div><div><span id="selectedCheckInOutOwner" class="value">THE OWNER</span></div></div><div class="l3"><div class="title">Reason</div><textarea id="selectedCheckInOutReason" disabled ></textarea></div>';
      this.detailsCheckInOutContent.append(details);
      this.checkType = this.detailsCheckInOutContent.find("#selectedCheckInOutType");
      this.checkAmount = this.detailsCheckInOutContent.find("#selectedCheckInOutAmount");
      this.checkCreationTime = this.detailsCheckInOutContent.find("#selectedCheckInOutCreationTime");
      this.checkOwner = this.detailsCheckInOutContent.find("#selectedCheckInOutOwner");
      this.checkReason = this.detailsCheckInOutContent.find("#selectedCheckInOutReason");
    }
    refreshCheckInOutList() {
      this.check_in_out_list.empty();
      const filteredList = this.checkList.filter((item) => item.check_type == this.filter || this.filter == "All");
      filteredList.forEach((checkInOut) => {
        const checkInOutObject = document.createElement("div");
        checkInOutObject.classList.add("checkInOutItem", "rowBox");
        const type_div = document.createElement("div");
        type_div.classList.add("type");
        const type_img = document.createElement("img");
        type_img.src = "/assets/pos_ar/images/arrow.png";
        type_img.style.width = "35px";
        type_img.style.height = "35px";
        type_img.transform = checkInOut.check_type === "In" ? "rotate(180deg);" : "";
        const type_value_div = document.createElement("div");
        type_value_div.textContent = checkInOut.check_type;
        const creationTimeDiv = document.createElement("div");
        creationTimeDiv.classList.add("creationTime");
        creationTimeDiv.textContent = checkInOut.creation_time;
        const amountDiv = document.createElement("div");
        amountDiv.classList.add("amount");
        amountDiv.textContent = checkInOut.amount + " DA";
        type_div.append(type_img);
        type_div.append(type_value_div);
        checkInOutObject.append(type_div);
        checkInOutObject.append(creationTimeDiv);
        checkInOutObject.append(amountDiv);
        checkInOutObject.addEventListener("click", () => {
          this.selectedCheckInOut = checkInOut;
          this.refreshCheckInOutDetails();
        });
        this.check_in_out_list.append(checkInOutObject);
      });
    }
    refreshCheckInOutAmount() {
      this.check_total_in_out_amount.html("");
      this.check_in_amount.html("");
      this.check_out_amount.html("");
      let inAmount = 0;
      let outAmount = 0;
      let allAmount = 0;
      this.checkList.forEach((item) => {
        allAmount += parseFloat(item.amount) || 0;
        if (item.check_type == "In")
          inAmount += parseFloat(item.amount) || 0;
        else if (item.check_type == "Out")
          outAmount += parseFloat(item.amount) || 0;
      });
      this.check_in_amount.append(`${inAmount.toFixed(2)} DA`);
      this.check_out_amount.append(`${outAmount.toFixed(2)} DA`);
      this.check_total_in_out_amount.append(`${allAmount.toFixed(2)} DA`);
    }
    refreshCheckInOutDetails() {
      if (this.selectedCheckInOut == null)
        return;
      this.checkType.html("");
      this.checkCreationTime.html("");
      this.checkReason.html("");
      this.checkOwner.html("");
      this.checkAmount.html("");
      this.checkType.append(this.selectedCheckInOut.check_type);
      this.checkCreationTime.append(this.selectedCheckInOut.creation_time);
      this.checkAmount.append(this.selectedCheckInOut.amount + " DA");
      this.checkReason.append(this.selectedCheckInOut.reason);
      this.checkOwner.append(this.selectedCheckInOut.owner);
      console.log("this.checkReason.scrollHeight : ", this.checkReason.get(0).scrollHeight);
      this.checkReason.get(0).style.height = "auto";
      this.checkReason.get(0).style.height = this.checkReason.get(0).scrollHeight + "px";
    }
    showCart() {
      this.left_container.css("display", "flex");
      this.right_container.css("display", "flex");
    }
    hideCart() {
      this.left_container.css("display", "none");
      this.right_container.css("display", "none");
    }
    setListeners() {
      this.tab_all.on("click", (event2) => {
        this.filter = "All";
        this.tab_all.addClass("selected");
        this.tab_out.removeClass("selected");
        this.tab_in.removeClass("selected");
        this.refreshCheckInOutList();
      });
      this.tab_in.on("click", (event2) => {
        this.filter = "In";
        this.tab_in.addClass("selected");
        this.tab_out.removeClass("selected");
        this.tab_all.removeClass("selected");
        this.refreshCheckInOutList();
      });
      this.tab_out.on("click", (event2) => {
        this.filter = "Out";
        this.tab_out.addClass("selected");
        this.tab_all.removeClass("selected");
        this.tab_in.removeClass("selected");
        this.refreshCheckInOutList();
      });
    }
    async getAllCheckInOut() {
      this.db.getAllCheckInOut_callback(
        (res) => {
          if (res.length > 0) {
            this.selectedCheckInOut = res[0];
          }
          this.checkList = res;
          this.refreshCheckInOutList();
          this.refreshCheckInOutAmount();
          this.refreshCheckInOutDetails();
          console.log("res : ", res);
        },
        (err) => {
          console.log("err : ", err);
        }
      );
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/data/posSettingsData.js
  pos_ar.PointOfSale.posSettingsData = class {
    constructor(db) {
      this.db = db;
      this.price_bases = ["brand", "priceList"];
      console.log("hello from setting class");
      this.db.getSettings(
        (res) => {
          console.log("debuging : we are here1");
          if (res && res.itemPriceBasedOn) {
            this.settings = res;
          } else {
            this.settings = {
              itemPriceBasedOn: "brand"
            };
          }
          console.log("first test : ", res);
          console.log("first test settings : ", this.settings);
        },
        (err) => {
          console.log("error when trying to get the setting from local, so we use the default.");
          this.settings = {
            itemPriceBasedOn: "brand"
          };
        }
      );
    }
    getPriceBase() {
      return this.settings.itemPriceBasedOn;
    }
    getAllPriceBases() {
      return this.price_bases;
    }
    setPriceItemBasedOn(base, onSuccess, onFailure) {
      if (this.price_bases.includes(base)) {
        this.settings.itemPriceBasedOn = base;
        this.db.updateSettings(
          this.settings,
          () => {
            onSuccess();
            console.log("settings update is save successfuly");
          },
          () => {
            console.error("error occured when trying to save settings");
          }
        );
      } else {
        console.error("invalide base : ", base, "there are just : ", this.price_bases);
      }
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/data/posAppData.js
  pos_ar.PointOfSale.posAppData = class {
    constructor(db, apiHandler) {
      this.db = db;
      this.api_handler = apiHandler;
      this.appData = {};
      this.getAllData();
    }
    async getAllData() {
      try {
        await this.getCustomers();
        await this.getItems();
        await this.getPosProfiles();
        await this.getBins();
        await this.getWarehouses();
        await this.getPriceLists();
        await this.getItemPrices();
        await this.getItemGroups();
        await this.getPosInvoices();
        await this.getCheckInOuts();
        console.log("app data : ", this.appData);
      } catch (err) {
        console.error("appData Class Error  : ", err);
      }
    }
    async getCustomers() {
      this.appData.customers = await this.db.getAllCustomers();
    }
    async getItems() {
      this.appData.items = await this.db.getAllItems();
    }
    async getPosProfiles() {
      this.appData.pos_profiles = await this.db.getAllPosProfile();
    }
    async getBins() {
      this.appData.bins = await this.db.getAllBin();
    }
    async getWarehouses() {
      this.appData.warehouses = await this.db.getAllWarehouse();
    }
    async getPriceLists() {
      this.appData.price_lists = await this.db.getAllPriceList();
    }
    async getItemPrices() {
      this.appData.item_prices = await this.db.getAllItemPrice();
    }
    async getItemGroups() {
      this.appData.item_groups = await this.db.getAllItemGroup();
    }
    async getPosInvoices() {
      this.appData.pos_invoices = await this.db.getAllPosInvoice();
    }
    async getCheckInOuts() {
      this.appData.check_in_outs = await this.db.getAllCheckInOut();
    }
    saveCheckInOut(checkInOut, onSuccess, onFailure) {
      this.db.saveCheckInOut(checkInOut, onSuccess, onFailure);
    }
    savePosInvoice(posInvoice) {
      this.db.savePosInvoice(posInvoice);
    }
    updatePosInvoice(posInvoice) {
      this.db.updatePosInvoice(posInvoice);
    }
    getNotSyncedPos(onSuccess, onFailure) {
      this.db.getNotSyncedPos(
        (res) => {
          onSuccess(res);
        },
        (err) => {
          onFailure(err);
        }
      );
    }
    getNotSyncedPosNumber(onSuccess, onFailure) {
      this.db.getNotSyncedPosNumber(
        (res) => {
          onSuccess(res);
        },
        (err) => {
          onFailure(err);
        }
      );
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/remoteApi/FetchHandler.js
  pos_ar.PointOfSale.FetchHandler = class FetchHandler {
    constructor() {
    }
    async fetchCustomers() {
      try {
        return await frappe.db.get_list("Customer", {
          fields: ["name", "customer_name"],
          filters: { disabled: 0 },
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    }
    async fetchBrands() {
      try {
        return await frappe.db.get_list("Brand", {
          fields: ["brand"],
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
          fields: ["name", "item_name", "image", "brand", "item_group", "description", "stock_uom"],
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
          fields: ["name", "item_code", "item_name", "price_list", "price_list_rate", "brand"],
          filters: {},
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
          fields: ["name", "warehouse", "company", "selling_price_list", "warehouse", "income_account", "cost_center", "write_off_account", "write_off_cost_center", "taxes_and_charges", "tax_category"],
          filters: { disabled: 0 },
          limit: 100
        });
      } catch (error) {
        console.error("Error fetching pos profile list : ", error);
        return [];
      }
    }
    async fetchCompany(companyId) {
      try {
        return await frappe.db.get_doc("Company", companyId);
      } catch (error) {
        console.error("Error fetching company by companyId from the profile list : ", error);
        return [];
      }
    }
    async fetchSalesTaxesAndChargesTemplate(templateId) {
      try {
        return await frappe.db.get_doc("Sales Taxes and Charges Template", templateId);
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
})();
//# sourceMappingURL=pos.bundle.MIUN5Z5Y.js.map
