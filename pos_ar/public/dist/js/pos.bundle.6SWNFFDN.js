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
      this.selectedItemMap = /* @__PURE__ */ new Map();
      this.warehouseList = [];
      this.PosProfileList = [];
      this.binList = [];
      this.tabList = ["C1"];
      this.selectedItem = {};
      this.selectedField = null;
      this.selectedTab = this.tabList[0];
      this.detailsItemFieldsListeners = false;
      this.detailsItemKeysListeners = false;
      this.start_app();
    }
    async start_app() {
      await this.prepare_app_defaults();
      this.prepare_container();
      this.prepare_components();
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
      console.log("customersList : ", this.customersList);
      console.log("itemGroupList : ", this.itemGroupList);
      console.log("itemList : ", this.itemList);
      console.log("itemPrices : ", this.itemPrices);
      console.log("priceLists : ", this.priceLists);
      console.log("warehouseList : ", this.warehouseList);
      console.log("POSProfileList : ", this.PosProfileList);
      console.log("bin list : ", this.binList);
      console.log("tabList  : ", this.tabList);
      console.log("selected Tab : ", this.selectedTab);
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
        this.$rightSection
      );
    }
    init_selected_item() {
      this.selected_item_cart = new pos_ar.PointOfSale.pos_selected_item_cart(
        this.$rightSection,
        this.selectedItemMap,
        (item) => {
          this.onSelectedItemClick(item);
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
        this.onClose_details.bind(this)
      );
    }
    init_paymentCart() {
      this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
        this.$leftSection,
        this.onClose_payment_cart.bind(this)
      );
    }
    itemClick_selector(item) {
      if (!this.selectedItemMap.has(item.name)) {
        item.quantity = 1;
        item.amount = this.getItemPrice(item.name);
        this.selectedItemMap.set(item.name, item);
      } else {
        const existingItem = this.selectedItemMap.get(item.name);
        existingItem.quantity += 1;
        this.selectedItemMap.set(item.name, existingItem);
      }
      this.selected_item_cart.calculateNetTotal();
      this.selected_item_cart.calculateQnatity();
      this.selected_item_cart.calculateGrandTotal();
      this.selected_item_cart.refreshSelectedItem();
    }
    onSelectedItemClick(item) {
      console.log("item in controller 00 ", this.selectedItem);
      console.log("item in class 00 ", this.item_details.selected_item);
      this.item_selector.hideCart();
      this.item_details.show_cart();
      this.item_details.refreshDate(item);
      console.log("done!");
    }
    onCheckout() {
      console.log("here we are on callback 02 ", this.item_details);
      this.item_selector.hideCart();
      this.payment_cart.showCart();
      console.log("done!");
    }
    onClose_details() {
      console.log("onClose callback 001");
      this.item_selector.showCart();
      this.item_details.hide_cart();
      this.selected_item_cart.cleanHeighlight();
    }
    onClose_payment_cart() {
      this.item_selector.showCart();
      this.payment_cart.hideCart();
    }
    getItemPrice(itemId) {
      const price = this.itemPrices.find((itemPrice) => itemPrice.item_code == itemId);
      return price ? price.price_list_rate : 0;
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
          fields: ["name", "item_group_name"],
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
          filters: {}
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
          fields: ["name", "warehouse"],
          filters: {}
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
          filters: {}
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
      console.log("pos_item_selector class is working !");
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
      let filtredItemList = [];
      this.item_list.forEach((item) => {
        if (item.item_group == item_group) {
          filtredItemList.push(item);
        }
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
    constructor(wrapper) {
      this.wrapper = wrapper;
      this.prepare_customer_box();
    }
    prepare_customer_box() {
      this.wrapper.append('<div id="CustomerBox" class="rowBox align_center">');
      this.customerBox = this.wrapper.find("#CustomerBox");
      this.customerBox.append('<input list="CustomerList"  id="CustomerInput" name="Customer" placeHolder="Enter the customer">');
      this.customerBox.append('<datalist id="CustomerList"></datalist>');
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_selected_item_cart.js
  pos_ar.PointOfSale.pos_selected_item_cart = class {
    constructor(wrapper, selectedItemMap, onSelectedItemClick, onCheckoutClick) {
      this.wrapper = wrapper;
      this.selected_item_map = selectedItemMap;
      this.on_checkout_click = onCheckoutClick;
      this.on_selected_item_click = onSelectedItemClick;
      this.prepare_selected_item_cart();
    }
    prepare_selected_item_cart() {
      this.wrapper.append('<div id="CartBox" class="columnBox"></div>');
      this.cartBox = this.wrapper.find("#CartBox");
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
      this.totalQuantity.append('<div id="netTotalTitle">Net Total</div>');
      this.totalQuantity.append('<div id="netTotalValue">0.00</div>');
      this.grandTotal = this.cartDetails.find("#grandTotal");
      this.totalQuantity.append('<div id="grandTotalTitle">Grand Total</div>');
      this.totalQuantity.append('<div id="grandTotalValue">0.00</div>');
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
    refreshSelectedItem() {
      const selectedItemsContainer = document.getElementById("selectedItemsContainer");
      selectedItemsContainer.innerHTML = "";
      this.selected_item_map.forEach((item, itemId) => {
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
        itemElement.addEventListener("click", (event2) => {
          console.log("we are click");
          this.makeItemHighlight(itemElement);
          this.on_selected_item_click(item);
        });
        selectedItemsContainer.appendChild(itemElement);
      });
    }
    calculateNetTotal() {
      let netTotal = 0;
      this.selected_item_map.forEach((value, key) => {
        netTotal += value.quantity * value.amount;
      });
      const netTotal_HTML = document.getElementById("netTotalValue");
      netTotal_HTML.textContent = netTotal;
    }
    calculateQnatity() {
      let quantity = 0;
      this.selected_item_map.forEach((value, key) => {
        quantity += value.quantity;
      });
      const totalQuantity_HTML = document.getElementById("totalQuantityValue");
      totalQuantity_HTML.textContent = quantity;
    }
    calculateGrandTotal() {
      let grandTotal = 0;
      this.selected_item_map.forEach((value, key) => {
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
    constructor(wrapper, warehouse, priceLists, itemPrices, binList, selectedItem, onClose) {
      console.log("hello from item_details 0");
      this.wrapper = wrapper;
      this.warehouse = warehouse;
      this.price_lists = priceLists;
      this.item_prices = itemPrices;
      this.selected_item = selectedItem;
      this.on_close_cart = onClose;
      this.bin_list = binList;
      console.log("start with : ", warehouse);
      this.prepare_item_details_cart();
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
      this.c2.append('<div class="columnBox"><label for="itemDetailsPriceListRateInput">Price List Rate</label><input type="text" id="itemDetailsPriceListRateInput" disabled></div>');
    }
    refreshDate(item) {
      console.log("start ref");
      const imageContainer = document.getElementById("detailsItemImage");
      const name = document.getElementById("detailsItemName");
      const warehouse = document.getElementById("detailsItemWarehouse");
      const itemGroup = document.getElementById("detailsItemGroup");
      const quantity = document.getElementById("itemDetailsQuantityInput");
      const rate = document.getElementById("itemDetailsRateInput");
      const discount = document.getElementById("itemDetailsDiscountInput");
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
      discount.value = 0;
      available.value = this.getQtyInWarehouse(item.name, warehouse);
      uom.value = item.stock_uom;
      priceList.value = this.price_lists[0].price_list_name;
      warehouse.textContent = "Warehouse : " + this.warehouse;
      itemGroup.textContent = "Item Group : " + item.item_group;
      priceListRate.value = this.getItemPrice(item.name) + "DA";
      console.log("end ref");
    }
    show_cart() {
      console.log("show 02");
      this.item_details_cart.css("display", "flex");
    }
    hide_cart() {
      console.log("hide 001");
      this.item_details_cart.css("display", "none");
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
    constructor(wrapper, onClose) {
      this.wrapper = wrapper;
      this.on_close_cart = onClose;
      this.prepare_payment_cart();
      console.log("hello from payment cart");
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
      this.cart_content_top_section.append('<div id="cashBox"><div id="cashBoxTitle" class="title">Cash</div><input type="float" id="cachInput" ></div>');
      this.cart_content_top_section.append('<div id="redeemLoyaltyPoints"><div id="redeemLoyaltyPointsTitle" class="title">Redeem Loyalty Points</div><input type="float" id="RedeemLayoutPointsInput" disabled></div>');
      this.cart_content_bottom_section.append("<h4>Additional Information</h4>");
      this.cart_footer.append('<div id="paymentDetailsContainer" class="rowBox align_center"></div>');
      this.cart_footer.append('<button type="button" id="completeOrderBtn">Complete Order</button>');
      this.payment_details = this.cart_footer.find("#paymentDetailsContainer");
      this.payment_details.append('<div id="paymentGrandTotal" class="columnBox"><div id="paymentGrandTotalTitle" class="rowBox centerItem">Grand Total</div><div id="paymentGrandTotalValue"  class="rowBox centerItem"> ...DA  </div></div>');
      this.payment_details.append("<hr>");
      this.payment_details.append('<div id="paymentPaidAmount" class="columnBox"><div id="paymentPaidAmountTitle" class="rowBox centerItem">Paid Amount</div><div id="paimentPaidAmountValue"  class="rowBox centerItem"> ...DA </div></div>');
      this.payment_details.append("<hr>");
      this.payment_details.append('<div id="paymentToBePaid" class="columnBox"><div id="paimentToBePaidTitle" class="rowBox centerItem">To Be Paid</div><div id="paimentToBePaidValue"  class="rowBox centerItem"> ...DA </div></div>');
    }
    showCart() {
      console.log("show payment cart");
      this.cart.css("display", "flex");
    }
    hideCart() {
      this.cart.css("display", "none");
    }
  };
})();
//# sourceMappingURL=pos.bundle.6SWNFFDN.js.map
