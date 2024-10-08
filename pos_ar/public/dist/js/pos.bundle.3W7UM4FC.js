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
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/posController.js
  pos_ar.PointOfSale.Controller = class {
    constructor(wrapper) {
      __publicField(this, "discount_percentage");
      this.wrapper = $(wrapper).find(".layout-main-section");
      this.page = wrapper.page;
      this.customersList = [];
      this.itemGroupList = [];
      this.itemList = [];
      this.itemPrices = [];
      this.priceLists = [];
      this.selectedItemMaps = /* @__PURE__ */ new Map([
        ["C1", /* @__PURE__ */ new Map()]
      ]);
      this.warehouseList = [];
      this.PosProfileList = [];
      this.binList = [];
      this.selectedItem = {};
      this.selectedField = {};
      this.selectedTab = { "tabName": "C1" };
      this.selectedPaymentMethod = { "methodName": "" };
      this.selectedCustomer = { "name": "" };
      this.sellInvoices = /* @__PURE__ */ new Map();
      this.POSOpeningEntry = {};
      this.start_app();
    }
    async start_app() {
      this.prepare_container();
      await this.prepare_app_defaults();
      await this.checkForPOSEntry();
      await this.prepare_components();
      this.setListeners();
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
      if (this.PosProfileList.length == 0) {
        frappe.set_route("Form", "POS Profile");
        return;
      }
      console.log("customersList => ", this.customersList);
      console.log("itemGroupList => ", this.itemGroupList);
      console.log("itemList      => ", this.itemList);
      console.log("itemPrices    => ", this.itemPrices);
      console.log("priceLists    => ", this.priceLists);
      console.log("warehouseList => ", this.warehouseList);
      console.log("POSProfileList => ", this.PosProfileList);
      console.log("bin list       => ", this.binList);
    }
    prepare_container() {
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/selectorBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/itemDetailsCart.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/paymentMethodCart.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/customerBox.css">');
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/cartBox.css">');
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
    }
    async checkForPOSEntry() {
      try {
        const r = await frappe.db.get_list("POS Opening Entry", {
          filters: {
            "pos_profile": this.PosProfileList[0].name,
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
        this.onSync.bind(this),
        this.onClosePOS.bind(this),
        this.onHistoryClick.bind(this)
      );
    }
    init_selected_item() {
      this.selected_item_cart = new pos_ar.PointOfSale.pos_selected_item_cart(
        this.$rightSection,
        this.selectedItemMaps,
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
        this.onCheckout.bind(this)
      );
    }
    init_item_details() {
      console.log("warehouse ==> ", this.PosProfileList[0].warehouse);
      this.item_details = new pos_ar.PointOfSale.pos_item_details(
        this.$leftSection,
        this.PosProfileList[0].warehouse,
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
      console.log("im heeeeeeeeeeeeer @#$%^&*(*&^%$##$%^&*()^%$#@");
      this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
        this.$leftSection,
        this.selectedItemMaps,
        this.selectedTab,
        this.selectedPaymentMethod,
        this.onClose_payment_cart.bind(this),
        this.onCompleteOrder.bind(this)
      );
    }
    init_historyCart() {
      console.log("im heeeeeeeeeeeeer @#$%^&*(*&^%$##$%^&*()^%$#@");
      this.history_cart = new pos_ar.PointOfSale.pos_history();
    }
    itemClick_selector(item) {
      const itemCloned = __spreadValues({}, item);
      console.log("old ===> ", this.selectedItemMaps);
      console.log("updated ===> ", this.selectedItemMaps.get(this.selectedTab.tabName).has(itemCloned.name));
      if (!this.selectedItemMaps.get(this.selectedTab.tabName).has(itemCloned.name)) {
        itemCloned.quantity = 1;
        itemCloned.amount = this.getItemPrice(itemCloned.name);
        this.selectedItemMaps.get(this.selectedTab.tabName).set(itemCloned.name, itemCloned);
      } else {
        const existingItem = this.selectedItemMaps.get(this.selectedTab.tabName).get(itemCloned.name);
        console.log("quantity ===> ", existingItem.quantity);
        existingItem.quantity += 1;
        this.selectedItemMaps.get(this.selectedTab.tabName).set(itemCloned.name, existingItem);
      }
      console.log("updated ===> ", this.selectedItemMaps);
      this.selected_item_cart.calculateNetTotal();
      this.selected_item_cart.calculateQnatity();
      this.selected_item_cart.calculateGrandTotal();
      this.selected_item_cart.refreshSelectedItem();
    }
    onSelectedItemClick(item) {
      Object.assign(this.selectedItem, item);
      this.item_details.show_cart();
      this.selected_item_cart.showKeyboard();
      this.item_selector.hideCart();
      this.payment_cart.hideCart();
      this.selected_item_cart.setKeyboardOrientation("landscape");
      this.item_details.refreshDate(item);
    }
    onCheckout() {
      console.log("here we are on callback 02 ", this.item_details);
      this.payment_cart.showCart();
      this.item_selector.hideCart();
      this.item_details.hide_cart();
      this.payment_cart.calculateGrandTotal();
      this.selected_item_cart.setKeyboardOrientation("landscape");
      this.selected_item_cart.cleanHeighlight();
      this.selected_item_cart.showKeyboard();
    }
    onClose_details() {
      console.log("onClose callback 002");
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
      this.selected_item_cart.setKeyboardOrientation("portrait");
      this.selected_item_cart.cleanHeighlight();
    }
    onHistoryClick() {
      this.payment_cart.hideCart();
      this.item_details.hide_cart();
      this.item_selector.hideCart();
      this.selected_item_cart.hideCart();
      this.customer_box.hideActionBar();
    }
    onInput(event2, field, value) {
      console.log("field : ", field);
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
        this.selectedItem.quantity = value;
        this.selectedItemMaps.get(this.selectedTab.tabName).set(this.selectedItem.name, Object.assign({}, this.selectedItem));
        this.selected_item_cart.refreshSelectedItem();
      } else if (field == "rate") {
        this.selectedItem.amount = value;
        this.selectedItemMaps.get(this.selectedTab.tabName).set(this.selectedItem.name, Object.assign({}, this.selectedItem));
        this.selected_item_cart.refreshSelectedItem();
      } else if (field == "discount_percentage") {
        let oldRate = this.getItemPrice(this.selectedItem.name);
        let montant = oldRate * (value / 100);
        let newRate = oldRate - montant;
        console.log("old price : ", oldRate, "discount % : ", value, "discount montant : ", montant, " new Price ", newRate);
        this.selectedItem.discount_percentage = value;
        this.selectedItem.discount_amount = montant;
        this.selectedItem.amount = newRate;
        this.selectedItemMaps.get(this.selectedTab.tabName).set(this.selectedItem.name, Object.assign({}, this.selectedItem));
        this.selected_item_cart.refreshSelectedItem();
        this.item_details.refreshDate(this.selectedItem);
      } else if (field == "discount_amount") {
        let oldRate = this.getItemPrice(this.selectedItem.name);
        let persent = (value * 100 / oldRate).toFixed(2);
        let montant = value;
        if (persent > 100) {
          persent = 100;
        }
        if (value > oldRate) {
          montant = oldRate;
        }
        let newRate = oldRate - montant;
        console.log("old price : ", oldRate, "discount % : ", persent, "discount montant : ", montant, " new Price ", newRate);
        this.selectedItem.discount_percentage = persent;
        this.selectedItem.discount_amount = montant;
        this.selectedItem.amount = newRate;
        this.selectedItemMaps.get(this.selectedTab.tabName).set(this.selectedItem.name, Object.assign({}, this.selectedItem));
        this.selected_item_cart.refreshSelectedItem();
        this.item_details.refreshDate(this.selectedItem);
      }
    }
    onKeyPressed(action, key) {
      if (action == "quantity") {
        this.item_details.requestFocus("quantity");
      } else if (action == "rate") {
        this.item_details.requestFocus("rate");
      } else if (action == "discount") {
        this.item_details.requestFocus("discount");
      } else if (action == "remove") {
        this.selectedItemMaps.get(this.selectedTab.tabName).delete(this.selectedItem.name);
        this.selected_item_cart.refreshSelectedItem();
      } else if (action == "addToField") {
        this.item_details.addToField(this.selectedField.field_name, key);
      }
    }
    onCompleteOrder() {
      let items = [];
      this.selectedItemMaps.get(this.selectedTab.tabName).forEach((value, key) => {
        console.log("the key ==> ", key, " value ==> ", value);
        let newItem = {
          "item_name": value.name,
          "item_code": value.name,
          "rate": value.amount,
          "qty": value.quantity,
          "description": value.name,
          "image": value.image,
          "expense_account": "Cost of Goods Sold - MS",
          "use_serial_batch_fields": 1,
          "discount_percentage": value.discount_percentage,
          "discount_amount": value.discount_amount,
          "warehouse": this.PosProfileList[0].warehouse,
          "income_account": this.PosProfileList[0].income_account,
          "item_tax_rate": {}
        };
        items.push(newItem);
      });
      if (items.length == 0)
        return;
      this.sellInvoices.set(
        this.selectedTab.tabName,
        {
          "customer": this.customersList[0].name,
          "pos_profile": this.PosProfileList[0].name,
          "items": items,
          "creation_time": frappe.datetime.now_datetime()
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
      console.log("posInvoice ==> ", this.sellInvoices);
    }
    onSync() {
      if (this.POSOpeningEntry.name == "") {
        this.checkForPOSEntry();
        return;
      }
      let all_tabs = Array.from(this.sellInvoices.keys());
      if (all_tabs.length == 0) {
        frappe.msgprint({
          title: __("Sync Complete"),
          indicator: "green",
          message: __("All data is already synchronized.")
        });
        return;
      }
      frappe.show_progress("Syncing Invoices...", 0, all_tabs.length, "syncing");
      let counter = 0;
      let failure = 0;
      let seccess = 0;
      let invoicesRef = [];
      all_tabs.forEach((tab) => {
        let paid_amount = 0;
        let totalQty = 0;
        this.sellInvoices.get(tab).items.forEach((item) => {
          totalQty += item.qty;
          paid_amount += item.rate * item.qty;
        });
        console.log("paid", paid_amount);
        frappe.db.insert({
          "doctype": "POS Invoice",
          "customer": this.sellInvoices.get(tab).customer,
          "pos_profile": this.sellInvoices.get(tab).pos_profile,
          "items": this.sellInvoices.get(tab).items,
          "creation_time": this.sellInvoices.get(tab).creation_time,
          "paid_amount": paid_amount,
          "amount_eligible_for_commission": paid_amount,
          "write_off_account": this.PosProfileList[0].write_off_account,
          "write_off_cost_center": this.PosProfileList[0].write_off_cost_center,
          "outstanding_amount": 0,
          "is_pos": 1,
          "payments": [{
            "mode_of_payment": "Cash",
            "amount": paid_amount
          }],
          "update_stock": 1,
          "docstatus": 1
        }).then((r) => {
          invoicesRef.push({ "pos_invoice": r.name, "customer": r.customer });
          this.sellInvoices.delete(tab);
          counter += 1;
          frappe.show_progress("Syncing Invoices...", counter, all_tabs.length, "syncing");
          if (counter == all_tabs.length) {
            console.log("it should close the progress dialog");
            frappe.hide_progress();
            this.customer_box.setSynced();
          }
        }).catch((err) => {
          counter += 1;
          failure += 1;
          console.log(err);
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
      console.log("test (window) ==> ", window);
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
        console.log("Service Worker isn't supported!");
        return;
      }
      console.log("Service Worker supported");
      window.addEventListener("DOMContentLoaded", () => {
        console.log("Window loaded!");
        navigator.serviceWorker.register("./sw.js").then((reg) => console.log("Service Worker registered successfully.")).catch((err) => console.log(`Service Worker registration failed: ${err}`));
      });
      this.sw = new pos_ar.PointOfSale.Sw();
      if (document.readyState === "complete") {
        console.log("DOM was already loaded");
        navigator.serviceWorker.register("../assets/pos_ar/public/js/sw.js").then((reg) => console.log("Service Worker registered successfully.")).catch((err) => console.log(`Service Worker registration failed: ${err}`));
      }
    }
    async fetchCustomers() {
      try {
        return await frappe.db.get_list("Customer", {
          fields: ["name", "customer_name"],
          filters: {}
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
          filters: {}
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
          filters: { disabled: 0 }
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
          filters: { price_list: "Standard Selling" }
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
          filters: { selling: 1 }
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
          filters: {}
        });
      } catch (error) {
        console.error("Error fetching Warehouse list : ", error);
        return [];
      }
    }
    async fetchPosProfileList() {
      try {
        return await frappe.db.get_list("POS Profile", {
          fields: ["name", "warehouse", "income_account", "write_off_account", "write_off_cost_center"],
          filters: { disabled: 0 }
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
          firstLatter.textContent = item.name[0];
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
    constructor(wrapper, customersList, onSync, onClosePOS, onHistoryClick) {
      this.wrapper = wrapper;
      this.customers_list = customersList;
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
      this.customerBox.append('<input list="CustomerList"  id="CustomerInput" name="Customer" placeHolder="Enter the customer">');
      this.customerBox.append('<datalist id="CustomerList"></datalist>');
      this.customerBox.append('<div id="syncBtn" class="Synced">Sync</div>');
      this.sync_btn = this.customerBox.find("#syncBtn");
    }
    setCustomersInList() {
      const customerList_html = document.getElementById("CustomerList");
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
      this.actionContainer.css("flex-direction", "row-reverse");
    }
    showActionBar() {
      this.customerBox.css("display", "flex");
      this.actionContainer.css("flex-direction", "row");
    }
    setListeners() {
      this.customerBox.find("#syncBtn").on("click", (event2) => {
        this.on_sync();
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
    constructor(wrapper, selectedItemMaps, selectedTab, selectedItem, selectedField, onSelectedItemClick, onTabClick, onKeyPressed, onCheckoutClick) {
      this.wrapper = wrapper;
      this.selected_item_maps = selectedItemMaps;
      this.selected_tab = selectedTab;
      this.selected_item = selectedItem;
      this.selected_field = selectedField;
      this.on_key_pressed = onKeyPressed;
      this.on_checkout_click = onCheckoutClick;
      this.on_selected_item_click = onSelectedItemClick;
      this.on_tab_click = onTabClick;
      this.counter = 1;
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
      this.tabs_container.append('<div class="tab selected">C1</div>');
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
      this.cartDetails.append('<div id="grandTotal" class="rowBox align_center row_sbtw"></div>');
      this.discount = this.cartDetails.find("#discount");
      this.discount.append('<div id="addDiscountTitle">Add Discount</div>');
      this.discount.append('<div id="addDiscountValue"></div>');
      this.totalQuantity = this.cartDetails.find("#totalQuantity");
      this.totalQuantity.append('<div id="totalQuantityTitle">Total Quantity</div>');
      this.totalQuantity.append('<div id="totalQuantityValue">0</div>');
      this.netTotal = this.cartDetails.find("#netTotal");
      this.netTotal.append('<div id="netTotalTitle">Net Total</div>');
      this.netTotal.append('<div id="netTotalValue">0.00</div>');
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
          this.tabs_container.append(`<div class="tab selected">${key}</div>`);
        } else {
          this.tabs_container.append(`<div class="tab">${key}</div>`);
        }
      }
      this.tabs_container.find(".tab").on("click", (event2) => {
        const clickedTab = $(event2.target).text();
        this.selected_tab.tabName = clickedTab;
        this.refreshTabs();
        this.refreshSelectedItem();
        this.calculateNetTotal();
        this.calculateQnatity();
        this.calculateGrandTotal();
        this.on_tab_click(clickedTab);
        console.log("clicked tab ==> ", clickedTab);
      });
    }
    refreshSelectedItem() {
      const selectedItemsContainer = document.getElementById("selectedItemsContainer");
      selectedItemsContainer.innerHTML = "";
      console.log("debuging ", this.selected_tab);
      console.log("selected map ", this.selected_item_maps);
      this.selected_item_maps.get(this.selected_tab.tabName).forEach((item, itemId) => {
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
        itemQuantity.textContent = item.quantity;
        itemQuantity.classList.add("itemQuantity");
        rightGroup.appendChild(itemQuantity);
        itemPrice.textContent = item.amount + " DA";
        itemPrice.classList.add("itemPrice");
        rightGroup.appendChild(itemPrice);
        leftGroup.classList.add("rowBox", "align_center", "leftGroup");
        itemElement.appendChild(leftGroup);
        rightGroup.classList.add("rowBox", "align_center", "rightGroup");
        itemElement.appendChild(rightGroup);
        itemElement.classList.add("rowBox", "align_center", "row_sbtw", "ItemElement", "pointer");
        if (itemId == this.selected_item.name)
          itemElement.classList.add("selected");
        itemElement.addEventListener("click", (event2) => {
          console.log("we are click");
          this.makeItemHighlight(itemElement);
          this.on_selected_item_click(item);
        });
        selectedItemsContainer.appendChild(itemElement);
      });
      this.calculateNetTotal();
      this.calculateQnatity();
      this.calculateGrandTotal();
    }
    createNewTab() {
      this.counter += 1;
      this.selected_item_maps.set(`C${this.counter}`, /* @__PURE__ */ new Map());
      this.selected_tab.tabName = `C${this.counter}`;
      this.refreshTabs();
      this.refreshSelectedItem();
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
        quantity.css("font-size", "smaller");
        netTotal.css("font-size", "smaller");
        grandTotal.css("font-size", "small");
        grandTotal.css("font-weight", "500");
      } else {
        this.cartDetails.addClass("columnBox");
        this.cartDetails.removeClass("rowBox");
        discount.css("display", "flex");
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
      } else if (this.selected_field.field_name == "discount") {
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
          }
        });
      });
    }
    setListener() {
      this.add_tab_button.on("mousedown", (event2) => {
        this.counter += 1;
        this.selected_item_maps.set(`C${this.counter}`, /* @__PURE__ */ new Map());
        this.selected_tab.tabName = `C${this.counter}`;
        this.refreshTabs();
        this.refreshSelectedItem();
        this.on_tab_click();
        console.log("add Tab new map ==> ", this.selected_item_maps);
      });
    }
    calculateNetTotal() {
      let netTotal = 0;
      this.selected_item_maps.get(this.selected_tab.tabName).forEach((value, key) => {
        netTotal += value.quantity * value.amount;
      });
      const netTotal_HTML = document.getElementById("netTotalValue");
      netTotal_HTML.textContent = netTotal;
    }
    calculateQnatity() {
      let quantity = 0;
      this.selected_item_maps.get(this.selected_tab.tabName).forEach((value, key) => {
        quantity += value.quantity;
      });
      const totalQuantity_HTML = document.getElementById("totalQuantityValue");
      totalQuantity_HTML.textContent = quantity;
    }
    calculateGrandTotal() {
      let grandTotal = 0;
      this.selected_item_maps.get(this.selected_tab.tabName).forEach((value, key) => {
        grandTotal += value.quantity * value.amount;
      });
      const grandTotal_HTML = document.getElementById("grandTotalValue");
      grandTotal_HTML.textContent = grandTotal;
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
      console.log("hello from item_details 0");
      this.wrapper = wrapper;
      this.warehouse = warehouse;
      this.price_lists = priceLists;
      this.item_prices = itemPrices;
      this.selected_item = selectedItem;
      this.selected_field = selectedField;
      this.on_input = onInput;
      this.on_close_cart = onClose;
      this.bin_list = binList;
      console.log("start with : ", warehouse);
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
      this.c2.append('<div class="columnBox"><label for="detailsPriceList">Price List *</label><input list="detailsPriceList" id="detailsItemPriceListInput" class ="rowBox align_center pointerCursor"><datalist id="detailsPriceList"><option>fetching Price Lists ...</option></datalist></div>');
      this.c2.append('<div class="columnBox"><label for="itemDetailsDiscountMontantInput">Discount (montant)</label><input type="float" id="itemDetailsDiscountMontantInput" class="pointerCursor"></div>');
      this.c2.append('<div class="columnBox"><label for="itemDetailsPriceListRateInput">Price List Rate</label><input type="text" id="itemDetailsPriceListRateInput" disabled></div>');
    }
    refreshDate(item) {
      var _a, _b;
      console.log("start ref");
      const imageContainer = document.getElementById("detailsItemImage");
      const name = document.getElementById("detailsItemName");
      const warehouse = document.getElementById("detailsItemWarehouse");
      const itemGroup = document.getElementById("detailsItemGroup");
      const quantity = document.getElementById("itemDetailsQuantityInput");
      const rate = document.getElementById("itemDetailsRateInput");
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
      quantity.value = item.quantity;
      rate.value = item.amount;
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
      console.log("show 02");
      this.item_details_cart.css("display", "flex");
    }
    hide_cart() {
      console.log("hide 001");
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
    constructor(wrapper, selectedItemMap, selectedTab, selectedPaymentMythod, onClose, onComplete) {
      this.wrapper = wrapper;
      this.selected_item_map = selectedItemMap;
      this.selected_tab = selectedTab;
      this.selected_payment_method = selectedPaymentMythod;
      this.on_close_cart = onClose;
      this.on_complete = onComplete;
      this.grand_total = 0;
      this.paid_amount = 0;
      this.to_change = 0;
      this.start_work();
    }
    start_work() {
      this.prepare_payment_cart();
      this.calculateGrandTotal();
      this.setListeners();
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
      this.payment_details.append(`<div id="paymentToChange" class="columnBox"><div id="paimentToChangeTitle" class="rowBox centerItem">To Change</div><div id="paimentToChangeValue"  class="rowBox centerItem"> ${this.to_change}DA </div></div>`);
    }
    showCart() {
      this.cart.css("display", "flex");
      this.clearData();
    }
    hideCart() {
      this.cart.css("display", "none");
    }
    clearData() {
      this.grand_total = 0;
      this.paid_amount = 0;
      this.to_change = 0;
      this.cashBox.find("#cachInput").val(0);
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
        this.paid_amount = this.cashBox.find("#cachInput").val();
        this.refreshPaidAmount();
      });
      this.onTimeBox.on("click", (event2) => {
        this.selected_payment_method.methodName = "onTime";
        this.cashBox.removeClass("selected");
        this.onTimeBox.addClass("selected");
        this.redeemLoyaltyBox.removeClass("selected");
        this.paid_amount = this.onTimeBox.find("#paymentOnTimeInput").val();
        this.refreshPaidAmount();
      });
      this.redeemLoyaltyBox.on("click", (event2) => {
        this.selected_payment_method.methodName = "redeemLoyalty";
        this.cashBox.removeClass("selected");
        this.onTimeBox.removeClass("selected");
        this.redeemLoyaltyBox.addClass("selected");
        this.paid_amount = 0;
        this.refreshPaidAmount();
      });
      this.cashBox.find("#cachInput").on("input", (event2) => {
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
        this.paid_amount = event2.target.value;
        this.refreshPaidAmount();
        this.calculateToChange();
        console.log("input", event2.target.value);
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
        this.paid_amount = event2.target.value;
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
        console.log("grand total ==> ", this.grand_total, "the paid amount ==> ", this.paid_amount);
        if (this.grand_total > this.paid_amount) {
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
        } else if (this.grand_total == 0) {
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
    calculateGrandTotal() {
      this.grand_total = 0;
      this.selected_item_map.get(this.selected_tab.tabName).forEach((value, key) => {
        this.grand_total += value.quantity * value.amount;
      });
      this.payment_details.find("#paymentGrandTotalValue").text(`${this.grand_total} DA`);
      this.generateProposedPaidAmount(this.grand_total);
    }
    calculateToChange() {
      this.to_change = this.paid_amount - this.grand_total;
      console.log("paid  ", this.paid_amount, " - ", this.grand_total, " = ", this.to_change);
      this.payment_details.find("#paimentToChangeValue").text(`${this.to_change} DA`);
    }
    refreshPaidAmount() {
      this.payment_details.find("#paimentPaidAmountValue").text(`${this.paid_amount} DA`);
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
    constructor(wrapper) {
      console.log("im pos history");
    }
    start_work() {
      this.prepare_selected_item_cart();
    }
    prepare_selected_item_cart() {
      this.wrapper.append('<div id="historyContainer"></div>');
      this.container = this.wrapper.find("#historyContainer");
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/sw.js
  pos_ar.PointOfSale.Sw = class {
    constructor() {
      console.log(`Im SW I'm heeeeeeeeeeeeeeeeeeeere path: ${window.location.pathname}`);
    }
  };
})();
//# sourceMappingURL=pos.bundle.3W7UM4FC.js.map
