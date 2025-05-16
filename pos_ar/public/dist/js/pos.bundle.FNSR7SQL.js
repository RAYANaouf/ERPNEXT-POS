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

  // ../pos_ar/pos_ar/pos_ar/page/myaccessories/AccessoriesController.js
  frappe.provide("pos_ar.myaccessories");
  pos_ar.myaccessories.AccessoriesController = class {
    constructor(wrapper) {
      this.wrapper = $(wrapper).find(".layout-main-section");
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/accessories_page/main.css">');
      this.selectedCompany = frappe.defaults.get_user_default("company");
      this.selectedPOSOpening = "";
      this.selectedBrand = "";
      this.brandList = [];
      this.make();
    }
    make() {
      this.createLayout();
    }
    createLayout() {
      const container = $('<div class="accessories-container">').appendTo(this.wrapper);
      const topBar = $('<div class="top-bar shadow">').appendTo(container);
      const leftSection = $('<div class="top-bar-left">').appendTo(topBar);
      $('<div class="page-icon"><i class="fa fa-box-open fa-lg"></i></div>').appendTo(leftSection);
      $("<h2>").text("Accessories").appendTo(leftSection);
      const centerSection = $('<div class="top-bar-center">').appendTo(topBar);
      const filterContainer = $('<div class="filter-container">').appendTo(centerSection);
      const companyWrapper = $('<div class="filter-group">').appendTo(filterContainer);
      this.companySelect = $("<select>").addClass("form-control").change(() => {
        this.selectedCompany = this.companySelect.val();
        this.loadPOSOpenings();
        this.loadItems(container.find(".items-container"));
      }).appendTo(companyWrapper);
      const posOpeningWrapper = $('<div class="filter-group">').appendTo(filterContainer);
      this.posOpeningSelect = $("<select>").addClass("form-control").change(() => {
        this.selectedPOSOpening = this.posOpeningSelect.val();
        this.loadItems(container.find(".items-container"));
      }).appendTo(posOpeningWrapper);
      const brandWrapper = $('<div class="filter-group">').appendTo(filterContainer);
      const brandInputWrapper = $('<div class="brand-input-wrapper">').appendTo(brandWrapper);
      this.brandField = frappe.ui.form.make_control({
        parent: brandInputWrapper,
        df: {
          fieldtype: "Link",
          options: "Brand",
          placeholder: "Type to search brands...",
          only_select: false,
          filter_fields: ["name"],
          get_query: () => {
            return {
              filters: {}
            };
          }
        },
        render_input: true
      });
      this.brandField.refresh();
      this.brandField.$input.addClass("brand-filter-input").removeClass("input-with-feedback");
      const clearBtn = $("<button>").addClass("clear-brand-btn").html('<i class="fa fa-times"></i>').click(() => {
        this.brandField.set_value("");
        this.selectedBrand = "";
        this.loadItems(container.find(".items-container"));
      }).appendTo(brandInputWrapper);
      this.brandField.$input.on("change", () => {
        const newValue = this.brandField.get_value();
        if (this.selectedBrand !== newValue) {
          this.selectedBrand = newValue;
          console.log("Brand changed to:", this.selectedBrand);
          setTimeout(() => {
            this.loadItems(container.find(".items-container"));
          }, 100);
        }
      });
      this.brandField.$input.on("awesomplete-selectcomplete", () => {
        const newValue = this.brandField.get_value();
        if (this.selectedBrand !== newValue) {
          this.selectedBrand = newValue;
          console.log("Brand selected from dropdown:", this.selectedBrand);
          this.loadItems(container.find(".items-container"));
        }
      });
      frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Company",
          fields: ["name"],
          limit: 0
        },
        callback: (response) => {
          if (response.message) {
            this.companySelect.empty();
            response.message.forEach((company) => {
              this.companySelect.append(
                $("<option></option>").val(company.name).text(company.name)
              );
            });
            this.companySelect.val(this.selectedCompany);
            this.loadPOSOpenings();
          }
        }
      });
      const rightSection = $('<div class="top-bar-right">').appendTo(topBar);
      $('<button class="btn btn-primary btn-export">').html('<i class="fa fa-download mr-2"></i>Export').click(() => this.exportData()).appendTo(rightSection);
      const listContainer = $('<div class="items-container">').appendTo(container);
      const headerRow = $('<div class="item-row header">').html(`
            <div class="item-col name">Name</div>
            <div class="item-col qty">Quantity</div>
            <div class="item-col total">Total</div>
        `).appendTo(listContainer);
      this.loadItems(listContainer);
    }
    formatCurrency(amount) {
      return amount.toFixed(2) + " DA";
    }
    loadPOSOpenings() {
      frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "POS Opening Entry",
          filters: {
            company: this.selectedCompany,
            docstatus: 1
          },
          fields: ["name", "pos_profile"],
          limit: 0
        },
        callback: (response) => {
          if (response.message) {
            this.posOpeningSelect.empty();
            this.posOpeningSelect.append(
              $("<option></option>").val("").text("All POS Sessions")
            );
            response.message.forEach((entry) => {
              this.posOpeningSelect.append(
                $("<option></option>").val(entry.name).text(`${entry.name} (${entry.pos_profile})`)
              );
            });
            this.posOpeningSelect.val(this.selectedPOSOpening);
          }
        }
      });
    }
    loadItems(container) {
      container.find(".item-row:not(.header)").remove();
      container.find(".loading-spinner, .error-message, .no-items-message").remove();
      const loadingSpinner = $(`
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">Loading items...</div>
            </div>
        `).appendTo(container);
      console.log("Loading items with filters:", {
        company: this.selectedCompany,
        pos_opening_entry: this.selectedPOSOpening,
        brand: this.selectedBrand
      });
      frappe.call({
        method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_saled_item",
        args: {
          company: this.selectedCompany,
          pos_opening_entry: this.selectedPOSOpening,
          brand: this.selectedBrand || ""
        },
        callback: (response) => {
          loadingSpinner.remove();
          console.log("Response:", response);
          if (response.message && response.message.items && Object.keys(response.message.items).length > 0) {
            this.data = response.message.items;
            this.renderItems(container, this.data);
          } else {
            $('<div class="no-items-message">').text("No items found").appendTo(container);
          }
        },
        error: (err) => {
          loadingSpinner.remove();
          $('<div class="error-message">').text("Error loading items. Please try again.").appendTo(container);
          console.error("Error loading items:", err);
        }
      });
    }
    renderItems(container, items) {
      container.find(".item-row:not(.header)").remove();
      if (Object.keys(items).length === 0) {
        $('<div class="item-row no-data">').html('<div class="item-col name">No sales data found for selected date</div>').appendTo(container);
        return;
      }
      let grandTotal = 0;
      Object.entries(items).forEach(([itemName, item]) => {
        grandTotal += item.rate * item.qty;
        $('<div class="item-row">').html(`
                    <div class="item-col name">${frappe.utils.escape_html(itemName)}</div>
                    <div class="item-col qty">${item.qty}</div>
                    <div class="item-col total">${this.formatCurrency(item.rate * item.qty)}</div>
                `).appendTo(container);
      });
      $('<div class="item-row grand-total">').html(`
                <div class="item-col name">Grand Total</div>
                <div class="item-col qty"></div>
                <div class="item-col total">${this.formatCurrency(grandTotal)}</div>
            `).appendTo(container);
    }
    exportData() {
      const dataArray = Object.entries(this.data || {}).map(([key, value]) => ({
        name: key,
        qty: value.qty,
        total: value.rate * value.qty
      }));
      if (dataArray.length === 0) {
        frappe.msgprint("No data to export.");
        return;
      }
      const totalRecords = dataArray.length;
      const totalQty = dataArray.reduce((sum, item) => sum + (item.qty || 0), 0);
      const totalCost = dataArray.reduce((sum, item) => sum + (item.total || 0), 0);
      dataArray.push({
        name: "Total",
        qty: totalQty,
        total: totalCost
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataArray);
      const lastRowIndex = dataArray.length;
      ws[`A${lastRowIndex + 1}`] = { t: "s", v: "Total Records" };
      ws[`B${lastRowIndex + 1}`] = { t: "n", v: totalRecords };
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pricing/PricingController.js
  frappe.provide("pos_ar.Pricing");
  pos_ar.Pricing.PricingController = class {
    constructor(wrapper) {
      this.wrapper = $(wrapper).find(".layout-main-section");
      this.current_screen = "pricing";
      this.fetcher = new pos_ar.Pricing.PricingFetcher();
      this.setup_page();
      this.add_style();
      this.setup_events();
      this.load_companies();
      this.priceLists = [];
      this.brands = [];
      this.priceMap = {};
    }
    setup_page() {
      this.page_content = $(`
            <div class="pricing-container">
                <!-- Loading Popover -->
                <div id="loadingPopover" popover="manual">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Loading Prices</div>
                    </div>
                </div>

                <!-- Top App Bar -->
                <div class="pricing-top-bar">
                    <div class="top-bar-left">
                        <h2>Pricing Management</h2>
                    </div>
                    <div class="top-bar-filters">
                        <div class="filter-item">
                            <select class="form-control company-filter" placeholder="Company">
                            </select>
                        </div>
                    </div>
                    <div class="top-bar-right">
                        <button class="btn btn-primary">New Price</button>
                        <button class="btn btn-default">Import</button>
                        <button class="btn btn-default">Export</button>
                    </div>
                </div>

                <!-- Main Content Area with Sidebar -->
                <div class="pricing-main-content">
                    <!-- Sidebar Navigation -->
                    <div class="pricing-sidebar">
                        <div class="sidebar-nav">
                            <div class="nav-item active" data-screen="pricing">
                                <i class="fa fa-tag"></i>
                                <span>Pricing</span>
                            </div>
                            <div class="nav-item" data-screen="fixing">
                                <i class="fa fa-wrench"></i>
                                <span>Fixing</span>
                            </div>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="pricing-content">
                        <div class="screen pricing-screen active">
                            <!-- Pricing screen content will be loaded here -->
                        </div>
                        <div class="screen fixing-screen">
                            <!-- Fixing screen content will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `).appendTo(this.wrapper);
      this.loadingPopover = document.getElementById("loadingPopover");
    }
    setup_events() {
      this.wrapper.find(".nav-item").on("click", (e) => {
        const screen = $(e.currentTarget).data("screen");
        this.switch_screen(screen);
      });
      this.wrapper.find(".company-filter").on("change", (e) => {
        const company = $(e.currentTarget).val();
        this.filter_by_company(company);
      });
      this.wrapper.find(".btn-primary").on("click", () => {
        this.create_new_item_price();
      });
      this.wrapper.find('.btn-default:contains("Export")').on("click", () => {
        this.export_pricing_data();
      });
      this.wrapper.on("click", ".fix-prices", (e) => {
        const $button = $(e.currentTarget);
        const brand = $button.data("brand");
        const priceList = $button.data("price-list");
        const prices = this.priceMap[`${brand}_${priceList}`];
        const uniquePrices = [...new Set(prices.map((p) => p.price))];
        const d = new frappe.ui.Dialog({
          title: __(`Fix Prices for ${brand}`),
          fields: [
            {
              fieldtype: "HTML",
              fieldname: "current_prices",
              label: __("Current Prices"),
              options: `
                            <div class="current-prices-table">
                                <table class="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>${__("Current Price")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${uniquePrices.map((price) => `
                                            <tr>
                                                <td>${price}</td>
                                            </tr>
                                        `).join("")}
                                    </tbody>
                                </table>
                            </div>
                        `
            },
            {
              fieldtype: "Currency",
              fieldname: "new_price",
              label: __("New Price"),
              reqd: 1,
              description: __("This price will be applied to all items shown above")
            }
          ],
          primary_action_label: __("Update Prices"),
          primary_action: (values) => {
            frappe.call({
              method: "pos_ar.pos_ar.page.pricing.pricing.fix_prices",
              args: {
                brand,
                price_list: priceList,
                new_price: values.new_price
              },
              freeze: true,
              freeze_message: __("Fixing Prices..."),
              callback: (r) => {
                console.log("r : ", r);
                if (!r.exc) {
                  d.hide();
                  frappe.show_alert({
                    message: __("Prices fixed successfully"),
                    indicator: "green"
                  });
                  const company = $(".company-filter").val();
                  if (this.current_screen === "fixing") {
                    this.load_fixing_data(company);
                  } else {
                    this.load_pricing_data(company);
                  }
                }
              }
            });
          }
        });
        d.show();
      });
      $(document).off("click", ".edit-price").on("click", ".edit-price", function(e) {
        const itemName = $(this).data("name");
        if (itemName) {
          this.show_price_editor(itemName);
        }
      }.bind(this));
    }
    switch_screen(screen) {
      this.wrapper.find(".nav-item").removeClass("active");
      this.wrapper.find(`.nav-item[data-screen="${screen}"]`).addClass("active");
      this.wrapper.find(".screen").removeClass("active");
      this.wrapper.find(`.${screen}-screen`).addClass("active");
      this.current_screen = screen;
      const company = this.wrapper.find(".company-filter").val();
      if (screen === "fixing") {
        this.load_fixing_data(company);
      } else {
        this.load_pricing_data(company);
      }
    }
    load_companies() {
      frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Company",
          fields: ["name", "company_name"],
          order_by: "company_name asc"
        },
        callback: (response) => {
          if (response.message) {
            const companies = response.message;
            const $companyFilter = this.wrapper.find(".company-filter");
            $companyFilter.empty();
            companies.forEach((company) => {
              $companyFilter.append(`<option value="${company.name}">${company.company_name}</option>`);
            });
            if (frappe.defaults.get_default("company")) {
              $companyFilter.val(frappe.defaults.get_default("company"));
              this.filter_by_company(frappe.defaults.get_default("company"));
            } else {
              this.filter_by_company(companies[0].name);
            }
            $companyFilter.select2({
              placeholder: "Company",
              allowClear: true
            });
          }
        }
      });
    }
    filter_by_company(company) {
      if (this.current_screen === "pricing") {
        this.load_pricing_data(company);
      } else if (this.current_screen === "fixing") {
        this.load_fixing_data(company);
      }
    }
    async load_pricing_data(company) {
      if (!company)
        return;
      try {
        if (!this.loadingPopover) {
          this.loadingPopover = document.getElementById("loadingPopover");
        }
        if (this.loadingPopover.matches(":popover-open")) {
          this.loadingPopover.hidePopover();
        }
        requestAnimationFrame(() => {
          this.loadingPopover.showPopover();
        });
        const result = await this.fetcher.fetchItemPrices(company);
        const data = result.prices;
        this.priceLists = result.price_lists;
        this.brands = result.brands;
        this.loadingPopover.hidePopover();
        this.render_pricing_data(data, this.priceLists, this.brands);
      } catch (error) {
        if (this.loadingPopover) {
          this.loadingPopover.hidePopover();
        }
        frappe.msgprint({
          title: __("Error"),
          indicator: "red",
          message: __("Failed to load item prices")
        });
        console.error("Error loading item prices:", error);
      }
    }
    render_pricing_data(data, priceLists, brands) {
      const $pricingScreen = this.wrapper.find(".pricing-screen");
      $pricingScreen.empty();
      if (!data || data.length === 0) {
        $pricingScreen.html(`
                <div class="no-data-state">
                    <div class="no-data-icon">
                        <i class="fa fa-tag"></i>
                    </div>
                    <div class="no-data-message">
                        No item prices found for this company
                    </div>
                </div>
            `);
        return;
      }
      const savedOrder = JSON.parse(localStorage.getItem("priceListOrder") || "[]");
      if (savedOrder.length > 0) {
        priceLists.sort((a, b) => {
          const aIndex = savedOrder.indexOf(a.name);
          const bIndex = savedOrder.indexOf(b.name);
          if (aIndex === -1 && bIndex === -1)
            return 0;
          if (aIndex === -1)
            return 1;
          if (bIndex === -1)
            return -1;
          return aIndex - bIndex;
        });
      } else {
        localStorage.setItem("priceListOrder", JSON.stringify(priceLists.map((pl) => pl.name)));
      }
      this.priceMap = {};
      data.forEach((item) => {
        const key = `${item.brand || "No Brand"}_${item.price_list}`;
        if (!this.priceMap[key]) {
          this.priceMap[key] = [];
        }
        this.priceMap[key].push({
          name: item.name,
          price: item.price_list_rate,
          item_code: item.item_code
        });
      });
      const $content = $(`
            <div class="pricing-data">
                <div class="pricing-controls">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="search-wrapper">
                                <div class="search-field">
                                    <i class="fa fa-search search-icon"></i>
                                    <input type="text" class="form-control global-search" placeholder="Search across all columns...">
                                    <button class="btn btn-link btn-clear-search" style="display: none;">
                                        <i class="fa fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 text-right">
                            <button class="btn btn-default toggle-filters">
                                <i class="fa fa-filter"></i> Filters
                            </button>
                            <button class="btn btn-default clear-filters">
                                <i class="fa fa-times"></i> Clear
                            </button>
                        </div>
                    </div>
                </div>
                <div class="pricing-table">
                    <table class="table table-bordered table-hover">
                        <thead>
                            <tr class="headers">
                                <th class="sortable" data-sort="brand">
                                    Brand <i class="fa fa-sort"></i>
                                </th>
                                ${priceLists.map((pl) => `
                                    <th class="sortable draggable-header" data-sort="price" data-price-list="${pl.name}" draggable="true">
                                        <div class="header-content">
                                            <i class="fa fa-grip-vertical drag-handle"></i>
                                            ${pl.name} <i class="fa fa-sort"></i>
                                        </div>
                                    </th>
                                `).join("")}
                            </tr>
                            <tr class="filters" style="display: none;">
                                <td>
                                    <input type="text" class="form-control brand-filter" placeholder="Filter Brand...">
                                </td>
                                ${priceLists.map(() => `
                                    <td>
                                        <input type="text" class="form-control price-filter" placeholder="Filter Price...">
                                    </td>
                                `).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${brands.map((brand) => `
                                <tr>
                                    <td>${brand.brand || brand.name}</td>
                                    ${priceLists.map((pl) => {
        const priceData = this.priceMap[`${brand.name}_${pl.name}`] || [];
        const hasDifferentPrices = priceData.length > 1 && !priceData.every((item) => item.price === priceData[0].price);
        const allPricesForBrand = priceLists.map((plist) => {
          const data2 = this.priceMap[`${brand.name}_${plist.name}`] || [];
          return data2.length > 0 ? data2[0].price : 0;
        }).filter((price) => price > 0);
        const currentPrice = priceData.length > 0 ? priceData[0].price : 0;
        let priceClass = "";
        if (currentPrice > 0 && allPricesForBrand.length > 0) {
          const max = Math.max(...allPricesForBrand);
          const min = Math.min(...allPricesForBrand);
          const range = max - min;
          const threshold = range / 6;
          if (currentPrice >= max - threshold) {
            priceClass = "price-highest";
          } else if (currentPrice >= max - 2 * threshold) {
            priceClass = "price-high";
          } else if (currentPrice >= max - 3 * threshold) {
            priceClass = "price-medium-high";
          } else if (currentPrice >= max - 4 * threshold) {
            priceClass = "price-medium-low";
          } else if (currentPrice >= max - 5 * threshold) {
            priceClass = "price-low";
          } else {
            priceClass = "price-lowest";
          }
        }
        return `
                                            <td>
                                                ${priceData.length > 0 ? `<div class="price-cell ${hasDifferentPrices ? "different-prices" : ""} ${priceClass}">
                                                        <div class="price-value">
                                                            ${frappe.format(priceData[0].price, { fieldtype: "Currency" })}
                                                            <button class="btn btn-xs btn-default edit-price" 
                                                                data-name="${priceData[0].name}"
                                                                title="Edit Price">
                                                                <i class="fa fa-pencil"></i>
                                                            </button>
                                                        </div>
                                                    </div>` : ""}
                                            </td>
                                        `;
      }).join("")}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `);
      this.setupTableEvents($content);
      const style = $(`
            <style>
                .pricing-table {
                    height: calc(100vh - 300px);
                    overflow: auto;
                }
                .pricing-table table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 0;
                }
                .pricing-table th, .pricing-table td {
                    text-align: center;
                    padding: 12px;
                    vertical-align: middle;
                }
                .pricing-table th:first-child, 
                .pricing-table td:first-child {
                    text-align: left;
                    font-weight: bold;
                    position: sticky;
                    left: 0;
                    background: var(--bg-color);
                    z-index: 1;
                }
                .pricing-table .headers th {
                    background-color: var(--bg-gray);
                    position: sticky;
                    top: 0;
                    z-index: 2;
                }
                .pricing-table .headers th:first-child {
                    z-index: 3;
                }
                .pricing-table .sortable {
                    cursor: pointer;
                }
                .pricing-table .sortable:hover {
                    background-color: var(--bg-light-gray);
                }
                .pricing-table .filters input {
                    width: 100%;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .price-cell {
                    display: flex;
                    flex-direction: column;
                    gap: var(--margin-xs);
                    align-items: center;
                }
                .price-value {
                    display: flex;
                    align-items: center;
                    gap: var(--margin-xs);
                    font-weight: 500;
                    color: var(--text-color);
                }
                .no-price {
                    color: var(--text-muted);
                    font-style: italic;
                }
                .edit-price {
                    visibility: hidden;
                    padding: var(--padding-xs) !important;
                    min-width: 28px;
                    min-height: 28px;
                    border: 1px solid var(--border-color);
                    background: var(--control-bg);
                    color: var(--text-color);
                    border-radius: var(--border-radius-sm);
                    transition: all 0.2s;
                }
                .price-cell:hover .edit-price {
                    visibility: visible;
                }
                .pricing-controls {
                    padding: var(--padding-md);
                    margin-bottom: var(--margin-lg);
                }
                .search-wrapper {
                    max-width: 500px;
                }
                .search-field {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: var(--control-bg);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    transition: all 0.2s;
                }
                .search-field:focus-within {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px var(--primary-color-light);
                }
                .search-icon {
                    color: var(--text-muted);
                    padding: 0 var(--padding-sm);
                    font-size: 14px;
                }
                .search-field .form-control {
                    border: none;
                    box-shadow: none;
                    padding: var(--padding-sm) var(--padding-xs);
                    background: transparent;
                    height: 40px;
                    font-size: var(--text-base);
                }
                .search-field .form-control:focus {
                    outline: none;
                }
                .btn-clear-search {
                    color: var(--text-muted);
                    padding: var(--padding-xs) var(--padding-sm);
                    margin-right: 2px;
                }
                .btn-clear-search:hover {
                    color: var(--text-color);
                }
                .toggle-filters, .clear-filters {
                    padding: var(--padding-sm) var(--padding-md);
                    font-weight: 500;
                    border-radius: var(--border-radius-lg);
                    margin-left: var(--margin-sm);
                    transition: all 0.2s ease;
                }
                .toggle-filters:hover, .clear-filters:hover {
                    background-color: var(--fg-hover-color);
                    border-color: var(--gray-600);
                }
                .price-cell.different-prices {
                    border: 2px solid red !important;
                }
                .price-warning {
                    color: red;
                    font-size: 0.8em;
                    margin-top: 2px;
                }
                .price-highest {
                    background-color: rgba(0, 255, 0, 0.35) !important;
                }
                .price-high {
                    background-color: rgba(100, 255, 0, 0.35) !important;
                }
                .price-medium-high {
                    background-color: rgba(200, 255, 0, 0.35) !important;
                }
                .price-medium-low {
                    background-color: rgba(255, 165, 0, 0.35) !important;
                }
                .price-low {
                    background-color: rgba(255, 100, 0, 0.35) !important;
                }
                .price-lowest {
                    background-color: rgba(255, 0, 0, 0.35) !important;
                }
                .price-cell {
                    padding: 8px;
                    border-radius: 4px;
                }
                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: grab;
                }
                .drag-handle {
                    color: var(--text-muted);
                    cursor: grab;
                }
                .draggable-header.dragging {
                    opacity: 0.5;
                    background: var(--bg-light-gray);
                }
            </style>
        `);
      $pricingScreen.append(style).append($content);
    }
    async load_fixing_data(company) {
      if (!company)
        return;
      try {
        if (!this.loadingPopover) {
          this.loadingPopover = document.getElementById("loadingPopover");
        }
        if (this.loadingPopover.matches(":popover-open")) {
          this.loadingPopover.hidePopover();
        }
        requestAnimationFrame(() => {
          this.loadingPopover.showPopover();
        });
        const result = await this.fetcher.fetchAllItemPrices(company);
        const data = result.prices;
        this.priceLists = result.price_lists;
        this.brands = result.brands;
        this.loadingPopover.hidePopover();
        this.render_Fixing_data(data, this.priceLists, this.brands);
      } catch (error) {
        if (this.loadingPopover) {
          this.loadingPopover.hidePopover();
        }
        frappe.msgprint({
          title: __("Error"),
          indicator: "red",
          message: __("Failed to load item prices")
        });
        console.error("Error loading item prices:", error);
      }
    }
    render_Fixing_data(data, priceLists, brands) {
      const $fixingScreen = this.wrapper.find(".fixing-screen");
      $fixingScreen.empty();
      if (!data || data.length === 0) {
        $fixingScreen.html(`
                <div class="no-data-state">
                    <div class="no-data-icon">
                        <i class="fa fa-tag"></i>
                    </div>
                    <div class="no-data-message">
                        No item prices found for this company
                    </div>
                </div>
            `);
        return;
      }
      const savedOrder = JSON.parse(localStorage.getItem("priceListOrder") || "[]");
      if (savedOrder.length > 0) {
        priceLists.sort((a, b) => {
          const aIndex = savedOrder.indexOf(a.name);
          const bIndex = savedOrder.indexOf(b.name);
          if (aIndex === -1 && bIndex === -1)
            return 0;
          if (aIndex === -1)
            return 1;
          if (bIndex === -1)
            return -1;
          return aIndex - bIndex;
        });
      } else {
        localStorage.setItem("priceListOrder", JSON.stringify(priceLists.map((pl) => pl.name)));
      }
      this.priceMap = {};
      data.forEach((item) => {
        const key = `${item.brand || "No Brand"}_${item.price_list}`;
        if (!this.priceMap[key]) {
          this.priceMap[key] = [];
        }
        this.priceMap[key].push({
          name: item.name,
          price: item.price_list_rate,
          item_code: item.item_code
        });
      });
      const $content = $(`
            <div class="pricing-data">
                <div class="pricing-controls">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="search-wrapper">
                                <div class="search-field">
                                    <i class="fa fa-search search-icon"></i>
                                    <input type="text" class="form-control global-search" placeholder="Search across all columns...">
                                    <button class="btn btn-link btn-clear-search" style="display: none;">
                                        <i class="fa fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 text-right">
                            <button class="btn btn-default toggle-filters">
                                <i class="fa fa-filter"></i> Filters
                            </button>
                            <button class="btn btn-default clear-filters">
                                <i class="fa fa-times"></i> Clear
                            </button>
                        </div>
                    </div>
                </div>
                <div class="pricing-table">
                    <table class="table table-bordered table-hover">
                        <thead>
                            <tr class="headers">
                                <th class="sortable" data-sort="brand">
                                    Brand <i class="fa fa-sort"></i>
                                </th>
                                ${priceLists.map((pl) => `
                                    <th class="sortable draggable-header" data-sort="price" data-price-list="${pl.name}" draggable="true">
                                        <div class="header-content">
                                            <i class="fa fa-grip-vertical drag-handle"></i>
                                            ${pl.name} <i class="fa fa-sort"></i>
                                        </div>
                                    </th>
                                `).join("")}
                            </tr>
                            <tr class="filters" style="display: none;">
                                <td>
                                    <input type="text" class="form-control brand-filter" placeholder="Filter Brand...">
                                </td>
                                ${priceLists.map(() => `
                                    <td>
                                        <input type="text" class="form-control price-filter" placeholder="Filter Price...">
                                    </td>
                                `).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${brands.map((brand) => `
                                <tr>
                                    <td>
                                        ${brand.brand || brand.name}
                                        <button class="btn btn-xs btn-primary btn-modern set-brand-prices" style="display:none;"
                                            data-brand="${brand.name}"
                                            title="Set Prices for All Items">
                                            Set Prices
                                        </button>
                                    </td>
                                    ${priceLists.map((pl) => {
        const priceData = this.priceMap[`${brand.name}_${pl.name}`] || [];
        const hasDifferentPrices = priceData.length > 1 && !priceData.every((item) => item.price === priceData[0].price);
        const allPricesForBrand = priceLists.map((plist) => {
          const data2 = this.priceMap[`${brand.name}_${plist.name}`] || [];
          return data2.length > 0 ? data2[0].price : 0;
        }).filter((price) => price > 0);
        const currentPrice = priceData.length > 0 ? priceData[0].price : 0;
        let priceClass = "";
        if (currentPrice > 0 && allPricesForBrand.length > 0) {
          const max = Math.max(...allPricesForBrand);
          const min = Math.min(...allPricesForBrand);
          const range = max - min;
          const threshold = range / 6;
          if (currentPrice >= max - threshold) {
            priceClass = "price-highest";
          } else if (currentPrice >= max - 2 * threshold) {
            priceClass = "price-high";
          } else if (currentPrice >= max - 3 * threshold) {
            priceClass = "price-medium-high";
          } else if (currentPrice >= max - 4 * threshold) {
            priceClass = "price-medium-low";
          } else if (currentPrice >= max - 5 * threshold) {
            priceClass = "price-low";
          } else {
            priceClass = "price-lowest";
          }
        }
        return `
                                            <td>
                                                ${priceData.length > 0 ? `<div class="price-cell ${hasDifferentPrices ? "different-prices" : ""} ${priceClass}">
                                                        <div class="price-value">
                                                            ${frappe.format(priceData[0].price, { fieldtype: "Currency" })}
                                                            ${hasDifferentPrices ? `
                                                                <div class="price-warning">(Multiple prices)</div>
                                                                <button class="btn btn-xs btn-danger btn-modern fix-prices" 
                                                                    data-brand="${brand.name}"
                                                                    data-price-list="${pl.name}"
                                                                    title="Fix Price Discrepancy">
                                                                    Fix
                                                                </button>` : ""}
                                                            <button class="btn btn-xs btn-default btn-modern edit-price" 
                                                                data-name="${priceData[0].name}"
                                                                title="Edit Price">
                                                                <i class="fa fa-pencil"></i>
                                                            </button>
                                                        </div>
                                                    </div>` : ""}
                                            </td>
                                        `;
      }).join("")}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `);
      this.setupTableEvents($content);
      const style = $(`
            <style>
                .pricing-table {
                    height: calc(100vh - 300px);
                    overflow: auto;
                }
                .pricing-table table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 0;
                }
                .pricing-table th, .pricing-table td {
                    text-align: center;
                    padding: 12px;
                    vertical-align: middle;
                }
                .pricing-table th:first-child, 
                .pricing-table td:first-child {
                    text-align: left;
                    font-weight: bold;
                    position: sticky;
                    left: 0;
                    background: var(--bg-color);
                    z-index: 1;
                }
                .pricing-table .headers th {
                    background-color: var(--bg-gray);
                    position: sticky;
                    top: 0;
                    z-index: 2;
                }
                .pricing-table .headers th:first-child {
                    z-index: 3;
                }
                .pricing-table .sortable {
                    cursor: pointer;
                }
                .pricing-table .sortable:hover {
                    background-color: var(--bg-light-gray);
                }
                .pricing-table .filters input {
                    width: 100%;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .price-cell {
                    display: flex;
                    flex-direction: column;
                    gap: var(--margin-xs);
                    align-items: center;
                }
                .price-value {
                    display: flex;
                    align-items: center;
                    gap: var(--margin-xs);
                    font-weight: 500;
                    color: var(--text-color);
                }
                .no-price {
                    color: var(--text-muted);
                    font-style: italic;
                }
                .edit-price {
                    visibility: hidden;
                    padding: var(--padding-xs) !important;
                    min-width: 28px;
                    min-height: 28px;
                    border: 1px solid var(--border-color);
                    background: var(--control-bg);
                    color: var(--text-color);
                    border-radius: var(--border-radius-sm);
                    transition: all 0.2s;
                }
                .price-cell:hover .edit-price {
                    visibility: visible;
                }
                .pricing-controls {
                    padding: var(--padding-md);
                    margin-bottom: var(--margin-lg);
                }
                .search-wrapper {
                    max-width: 500px;
                }
                .search-field {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: var(--control-bg);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    transition: all 0.2s;
                }
                .search-field:focus-within {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px var(--primary-color-light);
                }
                .search-icon {
                    color: var(--text-muted);
                    padding: 0 var(--padding-sm);
                    font-size: 14px;
                }
                .search-field .form-control {
                    border: none;
                    box-shadow: none;
                    padding: var(--padding-sm) var(--padding-xs);
                    background: transparent;
                    height: 40px;
                    font-size: var(--text-base);
                }
                .search-field .form-control:focus {
                    outline: none;
                }
                .btn-clear-search {
                    color: var(--text-muted);
                    padding: var(--padding-xs) var(--padding-sm);
                    margin-right: 2px;
                }
                .btn-clear-search:hover {
                    color: var(--text-color);
                }
                .toggle-filters, .clear-filters {
                    padding: var(--padding-sm) var(--padding-md);
                    font-weight: 500;
                    border-radius: var(--border-radius-lg);
                    margin-left: var(--margin-sm);
                    transition: all 0.2s ease;
                }
                .toggle-filters:hover, .clear-filters:hover {
                    background-color: var(--fg-hover-color);
                    border-color: var(--gray-600);
                }
                .price-cell.different-prices {
                    border: 2px solid red !important;
                }
                .price-warning {
                    color: red;
                    font-size: 0.8em;
                    margin-top: 2px;
                    margin-bottom: 4px;
                }
                .fix-prices {
                    margin-top: 4px;
                    margin-left: 4px;
                }
                .edit-price {
                    margin-left: 4px;
                }
                .btn-modern {
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .btn-modern:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
                }

                .btn-modern:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .btn-modern.btn-danger {
                    background: #ff4d4d;
                    color: white;
                }

                .btn-modern.btn-danger:hover {
                    background: #ff3333;
                }

                .btn-modern.btn-default {
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .btn-modern.btn-default:hover {
                    background: var(--surface-color);
                }

                .btn-modern.btn-xs {
                    padding: 4px 8px;
                    font-size: 12px;
                }
                .price-highest {
                    background-color: rgba(0, 255, 0, 0.35) !important;
                }
                .price-high {
                    background-color: rgba(100, 255, 0, 0.35) !important;
                }
                .price-medium-high {
                    background-color: rgba(200, 255, 0, 0.35) !important;
                }
                .price-medium-low {
                    background-color: rgba(255, 165, 0, 0.35) !important;
                }
                .price-low {
                    background-color: rgba(255, 100, 0, 0.35) !important;
                }
                .price-lowest {
                    background-color: rgba(255, 0, 0, 0.35) !important;
                }
                .price-cell {
                    padding: 8px;
                    border-radius: 4px;
                }
                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: grab;
                }
                .drag-handle {
                    color: var(--text-muted);
                    cursor: grab;
                }
                .draggable-header.dragging {
                    opacity: 0.5;
                    background: var(--bg-light-gray);
                }
            </style>
        `);
      $fixingScreen.append(style).append($content);
    }
    setupTableEvents($content) {
      const self = this;
      $content.find(".toggle-filters").on("click", function() {
        $content.find(".filters").toggle();
      });
      $content.find(".clear-filters").on("click", function() {
        $content.find(".filters input, .global-search").val("");
        $content.find("tbody tr").show();
      });
      $content.find(".global-search").on("input", function() {
        const searchTerm = $(this).val().toLowerCase();
        $content.find("tbody tr").each(function() {
          const $row = $(this);
          const text = $row.text().toLowerCase();
          $row.toggle(text.includes(searchTerm));
        });
      });
      $content.find(".brand-filter, .price-filter").on("input", function() {
        const $filters = $content.find(".filters input");
        const filterValues = $filters.map(function() {
          return {
            column: $(this).closest("td").index(),
            value: $(this).val().toLowerCase()
          };
        }).get();
        $content.find("tbody tr").each(function() {
          const $row = $(this);
          const visible = filterValues.every((filter) => {
            const cellText = $row.find(`td:eq(${filter.column})`).text().toLowerCase();
            return !filter.value || cellText.includes(filter.value);
          });
          $row.toggle(visible);
        });
      });
      let currentSort = { column: null, direction: "asc" };
      $content.find(".sortable").on("click", function() {
        const column = $(this).data("sort");
        const priceList = $(this).data("price-list");
        const columnIndex = $(this).index();
        if (currentSort.column === columnIndex) {
          currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
        } else {
          currentSort = { column: columnIndex, direction: "asc" };
        }
        $content.find(".sortable i").attr("class", "fa fa-sort");
        $(this).find("i").attr("class", `fa fa-sort-${currentSort.direction}`);
        const rows = $content.find("tbody tr").get();
        rows.sort((a, b) => {
          let aVal = $(a).find(`td:eq(${columnIndex})`).text();
          let bVal = $(b).find(`td:eq(${columnIndex})`).text();
          if (column === "price") {
            aVal = parseFloat(aVal.replace(/[^0-9.-]+/g, "")) || 0;
            bVal = parseFloat(bVal.replace(/[^0-9.-]+/g, "")) || 0;
          }
          if (currentSort.direction === "asc") {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
        $content.find("tbody").html(rows);
      });
      $content.on("click", ".set-brand-prices", (e) => {
        const brand = $(e.currentTarget).data("brand");
        frappe.confirm(
          `This will set prices for all items of brand "${brand}". Do you want to continue?`,
          () => {
            frappe.call({
              method: "pos_ar.pos_ar.page.pricing.pricing.add_price_for_all_item_by_brand2",
              args: {
                brand
              },
              freeze: true,
              freeze_message: __("Setting Prices..."),
              callback: (r) => {
                if (!r.exc) {
                  frappe.show_alert({
                    message: __("Prices set successfully"),
                    indicator: "green"
                  });
                  const company = $(".company-filter").val();
                  if (this.current_screen === "fixing") {
                    this.load_fixing_data(company);
                  } else {
                    this.load_pricing_data(company);
                  }
                }
              }
            });
          }
        );
      });
      $content.on("click", ".edit-price", (e) => {
        e.stopPropagation();
        const itemName = $(e.currentTarget).data("name");
        this.show_price_editor(itemName);
      });
      const $headers = $content.find(".draggable-header");
      let draggedHeader = null;
      $headers.each((_, header) => {
        $(header).on("dragstart", (e) => {
          draggedHeader = header;
          $(header).addClass("dragging");
          e.originalEvent.dataTransfer.setData("text/plain", $(header).data("priceList"));
        });
        $(header).on("dragend", () => {
          $(draggedHeader).removeClass("dragging");
          draggedHeader = null;
        });
        $(header).on("dragover", (e) => {
          e.preventDefault();
        });
        $(header).on("drop", (e) => {
          e.preventDefault();
          if (!draggedHeader || draggedHeader === header)
            return;
          const $allHeaders = $content.find(".draggable-header");
          const draggedIndex = $allHeaders.index(draggedHeader);
          const dropIndex = $allHeaders.index(header);
          const $rows = $content.find("tr");
          $rows.each((_2, row) => {
            const $cells = $(row).find("td, th");
            const $draggedCell = $cells.eq(draggedIndex + 1);
            const $dropCell = $cells.eq(dropIndex + 1);
            const draggedHtml = $draggedCell.html();
            const dropHtml = $dropCell.html();
            const draggedData = {
              sort: $draggedCell.data("sort"),
              priceList: $draggedCell.data("priceList")
            };
            const dropData = {
              sort: $dropCell.data("sort"),
              priceList: $dropCell.data("priceList")
            };
            $draggedCell.html(dropHtml);
            $dropCell.html(draggedHtml);
            if ($(row).hasClass("headers")) {
              $draggedCell.data(dropData);
              $dropCell.data(draggedData);
            }
          });
          const currentOrder = JSON.parse(localStorage.getItem("priceListOrder") || "[]");
          const draggedPriceList = $(draggedHeader).data("priceList");
          const dropPriceList = $(header).data("priceList");
          const newOrder = currentOrder.filter((pl) => pl !== draggedPriceList && pl !== dropPriceList);
          const baseIndex = Math.min(currentOrder.indexOf(dropPriceList), currentOrder.indexOf(draggedPriceList));
          newOrder.splice(baseIndex, 0, dropPriceList, draggedPriceList);
          localStorage.setItem("priceListOrder", JSON.stringify(newOrder));
        });
      });
    }
    create_new_item_price() {
      const company = this.wrapper.find(".company-filter").val();
      if (!company) {
        frappe.throw(__("Please select a company first"));
        return;
      }
      frappe.prompt([
        {
          label: "Brand",
          fieldname: "brand",
          fieldtype: "Link",
          options: "Brand",
          reqd: 1
        },
        {
          label: "Price List",
          fieldname: "price_list",
          fieldtype: "Link",
          options: "Price List",
          reqd: 1
        },
        {
          label: "Price List Rate",
          fieldname: "price_list_rate",
          fieldtype: "Currency",
          reqd: 1
        }
      ], (values) => {
        frappe.db.get_list("Item", {
          filters: {
            brand: values.brand
          }
        }).then((items) => {
          if (items.length > 0) {
            const item_code = items[0].name;
            frappe.call({
              method: "frappe.client.insert",
              args: {
                doc: {
                  doctype: "Item Price",
                  item_code,
                  price_list: values.price_list,
                  price_list_rate: values.price_list_rate,
                  company
                }
              },
              callback: (r) => {
                if (r.message) {
                  frappe.show_alert({
                    message: __("Item Price created successfully"),
                    indicator: "green"
                  });
                  this.load_pricing_data(company);
                }
              }
            });
          } else {
            frappe.msgprint({
              title: __("Error"),
              indicator: "red",
              message: __("No item with the specified brand exists. Please create an item with the specified brand first.")
            });
          }
        });
      }, "Create New Item Price", "Create");
    }
    show_price_editor(itemPriceName) {
      frappe.db.get_doc("Item Price", itemPriceName).then((doc) => {
        frappe.prompt([
          {
            label: "Current Price",
            fieldname: "current_price",
            fieldtype: "Currency",
            read_only: 1,
            default: doc.price_list_rate
          },
          {
            label: "New Price",
            fieldname: "new_price",
            fieldtype: "Currency",
            reqd: 1
          }
        ], (values) => {
          frappe.call({
            method: "pos_ar.pos_ar.page.pricing.pricing.fix_prices",
            args: {
              brand: doc.brand,
              price_list: doc.price_list,
              new_price: values.new_price
            },
            freeze: true,
            freeze_message: __("Updating Price..."),
            callback: (r) => {
              if (r.exc) {
                frappe.msgprint({
                  title: __("Error"),
                  indicator: "red",
                  message: __("Failed to update price")
                });
                return;
              }
              frappe.show_alert({
                message: __("Price updated successfully"),
                indicator: "green"
              });
              const $editButton = $(`.edit-price[data-name="${itemPriceName}"]`);
              if ($editButton.length) {
                const $priceCell = $editButton.closest(".price-cell");
                if ($priceCell.length) {
                  const formattedPrice = frappe.format(values.new_price, { fieldtype: "Currency" });
                  $priceCell.html(`
                                        <div class="price-value">
                                            ${formattedPrice}
                                            <button class="btn btn-xs btn-default edit-price" 
                                                data-name="${itemPriceName}"
                                                title="Edit Price">
                                                <i class="fa fa-pencil"></i>
                                            </button>
                                        </div>
                                    `);
                }
              }
            }
          });
        }, __("Update Price"), __("Update"));
      }).catch((err) => {
        console.error(err);
        frappe.msgprint({
          title: __("Error"),
          indicator: "red",
          message: __("Failed to fetch price details")
        });
      });
    }
    export_pricing_data() {
      const company = this.wrapper.find(".company-filter").val();
      if (!company) {
        frappe.msgprint({
          title: __("Error"),
          indicator: "red",
          message: __("Please select a company first")
        });
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Brand," + this.priceLists.map((pl) => pl.name).join(",") + "\n";
      console.log("the price lists : ", csvContent);
      this.brands.forEach((brand) => {
        let row = brand.brand;
        this.priceLists.forEach((pl) => {
          const data_price = this.priceMap[`${brand.name}_${pl.name}`] || [];
          row += "," + (data_price.length > 0 ? data_price.map((pd) => pd.price).join(",") : "empty");
        });
        csvContent += row + "\n";
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pricing_matrix_${company}.csv`);
      document.body.appendChild(link);
      link.click();
    }
    add_style() {
      this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/pricing_page/main.css">');
      const style = `
            <style>
                :root {
                    --primary-color: #4f46e5;
                    --primary-hover: #4338ca;
                    --bg-color: #f8fafc;
                    --surface-color: #ffffff;
                    --text-primary: #1e293b;
                    --text-secondary: #64748b;
                    --border-color: #e2e8f0;
                }

                .pricing-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    overflow: hidden;
                    background: var(--bg-color);
                    padding: 1.5rem;
                    gap: 1.5rem;
                }

                .pricing-top-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    background: var(--surface-color);
                    border-radius: 1rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
                    gap: 2rem;
                }

                .top-bar-left h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                    letter-spacing: -0.025em;
                }

                .top-bar-filters {
                    display: flex;
                    gap: 1rem;
                    flex: 1;
                    position: relative;
                }

                .filter-item {
                    min-width: 240px;
                    position: relative;
                }

                .filter-item::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 14px;
                    padding: 2px;
                    background: linear-gradient(135deg, var(--primary-color), #818cf8);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .filter-item:hover::before {
                    opacity: 0.5;
                }

                .filter-item .select2-container {
                    width: 100% !important;
                }

                .filter-item .select2-container .select2-selection--single {
                    height: 48px;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                }

                .filter-item .select2-container .select2-selection--single:hover {
                    border-color: var(--text-secondary);
                    transform: translateY(-1px);
                }

                .filter-item .select2-container.select2-container--focus .select2-selection--single {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 4px var(--primary-color-light);
                }

                .filter-item .select2-container .select2-selection--single .select2-selection__rendered {
                    line-height: 48px;
                    padding: 0 1.25rem;
                    color: var(--text-primary);
                    font-weight: 500;
                    font-size: 0.9375rem;
                }

                .filter-item .select2-container .select2-selection--single .select2-selection__placeholder {
                    color: var(--text-secondary);
                    font-weight: 400;
                }

                .filter-item .select2-container .select2-selection--single .select2-selection__arrow {
                    height: 48px;
                    width: 48px;
                    position: absolute;
                    right: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .filter-item .select2-container .select2-selection--single .select2-selection__arrow b {
                    display: none;
                }

                .filter-item .select2-container .select2-selection--single .select2-selection__arrow::after {
                    content: '';
                    width: 10px;
                    height: 10px;
                    border: 2px solid var(--text-secondary);
                    border-left: 0;
                    border-top: 0;
                    transform: rotate(45deg) translateY(-2px);
                    transition: all 0.2s;
                }

                .filter-item .select2-container.select2-container--open .select2-selection--single .select2-selection__arrow::after {
                    transform: rotate(-135deg) translateY(-2px);
                    border-color: var(--primary-color);
                }

                .top-bar-right {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn {
                    height: 42px;
                    padding: 0 1.5rem;
                    border-radius: 0.75rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                    border: none;
                }

                .btn-primary:hover {
                    background: var(--primary-hover);
                    transform: translateY(-1px);
                }

                .btn-default {
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .btn-default:hover {
                    border-color: var(--text-secondary);
                    transform: translateY(-1px);
                }

                .pricing-main-content {
                    display: flex;
                    flex: 1;
                    gap: 1.5rem;
                    height: calc(100vh - 120px);
                    overflow: hidden;
                }

                .pricing-sidebar {
                    width: 280px;
                    background: var(--surface-color);
                    border-radius: 1rem;
                    padding: 1.25rem 1rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    transition: all 0.15s;
                    color: var(--text-secondary);
                }

                .nav-item:hover {
                    color: var(--text-primary);
                    background: var(--bg-color);
                }

                .nav-item.active {
                    color: var(--primary-color);
                    background: rgba(79, 70, 229, 0.1);
                    font-weight: 500;
                }

                .nav-item i {
                    font-size: 1.25rem;
                    width: 24px;
                }

                .pricing-content {
                    flex: 1;
                    background: var(--surface-color);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
                    overflow-y: auto;
                }

                .screen {
                    display: none;
                }

                .screen.active {
                    display: block;
                }

                /* Custom scrollbar */
                .pricing-content::-webkit-scrollbar {
                    width: 6px;
                }

                .pricing-content::-webkit-scrollbar-track {
                    background: transparent;
                }

                .pricing-content::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 3px;
                }

                .pricing-content::-webkit-scrollbar-thumb:hover {
                    background: var(--text-secondary);
                }

                /* Loading Popover Styles */
                #loadingPopover {
                    position: fixed;
                    inset: 0;
                    margin: auto;
                    width: max-content;
                    height: max-content;
                    background: rgba(255, 255, 255, 0.98);
                    padding: 2.5rem 3rem;
                    border-radius: 1.2rem;
                    box-shadow: 0 8px 16px -1px rgba(0, 0, 0, 0.1), 
                               0 4px 8px -1px rgba(0, 0, 0, 0.06);
                    border: none;
                    z-index: 1000;
                }

                #loadingPopover::backdrop {
                    background: rgba(0, 0, 0, 0.25);
                    backdrop-filter: blur(6px);
                }

                .loading-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.25rem;
                }

                .loading-spinner {
                    width: 48px;
                    height: 48px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .loading-text {
                    color: var(--text-primary);
                    font-weight: 500;
                    font-size: 1.1rem;
                    letter-spacing: -0.01em;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .price-highest {
                    background-color: rgba(0, 255, 0, 0.35) !important;
                }
                .price-high {
                    background-color: rgba(100, 255, 0, 0.35) !important;
                }
                .price-medium-high {
                    background-color: rgba(200, 255, 0, 0.35) !important;
                }
                .price-medium-low {
                    background-color: rgba(255, 165, 0, 0.35) !important;
                }
                .price-low {
                    background-color: rgba(255, 100, 0, 0.35) !important;
                }
                .price-lowest {
                    background-color: rgba(255, 0, 0, 0.35) !important;
                }
                .price-cell {
                    padding: 8px;
                    border-radius: 4px;
                }
                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: grab;
                }
                .drag-handle {
                    color: var(--text-muted);
                    cursor: grab;
                }
                .draggable-header.dragging {
                    opacity: 0.5;
                    background: var(--bg-light-gray);
                }
            </style>
        `;
      this.wrapper.append(style);
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pricing/remote/fetcher.js
  pos_ar.Pricing.PricingFetcher = class {
    constructor() {
      console.log("PricingFetcher initialized");
    }
    async fetchItemPrices(company) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_item_prices",
          args: { company }
        });
        console.log("fetched item prices", response.message);
        return response.message || [];
      } catch (error) {
        console.error("Error fetching item prices:", error);
        return [];
      }
    }
    async fetchAllItemPrices(company) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.page.pricing.pricing.get_all_item_prices",
          args: { company }
        });
        console.log("fetched item prices", response.message);
        return response.message || [];
      } catch (error) {
        console.error("Error fetching item prices:", error);
        return [];
      }
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/posController.js
  pos_ar.PointOfSale.Controller = class {
    constructor(wrapper) {
      this.wrapper = $(wrapper).find(".layout-main-section");
      this.page = wrapper.page;
      this.selectedItemMaps = /* @__PURE__ */ new Map();
      this.selectedItem = { "name": "" };
      this.selectedField = { "field_name": "" };
      this.selectedTab = { "tabName": "" };
      this.selectedPaymentMethod = { "methodName": "" };
      this.defaultCustomer = { "name": "", "customer_name": "" };
      this.defaultPriceList = { "name": "" };
      this.taxes_and_charges_template = null;
      this.taxes_and_charges = [];
      this.payment_methods = [];
      this.POSOpeningEntry = {};
      this.invoiceData = { netTotal: 0, grandTotal: 0, paidAmount: 0, toChange: 0, discount: 0 };
      this.db = null;
      this.syncInput = false;
      this.start_app();
    }
    async start_app() {
      try {
        this.db = await pos_ar.PointOfSale.pos_db.openDatabase();
        this.settings_data = new pos_ar.PointOfSale.posSettingsData(this.db);
        this.dataHandler = new pos_ar.PointOfSale.FetchHandler();
        this.appData = new pos_ar.PointOfSale.posAppData(this.db, this.dataHandler);
        await this.appData.getAllData();
        this.screenManager = new pos_ar.PointOfSale.ScreenManager(this.settings_data);
        this.toggleKeyboardMode(!this.settings_data.settings.showItemDetails);
        this.prepare_container();
        await this.prepare_app_data();
        await this.checkForPOSEntry();
        await this.prepare_components();
        this.checkUnSyncedPos();
        this.setListeners();
        const openedPos = await this.appData.getAndDeleteAllOpenedPosInvoice();
        this.restorePosInvoices(openedPos);
      } catch (err) {
        console.error("halfware POS Err ==> ", err);
      }
    }
    async prepare_app_data() {
      try {
        await this.handleAppData();
        let priceList = this.getCustomerDefaultPriceList(this.defaultCustomer.name);
        if (priceList == "" || priceList == null || priceList == void 0) {
          priceList = this.defaultPriceList.name;
        }
        let new_pos_invoice = frappe.model.get_new_doc("POS Invoice");
        new_pos_invoice.customer = this.defaultCustomer.name;
        new_pos_invoice.pos_profile = this.appData.appData.pos_profile.name;
        new_pos_invoice.items = [];
        new_pos_invoice.taxes_and_charges = this.appData.appData.pos_profile.taxes_and_charges;
        new_pos_invoice.additional_discount_percentage = 0;
        new_pos_invoice.paid_amount = 0;
        new_pos_invoice.base_paid_amount = 0;
        new_pos_invoice.creation_time = frappe.datetime.now_datetime();
        new_pos_invoice.payments = this.getPaymentMethods();
        new_pos_invoice.is_pos = 1;
        new_pos_invoice.update_stock = 1;
        new_pos_invoice.docstatus = 0;
        new_pos_invoice.status = "Draft";
        new_pos_invoice.priceList = priceList;
        new_pos_invoice.opened = 1;
        const date = new Date();
        const [year, month, day] = date.toISOString().split("T")[0].split("-");
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getMilliseconds();
        new_pos_invoice.refNum = this.appData.appData.pos_profile.name + "-" + year + "-" + month + "-" + day + "-" + hour + minutes + seconds;
        new_pos_invoice.custom_cach_name = new_pos_invoice.refNum;
        this.selectedItemMaps.set("C1", new_pos_invoice);
        this.selectedTab.tabName = `C1`;
      } catch (err) {
        console.error("Hlafware POS Error ==> ", err);
        throw err;
      }
    }
    async handleAppData() {
      if (this.appData.appData.pos_profile == null) {
        frappe.set_route("Form", "POS Profile");
        throw new Error("there is no pos profile");
      }
      if (this.appData.appData.pos_profile.taxes_and_charges != null && this.appData.appData.pos_profile.taxes_and_charges != "") {
        this.taxes_and_charges_template = await this.dataHandler.fetchSalesTaxesAndChargesTemplate(this.appData.appData.pos_profile.taxes_and_charges);
        this.taxes_and_charges = this.taxes_and_charges_template.taxes;
      }
      if (this.appData.appData.pos_profile.company != null && this.appData.appData.pos_profile.company != "") {
        this.company = await this.dataHandler.fetchCompany(this.appData.appData.pos_profile.company);
      }
      if (this.appData.appData.customers.length > 0) {
        this.defaultCustomer = structuredClone(this.appData.appData.customers[0]);
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
      if (this.appData.appData.price_lists.length > 0) {
        this.defaultPriceList.name = this.appData.appData.pos_profile.selling_price_list;
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
      this.wrapper.append('<div id="MainContainer" class="rowBoxReverse"></div>');
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
      this.init_debtCart();
      this.init_settingsCart();
      this.init_unsyncedPosCart();
    }
    async checkForPOSEntry() {
      const user = frappe.session.user;
      let posProfile = frappe.defaults.get_default("POS Profile");
      if (!posProfile) {
        this.wrapper.html("");
        const dialog = $(`
				<div class="pos-profile-dialog d-flex flex-column align-items-center justify-content-center" style="height: 100vh;">
					<div class="alert alert-warning text-center">
						<h3>${__("POS Profile Not Set")}</h3>
						<p>${__("Please set a default POS Profile to continue using the POS.")}</p>
						<button class="btn btn-primary mt-3" onclick="">
							${__("Set POS Profile")}
						</button>
					</div>
				</div>
			`);
        this.wrapper.append(dialog);
        return false;
      }
      let profile = await frappe.db.get_doc("POS Profile", posProfile);
      this.appData.appData.pos_profile = profile;
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.check_opening_entry",
          args: { user, posProfile }
        });
        console.log("the result is :::: ", response, " user : ", user, " posProfile : ", posProfile);
        const r = response.message;
        if (r.length === 0) {
          this.create_opening_voucher();
          return false;
        }
        Object.assign(this.POSOpeningEntry, r[0]);
        this.db.updateCheckInOutSync(this.POSOpeningEntry.period_start_date);
        return true;
      } catch (error) {
        console.error("error occured : ", error);
        frappe.throw("Error checking for POS Opening Entry.");
        return false;
      }
    }
    create_opening_voucher() {
      const me = this;
      const denominations = [5, 10, 20, 50, 100, 200, 500, 1e3, 2e3];
      const default_company = frappe.defaults.get_default("company");
      const default_pos_profile = frappe.defaults.get_default("pos_profile");
      let default_payment_method = null;
      const fetch_default_payment_method = () => {
        if (!default_pos_profile) {
          frappe.msgprint({
            title: __("Error"),
            message: __("Default POS Profile is not set."),
            indicator: "red"
          });
          return;
        }
        frappe.db.get_doc("POS Profile", default_pos_profile).then(({ payments }) => {
          console.log("Available payment methods:", payments);
          if (!payments || payments.length === 0) {
            frappe.msgprint({
              title: __("No Payment Methods"),
              message: __("No payment methods found for the default POS Profile."),
              indicator: "orange"
            });
            return;
          }
          const default_method = payments.find((pay) => pay.default);
          if (default_method) {
            default_payment_method = default_method.mode_of_payment;
            console.log("Default payment method:", default_payment_method);
          } else {
            frappe.msgprint({
              title: __("Error"),
              message: __("No default payment method is set."),
              indicator: "red"
            });
          }
        }).catch((err) => {
          console.error("Error fetching POS Profile:", err);
          frappe.msgprint({
            title: __("Error"),
            message: __("Failed to fetch payment methods. Please try again."),
            indicator: "red"
          });
        });
      };
      const denomination_fields = [
        {
          fieldname: "denomination",
          fieldtype: "Data",
          label: "Denomination (DA)",
          in_list_view: 1,
          read_only: 1
        },
        {
          fieldname: "quantity",
          fieldtype: "Int",
          label: "Quantity",
          in_list_view: 1,
          default: 0,
          onchange: function() {
            console.log("on change");
            const total = dialog.fields_dict.denomination_details.grid.get_data().reduce((sum, row) => {
              return sum + parseInt(row.denomination) * (row.quantity || 0);
            }, 0);
            dialog.fields_dict.total_amount.set_value(total);
          },
          onblur: function() {
            console.log("on blur");
            const total = dialog.fields_dict.denomination_details.grid.get_data().reduce((sum, row) => {
              return sum + parseInt(row.denomination) * (row.quantity || 0);
            }, 0);
            dialog.fields_dict.total_amount.set_value(total);
          }
        }
      ];
      const dialog = new frappe.ui.Dialog({
        title: __("Create POS Opening Entry"),
        static: true,
        fields: [
          {
            fieldname: "denomination_details",
            fieldtype: "Table",
            label: "Denomination Details",
            cannot_add_rows: false,
            in_place_edit: true,
            reqd: 1,
            data: denominations.map((denom) => ({
              denomination: denom.toString(),
              quantity: 0
            })),
            fields: denomination_fields
          },
          {
            fieldtype: "Currency",
            fieldname: "total_amount",
            label: "Total Amount",
            read_only: 1,
            default: 0
          }
        ],
        primary_action: async function() {
          const total_amount = dialog.fields_dict.total_amount.get_value();
          if (!default_payment_method) {
            frappe.msgprint({
              title: __("Error"),
              message: __("No default payment method set. Please configure it in POS Profile."),
              indicator: "red"
            });
            return;
          }
          if (total_amount <= 0) {
            frappe.show_alert({
              message: __("Please enter quantities for denominations."),
              indicator: "red"
            });
            return frappe.utils.play_sound("error");
          }
          const balance_details = [{
            mode_of_payment: default_payment_method,
            opening_amount: total_amount
          }];
          const method = "erpnext.selling.page.point_of_sale.point_of_sale.create_opening_voucher";
          const res = await frappe.call({
            method,
            args: {
              pos_profile: default_pos_profile,
              company: default_company,
              balance_details
            },
            freeze: true
          });
          if (!res.exc) {
            me.prepare_app_data(res.message);
            Object.assign(me.POSOpeningEntry, {
              "name": res.message.name,
              "pos_profile": res.message.pos_profile,
              "period_start_date": res.message.period_start_date,
              "company": res.message.company
            });
            me.db.updateCheckInOutSync(me.POSOpeningEntry.period_start_date);
            me.check_in_out_cart.getAllCheckInOut();
            dialog.hide();
          }
        },
        primary_action_label: __("Submit")
      });
      dialog.show();
      dialog.get_field("denomination_details").grid.wrapper.on("keydown", "input[data-fieldname='quantity']", (e) => {
        console.log("Keydown event outside => ", e.key, "which : ", e.which);
        if (e.which === 40 || e.which === 38) {
          console.log("Keydown event:", e.key);
          const grid = dialog.get_field("denomination_details").grid;
          const row = $(e.target).closest(".grid-row");
          const doc = grid.get_row(row.attr("data-idx") - 1).doc;
          const value = parseInt(e.target.value) || 0;
          console.log("Saving value:", value, "for denomination:", doc.denomination);
          doc.quantity = value;
          grid.refresh_field("quantity");
          const total = grid.get_data().reduce((sum, row2) => {
            return sum + parseInt(row2.denomination) * (row2.quantity || 0);
          }, 0);
          dialog.fields_dict.total_amount.set_value(total);
        }
      });
      fetch_default_payment_method();
    }
    set_right_and_left_sections() {
      this.$components_wrapper.append('<div id="LeftSection" class="columnBoxReverse"></div>');
      this.$components_wrapper.append('<div id="RightSection" class="columnBox"></div>');
      this.$rightSection = this.$components_wrapper.find("#RightSection");
      this.$leftSection = this.$components_wrapper.find("#LeftSection");
    }
    init_customer_box() {
      this.customer_box = new pos_ar.PointOfSale.pos_customer_box(
        this.$leftSection,
        this.appData.appData.customers,
        this.defaultCustomer,
        () => {
          this.screenManager.navigate("home");
        },
        this.onSync.bind(this),
        this.saveCheckInOut.bind(this),
        this.onMenuClick.bind(this),
        () => {
          this.screenManager.navigate("debt_cart");
        },
        (pos) => {
          this.history_cart.print_receipt(pos);
        }
      );
      this.screenManager.registerScreen("customer_box", this.customer_box);
      this.screenManager.customer_box = this.customer_box;
    }
    init_item_selector() {
      this.item_selector = new pos_ar.PointOfSale.pos_item_selector(
        this.$leftSection,
        this.appData.appData,
        this.appData.appData.items,
        this.appData.appData.item_barcodes,
        this.appData.appData.item_groups,
        this.appData.appData.item_prices,
        this.settings_data.settings,
        this.defaultPriceList,
        this.auto_select.bind(this),
        (item) => {
          this.itemClick_selector(item);
        }
      );
      this.screenManager.registerScreen("item_selector", this.item_selector);
      this.screenManager.item_selector = this.item_selector;
    }
    init_selected_item() {
      this.selected_item_cart = new pos_ar.PointOfSale.pos_selected_item_cart(
        this.$rightSection,
        this.settings_data,
        this.selectedItemMaps,
        this.appData.appData.price_lists,
        this.appData.appData.customers,
        this.appData.brands,
        this.taxes_and_charges,
        this.invoiceData,
        this.selectedTab,
        this.selectedItem,
        this.selectedField,
        (item) => {
          this.onSelectedItemClick(item);
        },
        (tab) => {
          this.item_selector.clearSearchField();
          this.screenManager.navigate("home");
        },
        (action, key) => {
          this.onKeyPressed(action, key);
        },
        this.createNewTab.bind(this),
        () => {
          this.savePosInvoice();
          this.screenManager.navigate("payment_cart");
        },
        this.savePosInvoice.bind(this),
        this.db
      );
      this.screenManager.registerScreen("selected_item_cart", this.selected_item_cart);
      this.screenManager.selected_item_cart = this.selected_item_cart;
    }
    init_item_details() {
      this.item_details = new pos_ar.PointOfSale.pos_item_details(
        this.$leftSection,
        this.appData.appData.pos_profile.warehouse,
        this.appData.appData.price_lists,
        this.appData.appData.item_prices,
        this.appData.appData.bins,
        this.selectedItem,
        this.selectedField,
        (event2, field, value) => {
          this.onInput(event2, field, value);
        },
        () => {
          this.screenManager.navigate("home");
        }
      );
      this.screenManager.registerScreen("item_details", this.item_details);
      this.screenManager.item_details = this.item_details;
    }
    init_paymentCart() {
      this.payment_cart = new pos_ar.PointOfSale.pos_payment_cart(
        this.$leftSection,
        this.selectedItemMaps,
        this.selectedTab,
        this.appData.appData,
        this.appData.appData.pos_profile.payments,
        this.selectedPaymentMethod,
        this.invoiceData,
        () => {
          this.screenManager.navigate("home");
        },
        this.onCompleteOrder.bind(this),
        (event2, field, value) => {
          this.onInput(event2, field, value);
        }
      );
      this.screenManager.registerScreen("payment_cart", this.payment_cart);
      this.screenManager.payment_cart = this.payment_cart;
    }
    init_historyCart() {
      this.history_cart = new pos_ar.PointOfSale.pos_history(
        this.wrapper,
        this.db,
        this.appData.appData.pos_profile,
        this.appData,
        this.settings_data,
        this.company,
        this.taxes_and_charges,
        this.historyCartClick.bind(this)
      );
      this.screenManager.registerScreen("history_cart", this.history_cart);
      this.screenManager.history_cart = this.history_cart;
    }
    init_checkInOutCart() {
      this.check_in_out_cart = new pos_ar.PointOfSale.pos_check_in_out(
        this.wrapper,
        this.db
      );
      this.screenManager.registerScreen("check_in_out_cart", this.check_in_out_cart);
      this.screenManager.check_in_out_cart = this.check_in_out_cart;
    }
    init_debtCart() {
      this.debt_cart = new pos_ar.PointOfSale.pos_debt_cart(
        this.wrapper,
        this.appData,
        this.POSOpeningEntry,
        () => {
          this.check_in_out_cart.getAllCheckInOut();
        }
      );
      this.screenManager.registerScreen("debt_cart", this.debt_cart);
      this.screenManager.debt_cart = this.debt_cart;
    }
    init_settingsCart() {
      this.settings_cart = new pos_ar.PointOfSale.pos_settings(
        this.wrapper,
        this.settings_data,
        this.appData.appData.pos_profile,
        this.onSettingsChange.bind(this)
      );
      this.screenManager.registerScreen("settings_cart", this.settings_cart);
      this.screenManager.settings_cart = this.settings_cart;
    }
    init_unsyncedPosCart() {
      this.unsynced_pos_cart = new pos_ar.PointOfSale.pos_unsynced_cart(
        this.wrapper,
        this.appData,
        this.db,
        (invoice) => {
          const tab = this.selected_item_cart.createTabForEditPOS();
          this.selectedItemMaps.set(`C${tab}`, invoice);
          this.selectedTab.tabName = `C${tab}`;
          this.screenManager.navigate("home");
        },
        () => {
          if (this.unsyncedPos >= 1) {
            this.customer_box.setSynced();
            this.unsyncedPos = 0;
          } else {
            this.unsyncedPos -= 1;
            this.customer_box.setNotSynced(this.unsyncedPos);
          }
        }
      );
      this.screenManager.registerScreen("unsynced_pos_cart", this.unsynced_pos_cart);
      this.screenManager.unsynced_pos_cart = this.unsynced_pos_cart;
    }
    itemClick_selector(item, refresh) {
      this.syncInput = false;
      const itemCloned = structuredClone(item);
      itemCloned.discount_amount = 0;
      itemCloned.discount_percentage = 0;
      Object.assign(this.selectedItem, itemCloned);
      this.addItemToPosInvoice(itemCloned);
      this.selected_item_cart.calculateNetTotal();
      this.selected_item_cart.calculateVAT();
      this.selected_item_cart.calculateQnatity();
      this.selected_item_cart.calculateGrandTotal();
      this.selected_item_cart.refreshSelectedItem();
      if (refresh) {
        this.item_selector.refreshItemSelector();
      }
      this.selectedField.field_name = "quantity";
      this.selected_item_cart.makeSelectedButtonHighlighted();
      this.selected_item_cart.scrollToBottom();
      this.savePosInvoice();
    }
    onSelectedItemClick(item) {
      this.syncInput = false;
      const clonedItem = structuredClone(item);
      Object.assign(this.selectedItem, clonedItem);
      this.selectedField.field_name = "quantity";
      this.selected_item_cart.makeSelectedButtonHighlighted();
      console.log("selected item :: ", this.selectedItem);
      this.screenManager.navigate("item_details");
      this.item_details.refreshDate(item);
    }
    saveCheckInOut(checkInOut) {
      checkInOut.is_sync = 0;
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
      this.item_selector.refreshItemSelector();
      this.selected_item_cart.resetItemRateBaseOnPriceList();
      this.selected_item_cart.refreshSelectedItem();
    }
    savePosInvoice(saveWithZeroRate) {
      this.selectedItemMaps.get(this.selectedTab.tabName).synced = false;
      this.appData.savePosInvoice(this.selectedItemMaps.get(this.selectedTab.tabName));
    }
    saveThatPosInvoice(pos_invoice) {
      pos_invoice.synced = false;
      this.appData.savePosInvoice(pos_invoice);
    }
    auto_select(item) {
      this.itemClick_selector(item);
      this.item_selector.refresh();
    }
    onMenuClick(menu) {
      if (menu == "recent_pos") {
        this.screenManager.navigate("history_cart");
      } else if (menu == "close_pos") {
        this.onClosePOS();
      } else if (menu == "unsenced_invoices") {
        this.screenManager.navigate("unsynced_pos_cart");
      } else if (menu == "settings") {
        this.screenManager.navigate("settings_cart");
      } else if (menu == "checkInOut") {
        this.screenManager.navigate("check_in_out_cart");
      }
    }
    getDefaultPaymentMethod() {
      let result = null;
      this.appData.appData.pos_profile.payments.forEach((method) => {
        if (method.default) {
          result = method;
        }
      });
      return result;
    }
    getPaymentMethods() {
      let result = [];
      this.appData.appData.pos_profile.payments.forEach((method) => {
        result.push({ "mode_of_payment": method.mode_of_payment, "default": method.default, "amount": 0 });
      });
      return result;
    }
    restorePosInvoices(posInvoices) {
      posInvoices.forEach((pos) => {
        const tab = this.selected_item_cart.createTabForEditPOS();
        let new_pos_invoice = frappe.model.get_new_doc("POS Invoice");
        new_pos_invoice.customer = pos.customer;
        new_pos_invoice.pos_profile = this.appData.appData.pos_profile.name;
        new_pos_invoice.items = pos.items;
        new_pos_invoice.taxes_and_charges = pos.taxes_and_charges;
        new_pos_invoice.additional_discount_percentage = pos.additional_discount_percentage;
        new_pos_invoice.paid_amount = pos.paid_amount;
        new_pos_invoice.base_paid_amount = pos.base_paid_amount;
        new_pos_invoice.creation_time = pos.creation_time;
        new_pos_invoice.payments = pos.payments;
        new_pos_invoice.is_pos = 1;
        new_pos_invoice.update_stock = 1;
        new_pos_invoice.docstatus = 0;
        new_pos_invoice.synced = false;
        new_pos_invoice.status = "Draft";
        new_pos_invoice.priceList = pos.priceList;
        new_pos_invoice.opened = 1;
        const date = new Date();
        const [year, month, day] = date.toISOString().split("T")[0].split("-");
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getMilliseconds();
        new_pos_invoice.refNum = this.appData.appData.pos_profile.name + "-" + year + "-" + month + "-" + day + "-" + hour + minutes + seconds;
        new_pos_invoice.custom_cach_name = new_pos_invoice.refNum;
        this.selectedItemMaps.set(`C${tab}`, new_pos_invoice);
        this.selectedTab.tabName = `C${tab}`;
        this.saveThatPosInvoice(new_pos_invoice);
      });
      this.screenManager.navigate("home");
    }
    createNewTab(counter) {
      this.item_selector.clearSearchField();
      let new_pos_invoice = frappe.model.get_new_doc("POS Invoice");
      new_pos_invoice.customer = this.defaultCustomer.name;
      new_pos_invoice.pos_profile = this.appData.appData.pos_profile.name;
      new_pos_invoice.items = [];
      new_pos_invoice.taxes_and_charges = this.appData.appData.pos_profile.taxes_and_charges;
      new_pos_invoice.additional_discount_percentage = 0;
      new_pos_invoice.paid_amount = 0;
      new_pos_invoice.base_paid_amount = 0;
      new_pos_invoice.creation_time = frappe.datetime.now_datetime();
      new_pos_invoice.payments = this.getPaymentMethods();
      new_pos_invoice.is_pos = 1;
      new_pos_invoice.update_stock = 1;
      new_pos_invoice.docstatus = 0;
      new_pos_invoice.synced = false;
      new_pos_invoice.status = "Draft";
      new_pos_invoice.priceList = this.defaultPriceList.name;
      new_pos_invoice.opened = 1;
      const date = new Date();
      const [year, month, day] = date.toISOString().split("T")[0].split("-");
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getMilliseconds();
      new_pos_invoice.refNum = this.appData.appData.pos_profile.name + "-" + year + "-" + month + "-" + day + "-" + hour + minutes + seconds;
      new_pos_invoice.custom_cach_name = new_pos_invoice.refNum;
      this.selectedItemMaps.set(`C${counter}`, new_pos_invoice);
      this.selectedTab.tabName = `C${counter}`;
      this.screenManager.navigate("home");
    }
    historyCartClick(event2, message) {
      if (event2 == "edit") {
        const tab = this.selected_item_cart.createTabForEditPOS();
        this.selectedItemMaps.set(`C${tab}`, message);
        this.selectedTab.tabName = `C${tab}`;
        this.screenManager.navigate("home");
      } else if (event2 == "duplicate") {
        this.item_selector.clearSearchField();
        const tab = this.selected_item_cart.createNewTab();
        this.selectedItemMaps.get(this.selectedTab.tabName).items = message.items;
        console.log("message :: ", message);
        console.log("see here ", this.selectedItemMaps.get(this.selectedTab.tabName), "selected tab ", this.selectedTab.tabName);
        this.screenManager.navigate("home");
      } else if (event2 == "return") {
        const tab = this.selected_item_cart.createTabForEditPOS();
        const returnedPosInvoice = this.makePosInvoiceReturn(message);
        this.selectedItemMaps.set(`C${tab}`, returnedPosInvoice);
        this.selectedTab.tabName = `C${tab}`;
        this.screenManager.navigate("home");
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
      this.savePosInvoice();
    }
    onKeyPressed(action, key) {
      var _a, _b;
      if (action == "quantity") {
        this.selectedField.field_name = "quantity";
        this.selected_item_cart.makeSelectedButtonHighlighted();
      } else if (action == "rate") {
        this.selectedField.field_name = "rate";
        this.selected_item_cart.makeSelectedButtonHighlighted();
      } else if (action == "minus") {
        this.syncInput = true;
        const newValue = parseFloat(this.selectedItem.qty) * -1;
        this.selectedItem.qty = parseFloat(newValue);
        this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
      } else if (action == "print") {
        this.history_cart.print_receipt(structuredClone(this.selectedItemMaps.get(this.selectedTab.tabName)));
        return;
      } else if (action == "remove") {
        this.syncInput = false;
        this.deleteItemFromPOsInvoice(this.selectedItem.name);
      } else if (action == "delete") {
        if (!this.settings_data.settings.showItemDetails) {
          if (this.selectedField.field_name == "quantity") {
            const oldValue = parseFloat(this.selectedItem.qty);
            const newValue2 = `${oldValue}`.slice(0, -1);
            this.selectedItem.qty = parseFloat(newValue2) || 0;
            this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
          } else if (this.selectedField.field_name == "rate") {
            const oldValue = parseFloat(this.selectedItem.rate);
            const newValue2 = `${oldValue}`.slice(0, -1);
            this.selectedItem.rate = parseFloat(newValue2) || 0;
            let oldRate = this.selectedItem.rate;
            let persont = this.selectedItem.discount_percentage;
            let montant = oldRate * (persont / 100);
            this.selectedItem.discount_percentage = persont;
            this.selectedItem.discount_amount = montant;
            this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
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
            this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
            this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
          }
        }
        let newValue = parseFloat(this.item_details.deleteCharacter());
        if (this.selectedField.field_name == "quantity") {
          this.selectedItem.qty = newValue;
          this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
        } else if (this.selectedField.field_name == "rate") {
          this.selectedItem.rate = newValue;
          let oldRate = this.selectedItem.rate;
          let persont = this.selectedItem.discount_percentage;
          let montant = oldRate * (persont / 100);
          this.selectedItem.discount_amount = montant;
          this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
        } else if (this.selectedField.field_name == "discount_percentage") {
          let oldRate = this.selectedItem.rate;
          let montant = oldRate * (newValue / 100);
          this.selectedItem.discount_percentage = newValue;
          this.selectedItem.discount_amount = montant;
          this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
          this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
        } else if (this.selectedField.field_name == "cash") {
          this.payment_cart.deleteKeyPress();
        }
      } else if (action == "addToField") {
        if (this.selectedField.field_name == "cash") {
          this.payment_cart.handleInput(key);
        } else {
          if (this.selectedField.field_name == "quantity") {
            let oldValue = 0;
            if (!this.syncInput) {
              oldValue = 0;
              this.syncInput = true;
            } else {
              oldValue = parseFloat(this.selectedItem.qty);
            }
            const newValue = `${oldValue}` + key;
            this.selectedItem.qty = parseFloat(newValue);
            this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
          } else if (this.selectedField.field_name == "rate") {
            let lastValue = 0;
            if (!this.syncInput) {
              lastValue = 0;
              this.syncInput = true;
            } else {
              lastValue = parseFloat(this.selectedItem.rate);
            }
            const newValue = `${lastValue}` + key;
            this.selectedItem.rate = parseFloat(newValue);
            let oldRate = this.selectedItem.rate;
            let persont = this.selectedItem.discount_percentage;
            let montant = oldRate * (persont / 100);
            this.selectedItem.discount_percentage = persont;
            this.selectedItem.discount_amount = montant;
            this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
            this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
          } else if (this.selectedField.field_name == "discount_percentage") {
            let oldRate = this.selectedItem.rate;
            let old_percentage = (_b = this.selectedItem.discount_percentage) != null ? _b : 0;
            let input = `${old_percentage}` + key;
            let discount_percentage = parseFloat(input);
            if (discount_percentage > 100) {
              discount_percentage = 100;
            }
            let montant = oldRate * (discount_percentage / 100);
            let newRate = oldRate - montant;
            this.selectedItem.discount_percentage = discount_percentage;
            this.selectedItem.discount_amount = montant;
            this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
            this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
          }
        }
      }
      this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
      this.selected_item_cart.refreshSelectedItem();
      this.item_details.refreshDate(this.selectedItem);
      this.savePosInvoice();
    }
    onCompleteOrder() {
      this.payment_cart.show_waiting();
      this.savePosInvoice();
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
      let is_return = 1;
      this.selectedItemMaps.get(this.selectedTab.tabName).items.forEach((item) => {
        let newItem = {
          "item_name": item.item_name,
          "item_code": item.item_code,
          "rate": item.rate,
          "qty": item.qty,
          "description": item.description,
          "image": item.image,
          "use_serial_batch_fields": 1,
          "cost_center": this.appData.appData.pos_profile.cost_center,
          "discount_percentage": item.discount_percentage,
          "discount_amount": item.discount_amount,
          "warehouse": this.appData.appData.pos_profile.warehouse,
          "income_account": this.appData.appData.pos_profile.income_account
        };
        items.push(newItem);
        if (item.qty > 0)
          is_return = 0;
      });
      this.selectedItemMaps.get(this.selectedTab.tabName).is_return = is_return;
      this.selectedItemMaps.get(this.selectedTab.tabName).items = items;
      if (items.length == 0)
        return;
      let total = 0;
      this.selectedItemMaps.get(this.selectedTab.tabName).items.forEach((item) => {
        total += item.rate * item.qty;
      });
      if (this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName)) > total) {
        this.selectedItemMaps.get(this.selectedTab.tabName).paid_amount = total;
        this.selectedItemMaps.get(this.selectedTab.tabName).base_paid_amount = total;
        this.selectedItemMaps.get(this.selectedTab.tabName).outstanding_amount = 0;
        this.selectedItemMaps.get(this.selectedTab.tabName).total_customer_payment = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName));
      } else {
        this.selectedItemMaps.get(this.selectedTab.tabName).paid_amount = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName));
        this.selectedItemMaps.get(this.selectedTab.tabName).base_paid_amount = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName));
        this.selectedItemMaps.get(this.selectedTab.tabName).outstanding_amount = this.invoiceData.grandTotal - this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName));
        this.selectedItemMaps.get(this.selectedTab.tabName).total_customer_payment = this.calculatePaidAmount(this.selectedItemMaps.get(this.selectedTab.tabName));
      }
      this.selectedItemMaps.get(this.selectedTab.tabName).docstatus = 1;
      const status = this.checkIfPaid(this.selectedItemMaps.get(this.selectedTab.tabName));
      this.selectedItemMaps.get(this.selectedTab.tabName).status = status;
      const pos = structuredClone(this.selectedItemMaps.get(this.selectedTab.tabName));
      pos.custom_is_shared = this.settings_data.settings.sendInvoiceToOtherPos ? 1 : 0;
      if (status == "Unpaid") {
        pos.synced = true;
        frappe.db.insert(
          pos
        ).then((r) => {
          this.payment_cart.hide_waiting();
          pos.opened = 0;
          pos.real_name = r.name;
          this.history_cart.print_receipt(pos);
          this.appData.updatePosInvoice(pos);
          this.selectedItemMaps.delete(this.selectedTab.tabName);
          let tabs = Array.from(this.selectedItemMaps.keys());
          if (tabs.length > 0) {
            this.selected_item_cart.createNewTab();
          } else {
            this.selected_item_cart.createNewTab();
          }
          this.screenManager.navigate("home");
        }).catch((err) => {
          this.payment_cart.hide_waiting();
          console.log("cant push pos invoice : ", err);
        });
      } else {
        this.payment_cart.hide_waiting();
        this.history_cart.print_receipt(pos);
        this.selectedItemMaps.delete(this.selectedTab.tabName);
        let tabs = Array.from(this.selectedItemMaps.keys());
        if (tabs.length > 0) {
          this.selected_item_cart.createNewTab();
        } else {
          this.selected_item_cart.createNewTab();
        }
        this.screenManager.navigate("home");
        pos.synced = false;
        pos.opened = 0;
        this.appData.updatePosInvoice(pos);
        this.unsyncedPos += 1;
        this.customer_box.setNotSynced(this.unsyncedPos);
      }
    }
    onSync() {
      if (this.isSyncing) {
        console.warn("Sync already in progress.");
        return;
      }
      this.isSyncing = true;
      if (this.POSOpeningEntry.name == "") {
        this.checkForPOSEntry();
        this.isSyncing = false;
        return;
      }
      if (this.unsyncedPos <= 0) {
        frappe.msgprint({
          title: __("Sync Complete"),
          indicator: "green",
          message: __("All data is already synchronized.")
        });
        this.isSyncing = false;
        return;
      }
      let counter = 0;
      let failure = 0;
      this.appData.getNotSyncedPos(
        (allUnsyncedPos) => {
          frappe.show_progress("Syncing Invoices...", 0, allUnsyncedPos.length, "syncing");
          allUnsyncedPos.forEach((pos) => {
            frappe.db.insert(
              pos
            ).then((r) => {
              const updatedPos = structuredClone(pos);
              updatedPos.synced = true;
              updatedPos.real_name = r.name;
              this.appData.updatePosInvoice(updatedPos);
              counter += 1;
              frappe.show_progress("Syncing Invoices...", counter, allUnsyncedPos.length, "syncing");
              if (counter == allUnsyncedPos.length) {
                frappe.hide_progress();
                this.customer_box.setSynced();
                this.isSyncing = false;
                this.unsyncedPos = 0;
              }
            }).catch((err) => {
              counter += 1;
              failure += 1;
              if (counter == allUnsyncedPos.length) {
                frappe.hide_progress();
                this.customer_box.setSynced();
                this.isSyncing = false;
                this.unsyncedPos = 0;
              }
            });
          });
        },
        (err) => {
          console.log("cant get the unseced POS from local");
          this.isSyncing = false;
        }
      );
    }
    getCustomerDefaultPriceList(customerId) {
      let priceList = "";
      this.appData.appData.customers.forEach((customer) => {
        if (customer.name == customerId) {
          priceList = customer.default_price_list;
        }
      });
      return priceList;
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
        frappe.throw(__(`you have  some invoices to sync first.`));
      }
      let voucher = frappe.model.get_new_doc("POS Closing Entry");
      voucher.pos_opening_entry = this.POSOpeningEntry.name;
      voucher.pos_profile = this.POSOpeningEntry.pos_profile;
      voucher.company = this.POSOpeningEntry.company;
      voucher.user = frappe.session.user;
      const unsyncedChecks = this.check_in_out_cart.checkList.filter((check) => check.is_sync === 0);
      unsyncedChecks.forEach((check) => {
        let child = frappe.model.add_child(voucher, "check_in_out", "custom_check_in_out");
        child.check_type = check.check_type;
        child.creation_time = check.creation_time;
        child.amount = check.amount;
        child.reason_note = check.reason_note;
        child.user = check.owner;
      });
      this.POSOpeningEntry.name = "";
      this.wrapper.html("");
      const dialog = $(`
			<div class="pos-profile-dialog d-flex flex-column align-items-center justify-content-center" style="height: 100vh;">
				<div class="alert alert-warning text-center">
					<h3>${__("POS is Closed")}</h3>
					<p>${__("Please refresh the page after trying to close.")}</p>
					<button class="btn btn-primary mt-3" onclick="location.reload()">
						${__("Refresh Page")}
					</button>
				</div>
			</div>
		`);
      this.wrapper.append(dialog);
      frappe.set_route("Form", "POS Closing Entry", voucher.name).then(() => {
        window.addEventListener("popstate", (event2) => {
          frappe.set_route("Form", "POS Closing Entry", voucher.name);
        });
      });
    }
    setListeners() {
      window.addEventListener("offline", function() {
        frappe.msgprint("you lose the connection (offline mode)");
      });
      window.addEventListener(
        "online",
        function() {
          frappe.msgprint("the connection is back (online mode)");
        }
      );
    }
    makePosInvoiceReturn(posInvoice) {
      let invoice = structuredClone(posInvoice);
      let new_name = frappe.model.get_new_doc("POS Invoice").name;
      invoice.name = new_name;
      invoice.is_return = 1;
      invoice.return_against = posInvoice.real_name;
      invoice.real_name = "";
      invoice.consolidated_invoice = null;
      invoice.outstanding_amount = 0;
      let newItems = [];
      invoice.items.forEach((item) => {
        if (item.qty > 0) {
          let newItem = structuredClone(item);
          newItem.qty = newItem.qty * -1;
          newItem.description = "Returned item";
          newItems.push(newItem);
        }
      });
      invoice.items = newItems;
      invoice.pos_profile = this.appData.appData.pos_profile.name;
      invoice.taxes_and_charges = this.appData.appData.pos_profile.taxes_and_charges;
      invoice.creation_time = frappe.datetime.now_datetime();
      invoice.payments = this.getPaymentMethods();
      invoice.priceList = this.defaultPriceList.name;
      const date = new Date();
      const [year, month, day] = date.toISOString().split("T")[0].split("-");
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getMilliseconds();
      invoice.refNum = this.appData.appData.pos_profile.name + "-" + year + "-" + month + "-" + day + "-" + hour + minutes + seconds;
      invoice.custom_cach_name = invoice.refNum;
      return invoice;
    }
    toggleKeyboardMode(active) {
      if (active) {
        document.addEventListener("keydown", (event2) => {
          const activeElement = document.activeElement;
          const isInputFocused = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable;
          if (isInputFocused)
            return;
          if (event2.key == "q" || event2.key == "Q") {
            this.selectedField.field_name = "quantity";
            this.selected_item_cart.makeSelectedButtonHighlighted();
          } else if (event2.key == "p" || event2.key == "P") {
            this.selectedField.field_name = "rate";
            this.selected_item_cart.makeSelectedButtonHighlighted();
          } else if (event2.key == "Delete") {
            this.deleteItemFromPOsInvoice(this.selectedItem.name);
            this.selected_item_cart.refreshSelectedItem();
            this.screenManager.navigate("home");
          } else if (event2.key == "Backspace") {
            if (this.selectedField.field_name == "quantity") {
              const lastValue = parseFloat(this.selectedItem.qty);
              let newValue = 0;
              newValue = parseFloat(`${lastValue}`.slice(0, -1)) || 0;
              this.selectedItem.qty = parseFloat(newValue);
              this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
              this.selected_item_cart.refreshSelectedItem();
            } else if (this.selectedField.field_name == "rate") {
              const lastValue = parseFloat(this.selectedItem.rate);
              let newValue = parseFloat(`${lastValue}`.slice(0, -1)) || 0;
              this.selectedItem.rate = parseFloat(newValue);
              let oldRate = this.selectedItem.rate;
              let persont = this.selectedItem.discount_percentage;
              let montant = oldRate * (persont / 100);
              this.selectedItem.discount_percentage = persont;
              this.selectedItem.discount_amount = montant;
              this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
              this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
              this.selected_item_cart.refreshSelectedItem();
              this.item_details.refreshDate(this.selectedItem);
            }
          } else if (this.selectedField.field_name == "quantity") {
            if (parseFloat(event2.key) || event2.key == "0") {
              let lastValue = 0;
              if (!this.syncInput) {
                lastValue = 0;
                this.syncInput = true;
              } else {
                lastValue = parseFloat(this.selectedItem.qty);
              }
              const newValue = `${lastValue}` + event2.key;
              this.selectedItem.qty = parseFloat(newValue);
              this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
              this.selected_item_cart.refreshSelectedItem();
            } else if (event2.key == "-") {
              this.syncInput = true;
              const newValue = parseFloat(this.selectedItem.qty) * -1;
              this.selectedItem.qty = parseFloat(newValue);
              this.editPosItemQty(this.selectedItem.name, this.selectedItem.qty);
              this.selected_item_cart.refreshSelectedItem();
            }
          } else if (this.selectedField.field_name == "rate") {
            if (parseFloat(event2.key) || event2.key == "0") {
              let lastValue = 0;
              if (!this.syncInput) {
                lastValue = 0;
                this.syncInput = true;
              } else {
                lastValue = parseFloat(this.selectedItem.rate);
              }
              const newValue = `${lastValue}` + event2.key;
              this.selectedItem.rate = parseFloat(newValue);
              let oldRate = this.selectedItem.rate;
              let persont = this.selectedItem.discount_percentage;
              let montant = oldRate * (persont / 100);
              this.selectedItem.discount_percentage = persont;
              this.selectedItem.discount_amount = montant;
              this.editPosItemDiscountAmount(this.selectedItem.name, this.selectedItem.discount_amount);
              this.editPosItemRate(this.selectedItem.name, this.selectedItem.rate);
              this.selected_item_cart.refreshSelectedItem();
              this.item_details.refreshDate(this.selectedItem);
            }
          }
        });
      } else {
        document.removeEventListener("keydown", (event2) => {
        });
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
      var _a;
      let clonedItem = structuredClone(clickedItem);
      const posInvoice = this.selectedItemMaps.get(this.selectedTab.tabName);
      const posItems = posInvoice.items;
      let exist = false;
      posItems.forEach((item) => {
        if (item.name == clickedItem.name) {
          exist = true;
          item.qty += 1;
          const clone = structuredClone(item);
          Object.assign(this.selectedItem, clone);
        }
      });
      if (!exist) {
        clonedItem.item_code = clonedItem.name;
        clonedItem.discount_amount = 0;
        clonedItem.discount_percentage = 0;
        clonedItem.qty = 1;
        clonedItem.rate = ((_a = clonedItem.prices.find((price) => price.price_list == this.selectedItemMaps.get(this.selectedTab.tabName).priceList)) == null ? void 0 : _a.price_list_rate) || 0;
        posItems.push(clonedItem);
        const clone = structuredClone(clonedItem);
        Object.assign(this.selectedItem, clone);
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
          item.manually_edited = true;
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
    calculatePaidAmount(posInvoice) {
      let paidAmountDA = 0;
      posInvoice.payments.forEach((mode) => {
        paidAmountDA += mode.amount;
      });
      return paidAmountDA;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_item_selector.js
  pos_ar.PointOfSale.pos_item_selector = class {
    constructor(wrapper, appData, item_list, itemBarcodes, item_group_list, item_prices, settingsData, selectedPriceList, autoSelect, onItemClick) {
      this.wrapper = wrapper;
      this.app_data = appData;
      this.item_list = item_list;
      this.item_barcodes = itemBarcodes;
      this.item_group_list = item_group_list;
      this.item_prices = item_prices;
      this.settings_data = settingsData;
      this.selected_price_list = selectedPriceList;
      this.auto_select = autoSelect;
      this.on_item_click = onItemClick;
      this.barcode_map = {};
      this.item_barcodes.forEach((barcode) => {
        if (!this.barcode_map[barcode.barcode]) {
          this.barcode_map[barcode.barcode] = [];
        }
        this.barcode_map[barcode.barcode].push(barcode.parent);
      });
      this.start_item_selector();
    }
    start_item_selector() {
      this.prepare_select_box();
      this.setItemGroupsInList();
      this.setItemInFlow(this.getItemByItemGroup(""));
      this.setListeners();
    }
    refresh() {
      this.setItemInFlow(this.getItemByItemGroup(""));
    }
    prepare_select_box() {
      this.wrapper.append('<div id="SelectorBox" class="columnBox" ></div>');
      this.selectorBox = this.wrapper.find("#SelectorBox");
      this.selectorBox.append('<div id="selectorBoxHeader" class="rowBox header"></div>');
      this.header = this.selectorBox.find("#selectorBoxHeader");
      this.header.append('<h4 class="CartTitle">Items</h4>');
      this.header.append('<div id="inputsBox" class="rowBox align_center"  style="flex-grow: 1; "></div>');
      this.inputBox = this.header.find("#inputsBox");
      this.inputBox.append(`
			<div class="input-with-clear">
			  <input type="text" autocomplete="off" maxlength="140" placeholder="Search by item code, item name or barcode" id="ItemInput" name="item">
			  <span class="clear-btn" id="ClearItemInput">\xD7</span>
			</div>
		  `);
      this.inputBox.append('<input list="ItemGroupList"  id="ItemGroupInput" name="ItemGroup" placeHolder="Item Group">');
      this.inputBox.append('<datalist id="ItemGroupList"></datalist>');
      this.itemGroupList = this.inputBox.find("#ItemGroupList");
      this.itemGroupList.append("<option>fetching Item Groups ...</option>");
      if (!this.settings_data.search_by_group) {
        this.inputBox.find("#ItemGroupInput").hide();
      }
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
      var _a;
      const itemsContainer_html = document.getElementById("itemsContainer");
      itemsContainer_html.innerHTML = "";
      const itemInput = document.getElementById("ItemInput");
      if (filtered_item_list.length === 0) {
        itemsContainer_html.innerHTML = `
				<div class="no-items-found">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M15.5 15.5L19 19" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M5 11C5 14.3137 7.68629 17 11 17C12.6597 17 14.1621 16.3261 15.2483 15.2483C16.3261 14.1621 17 12.6597 17 11C17 7.68629 14.3137 5 11 5C7.68629 5 5 7.68629 5 11Z" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<p>No items found</p>
				</div>
			`;
        return;
      }
      for (let i = 0; i < filtered_item_list.length && i < 50; i++) {
        let item = filtered_item_list[i];
        const itemBox = document.createElement("div");
        itemBox.classList.add("itemBox");
        itemBox.classList.add("columnBox");
        itemBox.classList.add("C_A_Center");
        itemBox.addEventListener("click", (event2) => {
          const isNotImpty = itemInput.value.length > 0;
          this.on_item_click(item, isNotImpty);
        });
        const imageUrl = item.image || "/assets/pos_ar/images/no_image.png";
        console.log("selected prce list : ", this.selected_price_list.name);
        console.log("the item : ", item);
        console.log("the item prices : ", item.prices);
        console.log("the selected price list : ", this.selected_price_list);
        const price = ((_a = item.prices.find((price2) => price2.price_list == this.selected_price_list.name)) == null ? void 0 : _a.price_list_rate) || 0;
        itemBox.innerHTML = `
				<img class="itemImage" src="${imageUrl}" alt="${item.item_name}" onerror="this.src='/assets/pos_ar/images/no_image.png'">
				<div class="itemTitle">${item.item_name}</div>
				<div class="itemPrice">${price} DA</div>`;
        itemsContainer_html.appendChild(itemBox);
      }
      if (filtered_item_list.length >= 700) {
        itemsContainer_html.insertAdjacentHTML("beforeend", `
				<div class="more-items-notice">
					<p>Showing first 700 items. Please refine your search to see more specific results.</p>
				</div>
			`);
      }
    }
    clearSearchField() {
      const itemInput = document.getElementById("ItemInput");
      itemInput.value = "";
      this.setItemInFlow(this.item_list);
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
      const clearItemInput = document.getElementById("ClearItemInput");
      clearItemInput.addEventListener("click", () => {
        itemInput.value = "";
        this.setItemInFlow(this.item_list);
        itemInput.focus();
      });
    }
    filterListByItemData(value) {
      const itemIds = this.barcode_map[value];
      if (itemIds && itemIds.length > 0) {
        const items = this.item_list.filter((item) => itemIds.includes(item.name));
        if (items.length === 1) {
          this.auto_select(items[0]);
          const itemInput = document.getElementById("ItemInput");
          itemInput.value = "";
          return this.item_list;
        } else if (items.length > 1) {
          return items;
        }
      }
      return this.item_list.filter(
        (item) => item.item_name.toLowerCase().includes(value.toLowerCase())
      );
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
    getQty(item) {
      let qty = 0;
      return 0;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_customer_box.js
  pos_ar.PointOfSale.pos_customer_box = class {
    constructor(wrapper, customersList, selectedCustomer, backHome, onSync, saveCheckInOut, onMenuClick, onDebtClick, onPrintPos) {
      this.wrapper = wrapper;
      this.customers_list = customersList;
      this.selected_customer = selectedCustomer;
      this.back_home = backHome;
      this.on_sync = onSync;
      this.on_menu_click = onMenuClick;
      this.save_check_in_out = saveCheckInOut;
      this.on_debt_click = onDebtClick;
      this.on_print_pos = onPrintPos;
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
      this.wrapper.append('<div id="ActionsContainerBox">');
      this.actionContainer = this.wrapper.find("#ActionsContainerBox");
      this.actionContainer.append(`
			<div id="SyncBox" class="action-btn">
				<span id="syncBoxContent">Sync</span>
			</div>
		`);
      this.actionContainer.append(`
			<div id="HomeBox" class="action-btn" style="display:none;">
				<img src="/assets/pos_ar/images/home.png" alt="Home">
			</div>
		`);
      this.actionContainer.append(`
			<div id="DebtBox" class="action-btn">
				<img src="/assets/pos_ar/images/debt.png" alt="Debt">
			</div>
		`);
      this.actionContainer.append(`
			<div id="exchangeBtn" class="action-btn">
				<img src="/assets/pos_ar/images/exchange.png" alt="Exchange">
			</div>
		`);
      this.actionContainer.append(`
			<div id="popupBtn" class="action-btn" style="display: none;">
				<i class="fa fa-star"></i>
			</div>
		`);
      frappe.db.get_value("Company", frappe.defaults.get_default("company"), "name").then((r) => {
        if (r.message.name === "OPTILENS TIZIOUZOU" || r.message.name === "Tizi") {
          document.getElementById("popupBtn").style.display = "flex";
        }
      });
      this.wrapper.append(`
			<div id="myPopover" popover>
				<div class="popover-header">
					<h2>Invoices</h2>
				</div>
				<div class="search-container">
					<input type="text" class="search-box" placeholder="Search by customer name..." />
				</div>
				<div class="popover-content">
					<!-- Content will go here -->
				</div>
				<div class="popover-footer">
					<button class="btn btn-primary" id="confirmBtn">Done</button>
				</div>
			</div>
		`);
      const style = document.createElement("style");
      style.textContent = `
			#myPopover {
				min-width: 600px !important;
				max-width: 80vw !important;
			}
			.search-container {
				padding: 10px 15px;
				border-bottom: 1px solid var(--border-color);
				background-color: var(--fg-color);
			}
			.search-box {
				width: 100%;
				padding: 8px 12px;
				border: 1px solid var(--border-color);
				border-radius: 6px;
				font-size: 14px;
				outline: none;
				transition: border-color 0.2s;
			}
			.search-box:focus {
				border-color: var(--primary-color);
			}
			.search-box::placeholder {
				color: var(--text-muted);
			}
			.invoice-list {
				max-height: 400px;
				overflow-y: auto;
				padding: 10px;
				width: 100%;
			}
			.invoice-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 12px 15px;
				border-bottom: 1px solid #eee;
				margin-bottom: 8px;
				width: 100%;
			}
			.invoice-item:hover {
				background-color: #f8f9fa;
			}
			.invoice-details {
				flex: 1;
				min-width: 0; /* Prevents flex item from overflowing */
			}
			.invoice-name {
				font-weight: bold;
				color: var(--text-color);
				margin-bottom: 4px;
				font-size: 1.1em;
			}
			.invoice-id {
				color: var(--text-muted);
				font-size: 0.9em;
				margin-bottom: 2px;
			}
			.invoice-date {
				color: var(--text-muted);
				font-size: 0.85em;
			}
			.invoice-amount {
				font-weight: bold;
				color: var(--text-color);
				margin-top: 4px;
			}
			.invoice-actions {
				margin-left: 20px;
				white-space: nowrap;
			}
			.no-invoices {
				text-align: center;
				padding: 20px;
				color: var(--text-muted);
			}
			.popover-content {
				width: 100%;
				padding: 0;
			}
			.print-invoice {
				padding: 6px 12px;
			}
			.print-invoice i {
				margin-right: 4px;
			}
		`;
      document.head.appendChild(style);
      this.actionContainer.append(`
			<div id="MenuBox" class="action-btn">
				<img src="/assets/pos_ar/images/menu.png" alt="Menu">
				<div id="menuItemsContainer">
					<div id="posInvoiceMenuItem"       class="menuItem">Recent POS Invoices</div>
					<div id="checkInOutMenuItem"       class="menuItem">Check In/Out</div>
					<div id="unsencedInvoicesMenuItem" class="menuItem">Unsenced invoices</div>
					<div id="closePosMenuItem"         class="menuItem">Close the POS</div>
					<div id="settingMenuItem"          class="menuItem">About</div>
				</div>
			</div>
		`);
      this.sync_btn = this.actionContainer.find("#SyncBox");
      this.sync_btn_content = this.sync_btn.find("#syncBoxContent");
      this.home = this.actionContainer.find("#HomeBox");
      this.debt = this.actionContainer.find("#DebtBox");
      this.exchange_btn = this.actionContainer.find("#exchangeBtn");
      this.menu = this.actionContainer.find("#MenuBox");
      this.menuItemsContainer = this.actionContainer.find("#menuItemsContainer");
      this.pos_invoices = this.menuItemsContainer.find("#posInvoiceMenuItem");
      this.check_in_out = this.menuItemsContainer.find("#checkInOutMenuItem");
      this.close_pos = this.menuItemsContainer.find("#closePosMenuItem");
      this.unsenced_invoices = this.menuItemsContainer.find("#unsencedInvoicesMenuItem");
      this.setting = this.menuItemsContainer.find("#settingMenuItem");
      this.wrapper.append('<div id="darkFloatingBackground"></div>');
      this.dark_floating_background = this.wrapper.find("#darkFloatingBackground");
      this.wrapper.append(`
			<div id="checkInOutDialog">
				<div class="dialog-header">
					<h2>Add Transaction</h2>
				</div>
				<div id="checkTypeContainer">
					<div id="checkInType" class="rowBox centerItem checkType selected">
						<div class="type-icon">
							<img src="/assets/pos_ar/images/arrow.png" style="transform: rotate(180deg);" alt="In">
						</div>
						<div class="type-text">Check In</div>
					</div>
					<div id="checkOutType" class="rowBox centerItem checkType">
						<div class="type-icon">
							<img src="/assets/pos_ar/images/arrow.png" alt="Out">
						</div>
						<div class="type-text">Check Out</div>
					</div>
				</div>
				<div class="inputGroup">
					<label for="check_in_out_input">Amount</label>
					<input autocomplete="off" required type="number" id="check_in_out_input" placeholder="Enter amount">
				</div>
				<div class="inputGroup">
					<label for="check_in_out_note_textarea">Reason</label>
					<textarea id="check_in_out_note_textarea" placeholder="Enter reason for transaction"></textarea>
				</div>
				<div id="btnsContainers" class="rowBox">
					<button id="cancelBtn" class="dialogBtn rowBox centerItem">Cancel</button>
					<button id="confirmBtn" class="dialogBtn rowBox centerItem">Confirm</button>
				</div>
			</div>
		`);
      this.check_in_out_dialog = this.wrapper.find("#checkInOutDialog");
      this.check_in_out_dialog.css("flex-direction", "column");
      this.check_type_container = this.check_in_out_dialog.find("#checkTypeContainer");
      this.check_in_box = this.check_type_container.find("#checkInType");
      this.check_out_box = this.check_type_container.find("#checkOutType");
      this.check_in_out_type = "In";
      this.check_in_out_input = this.check_in_out_dialog.find("#check_in_out_input");
      this.check_in_out_note = this.check_in_out_dialog.find("#check_in_out_note_textarea");
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
      let me = this;
      const popover = document.getElementById("myPopover");
      const toggleButton = document.getElementById("popupBtn");
      const cancelBtn = document.getElementById("cancelBtn");
      const confirmBtn = document.getElementById("confirmBtn");
      toggleButton.addEventListener("click", () => {
        frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_non_consolidated_invoices",
          callback: function(response) {
            const invoices = response.message || [];
            const content = document.querySelector(".popover-content");
            const searchBox = document.querySelector(".search-box");
            function renderInvoices(filteredInvoices) {
              if (filteredInvoices.length === 0) {
                content.innerHTML = '<div class="no-invoices">No invoices found</div>';
              } else {
                let html = '<div class="invoice-list">';
                filteredInvoices.forEach((invoice) => {
                  html += `
									<div class="invoice-item" data-name="${invoice.name}">
										<div class="invoice-details">
											<div class="invoice-name">${invoice.customer || "No Customer"}</div>
											<div class="invoice-id">${invoice.name}</div>
											<div class="invoice-date">${frappe.datetime.str_to_user(invoice.posting_date)}</div>
											<div class="invoice-amount">${format_currency(invoice.grand_total)}</div>
										</div>
										<div class="invoice-actions">
											<button class="btn btn-xs btn-default print-invoice">
												<i class="fa fa-print"></i> Print
											</button>
										</div>
									</div>
								`;
                });
                html += "</div>";
                content.innerHTML = html;
                content.querySelectorAll(".print-invoice").forEach((btn) => {
                  btn.addEventListener("click", (e) => {
                    const invoiceName = e.target.closest(".invoice-item").dataset.name;
                    const invoice = invoices.find((inv) => inv.name === invoiceName);
                    console.log("the invoiceeeeeeeeeeee is ", invoice);
                    me.on_print_pos(invoice);
                  });
                });
              }
            }
            renderInvoices(invoices);
            searchBox.addEventListener("input", (e) => {
              const searchTerm = e.target.value.toLowerCase();
              const filteredInvoices = invoices.filter(
                (invoice) => (invoice.customer || "").toLowerCase().includes(searchTerm)
              );
              renderInvoices(filteredInvoices);
            });
            searchBox.value = "";
          }
        });
        popover.togglePopover();
      });
      cancelBtn.addEventListener("click", () => {
        popover.hidePopover();
      });
      confirmBtn.addEventListener("click", () => {
        popover.hidePopover();
      });
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
      this.unsenced_invoices.on("click", (event2) => {
        this.on_menu_click("unsenced_invoices");
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
      this.debt.on("click", (event2) => {
        this.on_debt_click();
      });
      this.exchange_btn.on("click", (event2) => {
        this.showCheckInOutDialog();
      });
      this.dark_floating_background.on("click", (event2) => {
        this.hideCheckInOutDialog();
      });
      this.check_in_box.on("click", (event2) => {
        this.check_in_out_type = "In";
        this.check_in_box.addClass("selected");
        this.check_out_box.removeClass("selected");
      });
      this.check_out_box.on("click", (event2) => {
        this.check_in_out_type = "Out";
        this.check_out_box.addClass("selected");
        this.check_in_box.removeClass("selected");
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
        checkInOut.reason_note = this.check_in_out_note.val();
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
    constructor(wrapper, settingsData, selectedItemMaps, priceLists, customerList, brandList, salesTaxes, invoiceData, selectedTab, selectedItem, selectedField, onSelectedItemClick, onTabClick, onKeyPressed, createNewTab, onCheckoutClick, savePosInvoice, db) {
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
      this.on_key_pressed = onKeyPressed;
      this.on_checkout_click = onCheckoutClick;
      this.on_selected_item_click = onSelectedItemClick;
      this.on_tab_click = onTabClick;
      this.create_new_tab = createNewTab;
      this.save_pos_invoice = savePosInvoice;
      this.db = db;
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
      let containerBoxStyle = "";
      let containerStyle = "";
      let btnStyle = "";
      let checkoutBtn = "";
      if (this.settings_data.settings.keyboardStyle == this.settings_data.keyboard_styles[0]) {
        containerBoxStyle = "margin:0px 16px;padding:0px 0px 16px 0px;";
        containerStyle = "width:100%;display:grid;grid-template-columns:auto auto auto auto;";
        btnStyle = "height:45px;padding:4px;margin:6px;background:#f5f5f5;border:2px solid #e0e0e0;border-radius:12px;color:black;font-size:small;text-align:center;display:flex;justify-content:center;align-items:center;";
        checkoutBtn = "width:calc(100% - 32px);margin:0px 16px 16px 16px;padding : 8px 0px ;color:#FFFFFF;font-size:larger;font-weight:600;background:#44A292;border:3px solid #2D6B61;border-radius:8px;outline:none;";
      } else {
        containerBoxStyle = "width:100%;";
        containerStyle = "width:100%;display:grid;grid-template-columns:auto auto auto auto;";
        btnStyle = "height:45px;padding:4px;background:#f5f5f5;border:1px solid #a0a0a0;color:black;font-size:small;text-align:center;display:flex;justify-content:center;align-items:center;";
        checkoutBtn = "width:100%;height:55px;color:#FFFFFF;font-size:19px;font-weight:600;background:#44A292;border:none;outline:none;";
      }
      this.wrapper.append('<div id="tabs"    class="rowBox"><div id="tabs_container" class="rowBox" style="overflow-x:auto;overflow-y:hidden;" ></div></div>');
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
      this.cartHeader.append('<div style="font-size:16px;font-weight:600;"><p>Item</p></div>');
      this.cartHeader.append('<div id="cartHeaderTitles" class="rowBox"></div>');
      this.cartHeaderTitles = this.cartHeader.find("#cartHeaderTitles");
      this.cartHeaderTitles.append('<div id="quantityTitle" style="font-size:16px;font-weight:600;margin-right:16px;" >  <p>Quantity</p></div>');
      this.cartHeaderTitles.append('<div id="amountTitle"   style="font-size:16px;font-weight:600;" >  <p>Amount  </p></div>');
      this.selectedItemContainer = this.cartBox.find("#selectedItemsContainer");
      this.cartFooter = this.cartBox.find("#cartFooter");
      this.cartFooter.append('<div id="cartDetails" class="columnBox"></div>');
      this.cartFooter.append(`<div id="editSelectedItemCart" style="${containerBoxStyle}"></div>`);
      this.cartFooter.append(`<div id="mainBtnContainer" class="rowBox centerItem"  style="${checkoutBtn}">  </div>`);
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
      if (this.sales_taxes.length == 0) {
        this.netTotal.css("display", "none");
      }
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
      if (!this.settings_data.settings.showDiscountField) {
        this.setKeyboardOrientation("landscape");
        this.discount.css("display", "none");
      }
      this.editSelectedItem = this.cartFooter.find("#editSelectedItemCart");
      this.editSelectedItem.css("display", "flex");
      this.editSelectedItem.append(`<div class="grid-container"  style="${containerStyle}">`);
      this.buttonsContainer = this.editSelectedItem.find(".grid-container");
      this.buttonsContainer.append(`<button id="key_1"        class="grid-item"  style="${btnStyle}" data-action="1"        > 1         </button>`);
      this.buttonsContainer.append(`<button id="key_2"        class="grid-item"  style="${btnStyle}" data-action="2"        > 2         </button>`);
      this.buttonsContainer.append(`<button id="key_3"        class="grid-item"  style="${btnStyle}" data-action="3"        > 3         </button>`);
      this.buttonsContainer.append(`<button id="key_quantity" class="grid-item"  style="${btnStyle}" data-action="Quantity" > Quantit\xE9  </button>`);
      this.buttonsContainer.append(`<button id="key_4"        class="grid-item"  style="${btnStyle}" data-action="4"        > 4         </button>`);
      this.buttonsContainer.append(`<button id="key_5"        class="grid-item"  style="${btnStyle}" data-action="5"        > 5         </button>`);
      this.buttonsContainer.append(`<button id="key_6"        class="grid-item"  style="${btnStyle}" data-action="6"        > 6         </button>`);
      this.buttonsContainer.append(`<button id="key_rate"     class="grid-item"  style="${btnStyle}" data-action="Rate"     > Prix      </button>`);
      this.buttonsContainer.append(`<button id="key_7"        class="grid-item"  style="${btnStyle}" data-action="7"        > 7         </button>`);
      this.buttonsContainer.append(`<button id="key_8"        class="grid-item"  style="${btnStyle}" data-action="8"        > 8         </button>`);
      this.buttonsContainer.append(`<button id="key_9"        class="grid-item"  style="${btnStyle}" data-action="9"        > 9         </button>`);
      this.buttonsContainer.append(`<button id="key_minus"    class="grid-item"  style="${btnStyle}" data-action="-"        > -         </button>`);
      this.buttonsContainer.append(`<button id="key_point"    class="grid-item"  style="${btnStyle}" data-action="."        > .         </button>`);
      this.buttonsContainer.append(`<button id="key_0"        class="grid-item"  style="${btnStyle}" data-action="0"        > 0         </button>`);
      this.buttonsContainer.append(`<button id="key_delete"   class="grid-item"  style="${btnStyle}" data-action="Delete"   > Supprimer </button>`);
      this.buttonsContainer.append(`<button id="key_remove"   class="grid-item"  style="${btnStyle}color:red;font-weight:700;" data-action="Remove">Retirer</button>`);
      this.mainBtnContainer = this.cartFooter.find("#mainBtnContainer");
      this.mainBtnContainer.append(`<button type="button" id="checkoutBtn" style="width:50%;height:100%;background:none;border:none;border-right:2px solid #663959;color:white;"> Payment </button>`);
      this.mainBtnContainer.append(`<button type="button" id="printBtn"    style="width:50%;height:100%;background:#E1472B;border:none;border-left:2px solid #2D6B61;color:white;"> Print </button>`);
      this.mainBtnContainer.find("#checkoutBtn").on("mousedown", (event2) => {
        this.on_checkout_click();
      });
      this.mainBtnContainer.find("#printBtn").on("mousedown", (event2) => {
        console.log("1..the map : ", structuredClone(this.selected_item_maps.get(this.selected_tab.tabName)));
        this.on_key_pressed("print", null);
        console.log("2..the map : ", structuredClone(this.selected_item_maps.get(this.selected_tab.tabName)));
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
        this.refreshTabs();
        this.refreshSelectedItem();
        this.on_tab_click(clickedTab);
      });
      this.tabs_container.find(".tabDeleteBtn").on("click", (event2) => {
        event2.stopPropagation();
        const clickedTab = $(event2.target).closest(".tab").find(".tabName").text();
        const invoiceItems = this.selected_item_maps.get(clickedTab).items;
        if (invoiceItems && invoiceItems.length > 0) {
          frappe.confirm(
            "Are you sure you want to proceed?",
            () => {
              console.log("see here : ", this.selected_item_maps.get(clickedTab));
              this.db.deletePosInvoice(this.selected_item_maps.get(clickedTab).name);
              this.selected_item_maps.delete(clickedTab);
              if (this.selected_item_maps.size > 0) {
                this.selected_tab.tabName = Array.from(this.selected_item_maps.keys())[0];
                console.log("this.selected_tab.tabName : ", this.selected_tab);
              } else {
                this.createNewTab();
              }
              this.refreshTabs();
              this.refreshSelectedItem();
            },
            () => {
            }
          );
        } else {
          this.selected_item_maps.delete(clickedTab);
          if (this.selected_item_maps.size > 0) {
            this.selected_tab.tabName = Array.from(this.selected_item_maps.keys())[0];
          } else {
            this.createNewTab();
          }
          this.refreshTabs();
          this.refreshSelectedItem();
        }
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
        const itemPrice = document.createElement("div");
        if (!this.settings_data.settings.showItemImage) {
        } else if (item.image) {
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
        itemName.textContent = item.item_name;
        itemName.classList.add("selectedItemName");
        leftGroup.appendChild(itemName);
        itemQuantity.textContent = item.qty;
        itemQuantity.classList.add("itemQuantity");
        itemQuantity.style.fontSize = "18px";
        itemQuantity.style.fontWeight = "600";
        rightGroup.appendChild(itemQuantity);
        itemPrice.textContent = item.rate - item.discount_amount + " DA";
        itemPrice.classList.add("itemPrice");
        itemPrice.style.fontSize = "18px";
        itemPrice.style.fontWeight = "600";
        itemPrice.style.width = "90px";
        itemPrice.style.display = "flex";
        itemPrice.style.flexDirection = "row-reverse";
        rightGroup.appendChild(itemPrice);
        leftGroup.classList.add("rowBox", "align_center", "leftGroup");
        itemElement.appendChild(leftGroup);
        rightGroup.classList.add("rowBox", "align_center", "rightGroup");
        itemElement.appendChild(rightGroup);
        itemElement.classList.add("rowBox", "align_center", "row_sbtw", "ItemElement", "pointer");
        if (item.name == this.selected_item.name)
          itemElement.classList.add("selected");
        itemElement.addEventListener("click", (event2) => {
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
    scrollToBottom() {
      this.selectedItemContainer.scrollTop(this.selectedItemContainer[0].scrollHeight);
    }
    createNewTab() {
      this.counter += 1;
      this.create_new_tab(this.counter);
      this.refreshTabs();
      this.refreshSelectedItem();
    }
    restorePos(pos) {
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
        if (this.settings_data.settings.showDiscountField) {
          discount.css("display", "flex");
        }
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
      const minusButton = this.buttonsContainer.find("#key_minus");
      if (this.selected_field.field_name == "quantity") {
        quantityButton.addClass("selected");
        rateButton.removeClass("selected");
        minusButton.removeClass("selected");
      } else if (this.selected_field.field_name == "rate") {
        quantityButton.removeClass("selected");
        rateButton.addClass("selected");
        minusButton.removeClass("selected");
      } else if (this.selected_field.field_name == "discount_percentage") {
        quantityButton.removeClass("selected");
        rateButton.removeClass("selected");
        minusButton.addClass("selected");
      } else {
        quantityButton.removeClass("selected");
        rateButton.removeClass("selected");
        minusButton.removeClass("selected");
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
      const key_minus = this.buttonsContainer.find("#key_minus");
      const key_rate = this.buttonsContainer.find("#key_rate");
      const key_remove = this.buttonsContainer.find("#key_remove");
      const key_delete = this.buttonsContainer.find("#key_delete");
      const key_point = this.buttonsContainer.find("#key_point");
      let keys = [key_0, key_1, key_2, key_3, key_4, key_5, key_6, key_7, key_8, key_9, key_quantity, key_minus, key_rate, key_remove, key_delete, key_point];
      keys.forEach((key) => {
        key.on("mousedown", (event2) => {
          event2.preventDefault();
          const keyContent = key.data("action");
          if (!isNaN(keyContent)) {
            this.on_key_pressed("addToField", keyContent);
          } else if (keyContent == ".") {
            this.on_key_pressed("addToField", keyContent);
          } else if (keyContent == "Quantity") {
            this.on_key_pressed("quantity", null);
          } else if (keyContent == "Rate") {
            this.on_key_pressed("rate", null);
          } else if (keyContent == "-") {
            this.on_key_pressed("minus", null);
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
      this.discountInput.on("input", (event2) => {
        if (event2.target.value == "") {
          this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage = 0;
          return;
        } else if (event2.target.value > 100) {
          this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage = 100;
          return;
        }
        this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage = parseFloat(event2.target.value);
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
        this.calculateNetTotal();
        this.calculateVAT();
        this.calculateGrandTotal();
      });
      this.priceListInput.on("input", (event2) => {
        this.selected_item_maps.get(this.selected_tab.tabName).priceList = event2.target.value;
        this.resetItemRateBaseOnPriceList();
        this.refreshSelectedItem();
        this.save_pos_invoice();
      });
      this.customerInput.on("input", (event2) => {
        this.selected_item_maps.get(this.selected_tab.tabName).customer = event2.target.value;
        let priceList = this.getCustomerDefaultPriceList(event2.target.value);
        if (priceList == "" || priceList == null || priceList == void 0) {
        } else {
          this.priceListInput.val(priceList);
          this.selected_item_maps.get(this.selected_tab.tabName).priceList = priceList;
        }
        this.resetItemRateBaseOnPriceList();
        this.refreshSelectedItem();
        this.save_pos_invoice();
      });
    }
    getCustomerDefaultPriceList(customerId) {
      let priceList = "";
      this.customer_list.forEach((customer) => {
        if (customer.name == customerId) {
          priceList = customer.default_price_list;
        }
      });
      return priceList;
    }
    calculateNetTotal() {
      let netTotal = 0;
      this.selected_item_maps.get(this.selected_tab.tabName).items.forEach((item) => {
        netTotal += item.rate * item.qty;
      });
      if (this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage > 0) {
        netTotal -= netTotal * (this.selected_item_maps.get(this.selected_tab.tabName).additional_discount_percentage / 100);
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
        var _a;
        console.log("item ", item);
        if (item.manually_edited == true) {
          return;
        }
        item.rate = ((_a = item.prices.find((price) => price.price_list == this.selected_item_maps.get(this.selected_tab.tabName).priceList)) == null ? void 0 : _a.price_list_rate) || 0;
        item.discount_percentage = 0;
        item.discount_amount = 0;
      });
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
    getQtyInWarehouse(itemId, warehouseId) {
      const bin = this.bin_list.find((bin2) => bin2.item_code == itemId && bin2.warehouse == warehouseId);
      return bin ? bin.actual_qty : 0;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_payment_cart.js
  pos_ar.PointOfSale.pos_payment_cart = class {
    constructor(wrapper, selectedItemMap, selectedTab, appData, paymentMethods, selectedPaymentMythod, invoiceData, onClose, onComplete, onInput) {
      this.wrapper = wrapper;
      this.selected_item_map = selectedItemMap;
      this.selected_tab = selectedTab;
      this.app_data = appData;
      this.payment_methods = paymentMethods;
      this.selected_payment_method = selectedPaymentMythod;
      this.invoice_data = invoiceData;
      this.on_close_cart = onClose;
      this.on_complete = onComplete;
      this.on_input = onInput;
      this._payment_method = this.payment_methods[0];
      this.start_work();
    }
    start_work() {
      this.prepare_payment_cart();
      this.calculateGrandTotal();
      this.setListeners();
    }
    prepare_payment_cart() {
      this.wrapper.append(`
			<div id="AlertPopover" popover>
				<div class="AlertPopover-header">
					<h2>Notice</h2>
				</div>
				<div class="AlertPopover-content">
					<!-- Content will go here -->
					<p></p>
				</div>
				<div class="AlertPopover-footer">
					<button class="btn btn-primary" id="AlertPopoverConfirmBtn">Done</button>
				</div>
			</div>
		`);
      const style = document.createElement("style");
      style.textContent = `
			#AlertPopover {
				min-width: 600px !important;
				max-width: 80vw !important;
			}
			#AlertPopover-content {
				width: 100%;
				padding: 0;
			}
		`;
      document.head.appendChild(style);
      this.wrapper.append('<div id="paymentMethodCart" class="columnBox align_center"></div>');
      this.paymentCart = this.wrapper.find("#paymentMethodCart");
      this.paymentCart.append(
        `<script src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs" type="module"><\/script><div id="payment_waitingContainer" style="position:absolute;background:#00000050;top:0;left:0;inset: 0;display:none;backdrop-filter: blur(2px);z-index: 10;" class="rowBox centerItem" ><dotlottie-player src="https://lottie.host/d6c76206-aab9-4d5a-af73-c4a6cfc5aaa9/H8vnpKcKj9.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player></div>`
      );
      this.waiting_cart = this.wrapper.find("#payment_waitingContainer");
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
      this.payment_methods.forEach((method) => {
        const selected = this._payment_method.name == method.name ? "selected" : "";
        const amountField = this.getModeOfPaymentById(method.mode_of_payment).type == "Phone" ? "display:none;" : "";
        this.cart_content_top_section.append(`<div id="${method.name}" class="paymentMethodBox ${selected}"><div id="BoxTitle" class="title ${selected}">${method.mode_of_payment}</div><input type="number" id="cachInput" class="paymentInput" value="0" style="${amountField}"  ></div>`);
      });
      this.cart_content_bottom_section.append("<h4>Additional Information</h4>");
      this.cart_footer.append('<div id="paymentDetailsContainer" class="rowBox align_center"></div>');
      this.cart_footer.append('<button class="posBtn1" type="button" id="completeOrderBtn">Complete Order</button>');
      this.payment_details = this.cart_footer.find("#paymentDetailsContainer");
      this.payment_details.append('<div class="columnBox"><div id="paymentGrandTotalTitle" class="rowBox centerItem">Grand Total</div><div id="paymentGrandTotalValue" class="rowBox centerItem"></div></div>');
      this.payment_details.append("<hr>");
      this.payment_details.append(`<div id="paymentPaidAmount" class="columnBox"><div id="paymentPaidAmountTitle" class="rowBox centerItem">Paid Amount</div><div id="paimentPaidAmountValue"  class="rowBox centerItem"> 0 DA </div></div>`);
      this.payment_details.append("<hr>");
      this.payment_details.append(`<div id="paymentToChange" class="columnBox"><div id="paimentToChangeTitle" class="rowBox centerItem">To Change</div><div id="paimentToChangeValue"  class="rowBox centerItem"> ${this.calculateToChange()} DA </div></div>`);
    }
    preparDefault() {
      this.calculateGrandTotal();
      this._payment_method = this.payment_methods[0];
      this.cart_content_top_section.find(".paymentMethodBox").removeClass("selected");
      this.cart_content_top_section.find(`.paymentMethodBox#${this._payment_method.name}`).addClass("selected");
      this.cart_content_top_section.find(".paymentMethodBox .title").removeClass("selected");
      this.cart_content_top_section.find(`.paymentMethodBox#${this._payment_method.name} .title`).addClass("selected");
      const selectedBox = $(`#${this._payment_method.name}`);
      if (selectedBox.length) {
        selectedBox.find(".paymentInput").val(this.invoice_data.grandTotal);
        this.selected_item_map.get(this.selected_tab.tabName).payments.forEach((mode) => {
          if (mode.mode_of_payment == this._payment_method.mode_of_payment) {
            mode.amount = this.invoice_data.grandTotal;
          }
        });
        this.updatePaidAmount();
        this.updateToChange();
      }
    }
    showCart() {
      this.cart.css("display", "flex");
      this.preparDefault();
    }
    hideCart() {
      this.cart.css("display", "none");
    }
    show_waiting() {
      console.log("we are heeer display", this.waiting_cart);
      this.waiting_cart.css("display", "flex");
    }
    hide_waiting() {
      console.log("we are heeer for hide");
      this.waiting_cart.css("display", "none");
    }
    setListeners() {
      const me = this;
      this.cart_content_top_section.on("click", ".paymentMethodBox", function() {
        $(".paymentMethodBox").removeClass("selected");
        $(".paymentMethodBox div.title").removeClass("selected");
        $(this).addClass("selected");
        $(this).find(".title").addClass("selected");
        const clickedId = $(this).attr("id");
        me.payment_methods.forEach((method) => {
          if (method.name == clickedId) {
            me._payment_method = method;
          }
        });
        $(".paymentMethodBox").not(this).find(".paymentInput").val(0);
        $(this).find(".paymentInput").val(me.invoice_data.grandTotal);
        me.selected_item_map.get(me.selected_tab.tabName).payments.forEach((mode) => {
          if (mode.mode_of_payment != me._payment_method.mode_of_payment) {
            mode.amount = 0;
          } else {
            if (me.getModeOfPaymentById(mode.mode_of_payment).type == "Phone") {
              mode.amount = 0;
            } else {
              mode.amount = me.invoice_data.grandTotal;
            }
          }
        });
        me.updatePaidAmount();
        me.updateToChange();
      });
      this.cart_content_top_section.on("input", ".paymentInput", function() {
        const inputValue = parseFloat($(this).val()) || 0;
        const boxId = $(this).closest(".paymentMethodBox").attr("id");
        me.selected_item_map.get(me.selected_tab.tabName).payments.forEach((mode) => {
          if (mode.mode_of_payment == me._payment_method.mode_of_payment) {
            mode.amount = parseFloat(inputValue);
          }
        });
        me.updatePaidAmount();
        me.updateToChange();
      });
      const popover = document.getElementById("AlertPopover");
      const btn = document.querySelector("#AlertPopoverConfirmBtn");
      btn.addEventListener("click", () => {
        console.log("confirm btn clicked");
        document.getElementById("AlertPopover").hidePopover();
      });
      this.cart_footer.find("#completeOrderBtn").on("click", (event2) => {
        let error_message = "";
        let popover_title = "";
        var paidAmount = 0;
        var cost = 0;
        this.selected_item_map.get(this.selected_tab.tabName).items.forEach((item) => {
          cost += item.rate * item.qty;
        });
        this.selected_item_map.get(this.selected_tab.tabName).payments.forEach((mode) => {
          paidAmount += mode.amount;
        });
        if (paidAmount < cost && this.selected_item_map.get(this.selected_tab.tabName).customer.toLowerCase().includes("public")) {
          error_message = "Public customer can't pay less than cost.";
          popover_title = "Payment Error";
        }
        this.selected_item_map.get(this.selected_tab.tabName).items.forEach((item) => {
          if (item.qty == 0) {
            error_message = "You have an item with quantity 0.";
            popover_title = "Quantity Alert";
          }
          if (item.rate == 0) {
            error_message = "You have an item with rate 0.";
            popover_title = "Rate Alert";
          }
        });
        if (error_message !== "") {
          this.wrapper.find(".AlertPopover-header h2").text(popover_title);
          this.wrapper.find(".AlertPopover-content").html(`<p>${error_message}</p>`);
          popover.togglePopover();
        } else {
          frappe.confirm(
            "Submit the invoice ?",
            () => {
              this.on_complete();
            },
            () => {
            }
          );
        }
      });
    }
    handleInput(key) {
    }
    deleteKeyPress() {
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
    calculatePaidAmount() {
      let paidAmountDA = 0;
      this.selected_item_map.get(this.selected_tab.tabName).payments.forEach((mode) => {
        paidAmountDA += mode.amount;
      });
      return paidAmountDA;
    }
    updatePaidAmount() {
      this.payment_details.find("#paimentPaidAmountValue").text(`${this.calculatePaidAmount()} DA`);
    }
    calculateToChange() {
      console.log("see why the error ", " calculatePaidAmount ", this.calculatePaidAmount(), " grandTotal ", this.invoice_data.grandTotal);
      return this.calculatePaidAmount() - this.invoice_data.grandTotal;
    }
    updateToChange() {
      this.payment_details.find("#paimentToChangeValue").text(`${this.calculateToChange().toFixed(2)} DA`);
    }
    calculateGrandTotal() {
      this.payment_details.find("#paymentGrandTotalValue").text(`${this.invoice_data.grandTotal.toFixed(2)} DA`);
      return parseFloat(this.invoice_data.grandTotal.toFixed(2));
    }
    getModeOfPaymentById(id) {
      let r = null;
      this.app_data.posProfileModeOfPayments.forEach((mode) => {
        if (mode.name == id) {
          r = mode;
        }
      });
      return r;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_history.js
  pos_ar.PointOfSale.pos_history = class {
    constructor(wrapper, db, selectedPosProfile, appData, appSettings, company, salesTaxes, onClick) {
      this.wrapper = wrapper;
      this.db = db;
      this.selected_pos_profile = selectedPosProfile;
      this.app_data = appData;
      this.app_settings = appSettings;
      this.company = company;
      this.sales_taxes = salesTaxes;
      this.on_click = onClick;
      this.localPosInvoice = { lastTime: null, pos_invoices: [] };
      this.filter = "";
      this.search_value = "";
      this.filtered_pos_list = [];
      this.selected_pos = null;
      this.start_work();
    }
    async start_work() {
      this.prepare_history_cart();
      const result = await this.db.getAllPosInvoice();
      this.localPosInvoice.pos_invoices = result;
      this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter((pos) => {
        if (pos.status == "Unpaid") {
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
      this.setListener();
    }
    prepare_history_cart() {
      this.wrapper.find("#LeftSection").append('<div id="historyLeftContainer" class="columnBox"></div>');
      this.wrapper.find("#RightSection").append('<div id="historyRightContainer" class="columnBox"></div>');
      this.left_container = this.wrapper.find("#historyLeftContainer");
      this.right_container = this.wrapper.find("#historyRightContainer");
      this.left_container.append('<div id="PosContentHeader" class="rowBox" ><div class="c1 columnBox"><div id="posCustomer">Customer</div><div id="posSoldBy"></div><div id="posStatus" class="Paid"></div></div><div class="c2 columnBox"><div id="posCost">0,0000 DA</div><div id="posId">ACC-PSINV-2024-ID</div><div id="posRealId">POS realI</div></div></div>');
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
      this.left_container.append('<div id="posActionsContainer" class="rowBox align_content"  style="display = none ;" > <div id="posPrintBtn" class="actionBtn rowBox centerItem"> Print Receipt </div>  <div id="posDuplicateBtn" class="actionBtn rowBox centerItem"> Duplicate </div>   <div id="posReturnBtn" class="actionBtn rowBox centerItem"> Return </div>  </div>');
      this.left_container.append('<div id="posDraftActionsContainer" class="rowBox align_content" style="display = none ;"> <div id="posEditBtn" class="actionBtn rowBox centerItem"> Edit Invoice </div>  <div id="posDeleteBtn" class="actionBtn rowBox centerItem"> Delete Invoice </div>  </div>');
      this.actionButtonsContainer = this.left_container.find("#posActionsContainer");
      this.printBtn = this.actionButtonsContainer.find("#posPrintBtn");
      this.duplicateBtn = this.actionButtonsContainer.find("#posDuplicateBtn");
      this.returnBtn = this.actionButtonsContainer.find("#posReturnBtn");
      this.draftActionButtonsContainer = this.left_container.find("#posDraftActionsContainer");
      this.deleteBtn = this.draftActionButtonsContainer.find("#posDeleteBtn");
      this.editBtn = this.draftActionButtonsContainer.find("#posEditBtn");
      this.right_container.append(`<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4></div>`);
      this.right_container.append('<div id="historyRightSearchContainer" class="rowBox align_center" ></div>');
      this.search_container = this.right_container.find("#historyRightSearchContainer");
      this.search_container.append('<select  id="PosInvoiceTypeInput" placeholder="POS Invoice Type">');
      this.filter_input = this.search_container.find("#PosInvoiceTypeInput");
      this.filter_input.append('<option value="Draft">Draft</option><option value="Paid">Paid</option> <option value="Unpaid" selected>Unpaid</option>');
      this.search_container.append('<input type="text" id="historyInput" placeholder="Search by invoice id or custumer name">');
      this.search_field = this.search_container.find("#historyInput");
      this.right_container.append('<div id="historyRecentInvoicesContainer" ></div>');
      this.right_data_container = this.right_container.find("#historyRecentInvoicesContainer");
    }
    refreshData() {
      this.right_data_container.html("");
      this.filtered_pos_list.forEach((record) => {
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
        posName.textContent = record.refNum;
        const posCost = document.createElement("div");
        posCost.classList.add("posCost");
        posCost.textContent = record.paid_amount + " DA";
        l1.appendChild(posName);
        if (record.consolidated_invoice) {
          const consolidatedFlag = document.createElement("div");
          consolidatedFlag.classList.add("consolidated-flag");
          consolidatedFlag.style.margin = "0 8px 0 8px";
          consolidatedFlag.innerHTML = `Consolidated`;
          l1.appendChild(consolidatedFlag);
        }
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
          console.log("click", record);
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
      this.pos_header.find("#posCost").text(this.selected_pos.paid_amount + " DA");
      this.pos_header.find("#posId").text((_b = this.selected_pos.refNum) != null ? _b : "POS Invoice CachId");
      this.pos_header.find("#posRealId").text((_c = this.selected_pos.real_name) != null ? _c : "");
      this.pos_header.find("#posStatus").text(this.selected_pos.status);
      this.pos_header.find("#posStatus").removeClass().addClass(`${this.selected_pos.status}`);
      if (this.selected_pos.consolidated_invoice) {
        if (!this.pos_header.find("#posConsolidated").length) {
          this.pos_header.find(".c1").append('<div id="posConsolidated" class="consolidated-info"></div>');
        }
        this.pos_header.find("#posConsolidated").html(`
                <span class="consolidated-label">Consolidated:</span>
                <span class="consolidated-value">${this.selected_pos.consolidated_invoice}</span>
            `);
      } else {
        this.pos_header.find("#posConsolidated").remove();
      }
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
      if (this.selected_pos.taxes_and_charges == "" || this.selected_pos.taxes_and_charges == null) {
        this.totalList.append(`<div class="rowBox align_item"> <div class="grandTotalName rowBox align_center">Grand Total</div> <div class="grandTotalPrice rowBox align_center">${netTotal} DA</div> </div>`);
      } else {
        this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">Net Total</div> <div class="price rowBox align_center">${netTotal} DA</div> </div>`);
        let allTax = 0;
        if (this.selected_pos.taxes_and_charges != "" && this.selected_pos.taxes_and_charges != null) {
          this.sales_taxes.forEach((tax) => {
            allTax += tax.rate / 100 * netTotal;
            this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">${tax.description}</div> <div class="price rowBox align_center">${tax.rate / 100 * netTotal} DA</div> </div>`);
          });
        }
        this.totalList.append(`<div class="rowBox align_item"> <div class="grandTotalName rowBox align_center">Grand Total</div> <div class="grandTotalPrice rowBox align_center">${netTotal + allTax} DA</div> </div>`);
      }
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
      this.db.getAllPosInvoice_callback(
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
            this.selected_pos = this.filtered_pos_list[0];
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
        console.log("we are here1");
        this.filterList(this.search_field.val(), this.filter_input.val());
      });
      this.search_field.on("input", (event2) => {
        console.log("we are here2");
        this.filterList(this.search_field.val(), this.filter_input.val());
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
        console.log("returned invoice : ", this.selected_pos);
        this.on_click("return", this.selected_pos);
      });
      this.printBtn.on("click", (event2) => {
        this.print_receipt(this.selected_pos);
      });
      this.duplicateBtn.on("click", (event2) => {
        this.selected_pos.items.forEach((item) => {
          item.name = item.item_name;
        });
        this.on_click("duplicate", this.selected_pos);
        console.log("duplicate invoice : ", this.selected_pos);
      });
    }
    filterList(search, filter) {
      this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter((pos) => {
        const matchesCustomer = (pos.customer || "").toLowerCase().includes(search.toLowerCase());
        const matchesRefNum = (pos.refNum || "").toLowerCase().includes(search.toLowerCase());
        const matchesName = (pos.real_name || "").toLowerCase().includes(search.toLowerCase());
        const matchesAll = search == "";
        const matchesFilter = pos.status == filter;
        return matchesFilter && (matchesCustomer || matchesRefNum || matchesName || matchesAll);
      });
      if (this.filtered_pos_list.length == 0) {
        this.selected_pos = null;
      } else {
        this.selected_pos = this.filtered_pos_list[0];
        console.log("debuging invoice : ", this.selected_pos, "and : ", this.filtered_pos_list);
      }
      this.refreshData();
    }
    async print_receipt(pos) {
      try {
        if (!pos) {
          console.error("No POS data provided");
          frappe.throw(__("Error: No POS data available for printing"));
          return;
        }
        const totals = {
          netTotal: 0,
          taxes: 0,
          grandTotal: 0,
          totalQty: 0,
          totalItems: 0
        };
        const formatNumber = (num) => {
          return new Intl.NumberFormat("fr-DZ", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(num);
        };
        const customer = this.app_data.appData.customers.find((c) => c.name === pos.customer);
        if (!customer) {
          console.error("Customer not found:", pos.customer);
          frappe.throw(__("Error: Customer information not found"));
          return;
        }
        let previous_balance = customer.custom_debt;
        if (this.app_settings.settings.onlineDebt) {
          previous_balance = await this.app_data.fetchCustomerDebt(customer.name);
        }
        const creation_time = pos.creation_time || pos.creation;
        if (!creation_time) {
          console.error("No creation time found in POS object");
          frappe.throw(__("Error: Invalid receipt date"));
          return;
        }
        const [date, time] = creation_time.split(" ");
        const styles = `
				<style>
					@media print {
						display: table-row-group !important;
						@page {
							margin: 0;
							size: 80mm auto;
						}
						body {
							margin: 1mm;
						}
						div.table-header {
							display: table-header-group;
						}
						tbody {
							page-break-before: auto;
						}
						tr {
							page-break-inside: avoid;
						}
						.receipt-footer {
							page-break-before: avoid;
						}
					}
					body {
						font-family: Arial, sans-serif;
						line-height: 1.4;
						color: #000;
					}
					.receipt-container {
						max-width: 80mm;
						margin: 0 auto;
						padding: 1px;
					}
					.logo-container {
						text-align: center;
						margin: 10px 0;
					}
					.logo-container img {
						width: 90%;
						height: auto;
					}
					.company-name {
						text-align: center;
						font-size: 16px;
						font-weight: bold;
						margin: 10px 0;
					}
					.receipt-header {
						margin: 10px 0;
						padding: 5px 0;
						border-top: 1px dashed #000;
						border-bottom: 1px dashed #000;
					}
					.customer-info {
						margin-bottom: 10px;
					}
					.receipt-table {
						width: 100%;
						border-collapse: collapse;
						margin: 10px 0;
					}
					.receipt-table th {
						border-bottom: 1px solid #000;
						padding: 5px;
						text-align: left;
						font-size: 12px;
					}
					.receipt-table td {
						padding: 1px 5px;
						font-size: 12px;
					}
					.totals {
						margin: 10px 0;
						text-align: left;
						font-size: 14px;
					}
					.receipt-footer {
						margin-top: 20px;
						text-align: center;
						font-size: 12px;
						border-top: 1px dashed #000;
						padding-top: 10px;
					}
					.bold {
						font-weight: bold;
					}
					.text-right {
						text-align: right;
					}
				</style>
			`;
        let receiptHTML = `
				${styles}
				<div class="receipt-container">
					<div class="logo-container">
						<img src="/assets/pos_ar/images/logo.jpg" alt="Company Logo" onerror="this.style.display='none';">
					</div>
					<div class="company-name">${this.company.company_name}</div>
					
					<div class="receipt-header">
						<div class="customer-info">
							<div class="bold">Client: ${pos.customer}</div>
							<div style="font-size:10px;">Commande: ${pos.refNum}</div>
							<div style="font-size:10px;">Date: ${date}</div>
							<div style="font-size:10px;">Heure: ${time}</div>
						</div>
					</div>
	
					<table class="receipt-table">
						<div class="table-header">
							<tr>
								<th>Article</th>
								<th class="text-right">Qt\xE9</th>
								<th class="text-right">Prix</th>
								<th class="text-right">Total</th>
							</tr>
						</div>
						<tbody>
			`;
        pos.items.forEach((item) => {
          const itemTotal = item.rate * item.qty;
          totals.netTotal += itemTotal;
          totals.totalQty += item.qty;
          totals.totalItems += 1;
          receiptHTML += `
					<tr>
						<td>${item.item_name}</td>
						<td class="text-right">${item.qty}</td>
						<td class="text-right">${formatNumber(item.rate)}</td>
						<td class="text-right">${formatNumber(itemTotal)}</td>
					</tr>
				`;
        });
        const discount = pos.additional_discount_percentage ? totals.netTotal * pos.additional_discount_percentage / 100 : 0;
        totals.grandTotal = totals.netTotal - discount;
        receiptHTML += `
						</tbody>
					</table>
	
					<div class="totals">
						<div>Quantit\xE9 Totale: ${totals.totalQty}</div>
						<div>Remise: ${formatNumber(discount)} DA</div>
						<div style="margin-top:15px;">
							<div class="bold" style="display:flex; align-items:center; font-size:18px;">
								<div style="width:120px;">Total:</div>
								<div style="flex-grow:1; text-align:center;">${formatNumber(totals.grandTotal)} DA</div>
							</div>
							<div style="display:flex; align-items:center; font-size:14px;">
								<div style="width:120px;">Total Solde:</div>
								<div style="flex-grow:1; text-align:center;">${formatNumber(previous_balance)} DA</div>
							</div>
						</div>
					</div>
	
					<div class="receipt-footer">
						<div>Merci de votre visite!</div>
						<div>${this.company.company_name}</div>
					</div>
				</div>
			`;
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          frappe.throw(__("Error: Popup blocked. Please allow popups for printing."));
          return;
        }
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
          }, 250);
        };
      } catch (error) {
        console.error("Error printing receipt:", error);
        frappe.throw(__("Error printing receipt. Please try again."));
      }
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
        const request = window.indexedDB.open("POSDB_test33", 8);
        request.onerror = (event2) => {
          reject(request.error);
        };
        request.onsuccess = (event2) => {
          resolve(new pos_ar.PointOfSale.pos_db(event2.target.result));
        };
        request.onupgradeneeded = (event2) => {
          const db = event2.target.result;
          let posInvoiceStore;
          let checkInOutStore;
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
            posInvoiceStore = db.createObjectStore("POS Invoice", { keyPath: "name" });
          } else {
            posInvoiceStore = event2.target.transaction.objectStore("POS Invoice");
          }
          if (!posInvoiceStore.indexNames.contains("docstatus")) {
            posInvoiceStore.createIndex("docstatus", "docstatus", { unique: false });
          }
          if (!posInvoiceStore.indexNames.contains("opened")) {
            posInvoiceStore.createIndex("opened", "opened", { unique: false });
          }
          if (!posInvoiceStore.indexNames.contains("creation_time")) {
            posInvoiceStore.createIndex("creation_time", "creation_time", { unique: false });
          }
          if (!db.objectStoreNames.contains("check_in_out")) {
            checkInOutStore = db.createObjectStore("check_in_out", { keyPath: "name" });
          } else {
            checkInOutStore = event2.target.transaction.objectStore("check_in_out");
          }
          if (!checkInOutStore.indexNames.contains("creation_time")) {
            checkInOutStore.createIndex("creation_time", "creation_time", { unique: false });
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
    getPosCounter() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Counter"], "readwrite");
        const store = transaction.objectStore("Counter");
      });
    }
    saveItemList(itemList) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["Item"], "readwrite");
        const store = transaction.objectStore("Item");
        itemList.forEach((item) => {
          const request = store.put(item);
          request.onerror = (err) => {
            console.error("db => error saving Item : ", item, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (err) => {
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
          const request = store.put(posProfile);
          request.onerror = (err) => {
            console.error("db => error saving POS Profile : ", posProfile, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (err) => {
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
          const request = store.put(bin);
          request.onerror = (err) => {
            console.error("db => error saving Bin : ", bin, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (err) => {
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
        warehouseList.forEach((warehouse) => {
          const request = store.put(warehouse);
          request.onerror = (err) => {
            console.error("db => error saving Warehouse : ", warehouse, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (event2) => {
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
          const request = store.put(priceList);
          request.onerror = (err) => {
            console.error("db => error saving Price List : ", priceList, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (err) => {
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
        itemPriceList.forEach((itemPrice) => {
          const request = store.put(itemPrice);
          request.onerror = (err) => {
            console.error("db => error saving Item Price : ", itemPrice, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (err) => {
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
          const request = store.put(itemGroup);
          request.onerror = (err) => {
            reject(err);
            console.error("db => error saving Item Group : ", itemGroup, "err : ", err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (err) => {
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
        const transaction = this.db.transaction(["Customer"], "readwrite");
        const store = transaction.objectStore("Customer");
        customerList.forEach((customer) => {
          const request = store.put(customer);
          request.onerror = (err) => {
            console.error("db => error saving customer : ", customer, "err : ", err);
            reject(err);
          };
        });
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = (event2) => {
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
        const request = store.put(posInvoice);
        request.onsuccess = (event2) => {
          resolve(event2);
        };
        request.onerror = (event2) => {
          reject(event2);
        };
      });
    }
    updatePosInvoice(posInvoice) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const request = store.put(posInvoice);
        request.onsuccess = (event2) => {
          resolve(event2.target.result);
        };
        request.onerror = (event2) => {
          reject(event2);
        };
      });
    }
    getAllPosInvoice() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const dateIndex = store.index("creation_time");
        const invoices = [];
        const request = dateIndex.openCursor(null, "prev");
        request.onsuccess = (event2) => {
          const cursor = event2.target.result;
          if (cursor) {
            invoices.push(cursor.value);
            cursor.continue();
          } else {
            console.log("check the response : ", invoices);
            resolve(invoices);
          }
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
    getAllOpenedPosInvoice() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const result = store.getAll();
        result.onsuccess = (event2) => {
          const value = event2.target.result;
          resolve(value.filter((pos) => pos.opened == 1));
        };
        result.onerror = (err) => {
          reject(err);
        };
      });
    }
    async getAndDeleteAllOpenedPosInvoice() {
      try {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const openedInvoices = await new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result.filter((pos) => pos.opened === 1));
          request.onerror = (event2) => reject(event2.target.error);
        });
        await Promise.all(openedInvoices.map(
          (pos) => new Promise((resolve, reject) => {
            const deleteRequest = store.delete(pos.name);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = (event2) => reject(event2.target.error);
          })
        ));
        return openedInvoices;
      } catch (err) {
        console.error("Error during get-and-delete:", err);
        throw err;
      }
    }
    getAllPosInvoice_callback(onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const dateIndex = store.index("creation_time");
      const invoices = [];
      const request = dateIndex.openCursor(null, "prev");
      request.onsuccess = (event2) => {
        const cursor = event2.target.result;
        if (cursor) {
          invoices.push(cursor.value);
          cursor.continue();
        } else {
          console.log("check the response : ", invoices);
          onSuccess(invoices);
        }
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    getDraftPosInvoice() {
      return new Promise((resolve, reject) => {
        const transaction_posInvoice = this.db.transaction(["POS Invoice"], "readwrite");
        const store_posInvoice = transaction_posInvoice.objectStore("POS Invoice");
        const index_docstatus_posInvoice = store_posInvoice.index("docstatus");
        const request = index_docstatus_posInvoice.getAll(0);
        request.onsuccess = (event2) => {
          resolve(event2.target.result);
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
    getNotSyncedPosNumber(onSuccess, onFailure) {
      const transaction_posInvoice = this.db.transaction(["POS Invoice"], "readwrite");
      const store_posInvoice = transaction_posInvoice.objectStore("POS Invoice");
      const index_docstatus_posInvoice = store_posInvoice.index("docstatus");
      const request = index_docstatus_posInvoice.getAll(1);
      request.onsuccess = (result) => {
        const filtredResult = result.target.result.filter((invoice) => invoice.synced == false);
        onSuccess(filtredResult.length);
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    getNotSyncedPos(onSuccess, onFailure) {
      const transaction_posInvoice = this.db.transaction(["POS Invoice"], "readwrite");
      const store_posInvoice = transaction_posInvoice.objectStore("POS Invoice");
      const index_docstatus_posInvoice = store_posInvoice.index("docstatus");
      const request = index_docstatus_posInvoice.getAll(1);
      request.onsuccess = (result) => {
        const filtredResult = result.target.result.filter((invoice) => invoice.synced == false);
        onSuccess(filtredResult);
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    deletePosInvoice(invoiceName) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const request = store.delete(invoiceName);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
    deletePosInvoice_callback(invoiceName, onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Invoice"], "readwrite");
      const store = transaction.objectStore("POS Invoice");
      const request = store.delete(invoiceName);
      request.onsuccess = () => {
        onSuccess();
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    deleteAllPosInvoice() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Invoice"], "readwrite");
        const store = transaction.objectStore("POS Invoice");
        const request = store.clear();
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
    saveCheckInOut(checkInOut, onSuccess, onFailure) {
      console.log("saveCheckInOut : ", checkInOut);
      const transaction = this.db.transaction(["check_in_out"], "readwrite");
      const store = transaction.objectStore("check_in_out");
      const request = store.put(checkInOut);
      request.onsuccess = (event2) => {
        onSuccess(event2.target.result);
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    getAllCheckInOut() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["check_in_out"], "readwrite");
        const store = transaction.objectStore("check_in_out");
        const dateIndex = store.index("creation_time");
        const checks = [];
        const request = dateIndex.openCursor(null, "prev");
        request.onsuccess = (event2) => {
          const cursor = event2.target.result;
          if (cursor) {
            checks.push(cursor.value);
            cursor.continue();
          } else {
            console.log("check the response : ", checks);
            resolve(checks);
          }
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
    getAllCheckInOut_callback(onSuccess, onFailure) {
      const transaction = this.db.transaction(["check_in_out"], "readwrite");
      const store = transaction.objectStore("check_in_out");
      const dateIndex = store.index("creation_time");
      const checks = [];
      const request = dateIndex.openCursor(null, "prev");
      request.onsuccess = (event2) => {
        const cursor = event2.target.result;
        if (cursor) {
          checks.push(cursor.value);
          cursor.continue();
        } else {
          console.log("check the response : ", checks);
          onSuccess(checks);
        }
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    deleteAllCheckInOut() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["check_in_out"], "readwrite");
        const store = transaction.objectStore("check_in_out");
        const request = store.clear();
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
    updateCheckInOutSync(date) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["check_in_out"], "readwrite");
        const store = transaction.objectStore("check_in_out");
        const request = store.getAll();
        request.onsuccess = (event2) => {
          const records = event2.target.result;
          const updatePromises = [];
          records.forEach((record) => {
            console.log("date : ", new Date(record.creation_time), "the dat ", new Date(date), "record :  ", record);
            if (!record.is_sync && new Date(record.creation_time) <= new Date(date)) {
              record.is_sync = 1;
              updatePromises.push(new Promise((resolveUpdate, rejectUpdate) => {
                const updateRequest = store.put(record);
                updateRequest.onsuccess = () => resolveUpdate();
                updateRequest.onerror = (err) => rejectUpdate(err);
              }));
            }
          });
          Promise.all(updatePromises).then(() => resolve()).catch((err) => reject(err));
        };
        request.onerror = (err) => reject(err);
      });
    }
    updateCheckInOutSync_callback(date, onSuccess, onFailure) {
      const transaction = this.db.transaction(["check_in_out"], "readwrite");
      const store = transaction.objectStore("check_in_out");
      const request = store.getAll();
      request.onsuccess = (event2) => {
        const records = event2.target.result;
        let updatedCount = 0;
        let totalToUpdate = 0;
        records.forEach((record) => {
          if (!record.is_sync && new Date(record.creation) <= new Date(date)) {
            totalToUpdate++;
          }
        });
        if (totalToUpdate === 0) {
          onSuccess();
          return;
        }
        records.forEach((record) => {
          if (!record.is_sync && new Date(record.creation) <= new Date(date)) {
            record.is_sync = 1;
            const updateRequest = store.put(record);
            updateRequest.onsuccess = () => {
              updatedCount++;
              if (updatedCount === totalToUpdate) {
                onSuccess();
              }
            };
            updateRequest.onerror = (err) => {
              onFailure(err);
            };
          }
        });
      };
      request.onerror = (err) => onFailure(err);
    }
    updateSettings(settings) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Settings"], "readwrite");
        const store = transaction.objectStore("POS Settings");
        const request = store.put(__spreadValues({ id: 1 }, settings));
        request.onsuccess = (event2) => {
          resolve(event2.target.result);
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
    updateSettings_callback(settings, onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Settings"], "readwrite");
      const store = transaction.objectStore("POS Settings");
      const request = store.put(__spreadValues({ id: 1 }, settings));
      request.onsuccess = (event2) => {
        onSuccess(event2.target.result);
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    getSettings(onSuccess, onFailure) {
      const transaction = this.db.transaction(["POS Settings"], "readwrite");
      const store = transaction.objectStore("POS Settings");
      const request = store.get(1);
      request.onsuccess = (event2) => {
        onSuccess(event2.target.result);
      };
      request.onerror = (err) => {
        onFailure(err);
      };
    }
    deleteAllSettings() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["POS Settings"], "readwrite");
        const store = transaction.objectStore("POS Settings");
        const request = store.clear();
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (err) => {
          reject(err);
        };
      });
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_settings.js
  pos_ar.PointOfSale.pos_settings = class {
    constructor(wrapper, settingsData, selectedPosProfile, onSettingsChange) {
      this.wrapper = wrapper;
      this.settings_data = settingsData;
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
      this.pos_profile_select.append(`<option value="${this.selected_pos_profile.name} selected ">${this.selected_pos_profile.name}</option>`);
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
      const showItemDetailsCart = this.settings_data.settings.showItemDetails ? "checked" : "";
      const showItemImage = this.settings_data.settings.showItemImage ? "checked" : "";
      const showDiscountField = this.settings_data.settings.showDiscountField ? "checked" : "";
      const searchByGroup = this.settings_data.settings.search_by_group ? "checked" : "";
      const onlineDebt = this.settings_data.settings.onlineDebt ? "checked" : "";
      const sendInvoiceToOtherPos = this.settings_data.settings.sendInvoiceToOtherPos ? "checked" : "";
      const keyboardStyle = this.settings_data.settings.keyboard_style;
      console.log("check it here : ", this.settings_data.settings.onlineDebt);
      this.leftContainer.addClass("columnBox");
      this.leftContainer.append('<h4 class="CartTitle" style="margin-bottom:35px; font-size:35px;" >General Settings</h4>');
      this.leftContainer.append('<div id="settingsCartContentsContainer">  </div>');
      this.contentsContainer = this.leftContainer.find("#settingsCartContentsContainer");
      this.contentsContainer.append('<div id="generalSettingsContent" class="contentContainer rowBox" style="width:100%;"> <div class="c1 columnBox"></div>   <div class="c2 columnBox"></div> </div>');
      this.general_settings_content = this.contentsContainer.find("#generalSettingsContent");
      this.general_settings_c1 = this.general_settings_content.find("div.c1");
      this.general_settings_c2 = this.general_settings_content.find("div.c2");
      this.general_settings_c1.append('<label for="priceBasedOn" style="font-weight:600;"> Item Price Based On : </label>');
      this.general_settings_c1.append('<select  name="priceBasedOn" id="priceBasedOnSelect" ></select>');
      this.item_price_based_on_select = this.general_settings_c1.find("#priceBasedOnSelect");
      this.settings_data.getAllPriceBases().forEach((base) => {
        if (this.settings_data.settings.itemPriceBasedOn == base) {
          this.item_price_based_on_select.append(`<option value="${base}" selected> ${base} </option>`);
        } else {
          this.item_price_based_on_select.append(`<option value="${base}"> ${base} </option>`);
        }
      });
      this.general_settings_c2.append('<label for="keyboardStyle" style="font-weight:600;"> Keyboard Style : </label>');
      this.general_settings_c2.append('<select  name="keyboardStyle" id="keyboardStyle" ></select>');
      this.keyboard_style_select = this.general_settings_c2.find("#keyboardStyle");
      this.settings_data.getAllKeyboardStyles().forEach((style) => {
        if (this.settings_data.settings.keyboardStyle == style) {
          this.keyboard_style_select.append(`<option value="${style}" selected> ${style} </option>`);
        } else {
          this.keyboard_style_select.append(`<option value="${style}"> ${style} </option>`);
        }
      });
      this.general_settings_c2.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Get Client Debt OnLine : </div>');
      this.general_settings_c2.append(`<div class="rowBox align_center" style="height:50px;"><label for="onlineDebtCheckBox" style="margin-right:16px;width:50%;" > online debt: </label> <input type="checkbox"  name="onlineDebtCheckBox" id="onlineDebtCheckBoxCheckBox" ${onlineDebt} ></div>`);
      this.general_settings_c2.append('<div for="sendInvoiceToOtherPosCheckBox" style="font-weight:600;"> Send Invoice To Other POS : </div>');
      this.general_settings_c2.append(`<div class="rowBox align_center" style="height:50px;"><label for="sendInvoiceToOtherPosCheckBox" style="margin-right:16px;width:50%;" > send invoice: </label> <input type="checkbox"  name="sendInvoiceToOtherPosCheckBox" id="sendInvoiceToOtherPosCheckBox" ${sendInvoiceToOtherPos} ></div>`);
      this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Item Details Cart : </div>');
      this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;"><label for="showItemDetailsCartCheckBox" style="margin-right:16px;width:50%;" > show cart: </label> <input type="checkbox"  name="showItemDetailsCartCheckBox" id="showItemDetailsCartCheckBox" ${showItemDetailsCart} ></div>`);
      this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Item Image : </div>');
      this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;" ><label for="showItemImageCheckBox" style="margin-right:16px;width:50%;"> show item image: </label> <input type="checkbox"  name="showItemImageCheckBox" id="showItemImageCheckBox" ${showItemImage} ></div>`);
      this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> Discount feature : </div>');
      this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;" ><label for="showDiscountFieldCheckBox" style="margin-right:16px;width:50%;"> show discount field: </label> <input type="checkbox"  name="showDiscountFieldCheckBox" id="showDiscountFieldCheckBox" ${showDiscountField} ></div>`);
      this.general_settings_c1.append('<div for="showItemDetailsCartCheckBox" style="font-weight:600;"> filter item by group : </div>');
      this.general_settings_c1.append(`<div class="rowBox align_center" style="height:50px;" ><label for="showItemGroupFilterCheckBox" style="margin-right:16px;width:50%;"> show item group filter: </label> <input type="checkbox"  name="showItemGroupFilterCheckBox" id="showItemGroupFilterCheckBox" ${searchByGroup} ></div>`);
      this.item_price_based_on_select.on("input", (event2) => {
        this.settings_data.setPriceItemBasedOn(
          event2.target.value,
          () => {
            this.on_settings_change("itemPriceBasedOn");
          },
          () => {
            console.error("error to save the settings changes (settings.js)");
          }
        );
      });
      this.keyboard_style_select.on("input", (event2) => {
        this.settings_data.settings.keyboardStyle = event2.target.value;
        this.settings_data.setSettings(
          this.settings_data.settings,
          () => {
            this.on_settings_change("showItemImage");
          },
          () => {
            console.error("error to save the settings changes (settings.js)");
          }
        );
      });
      this.general_settings_c1.find("#showItemDetailsCartCheckBox").on("click", (event2) => {
        this.settings_data.settings.showItemDetails = $(event2.target).is(":checked");
        this.settings_data.setSettings(
          this.settings_data.settings,
          () => {
            this.on_settings_change("showItemDetails");
          },
          () => {
            console.error("error to save the settings changes (settings.js)");
          }
        );
      });
      this.general_settings_c1.find("#showItemImageCheckBox").on("click", (event2) => {
        this.settings_data.settings.showItemImage = $(event2.target).is(":checked");
        this.settings_data.setSettings(
          this.settings_data.settings,
          () => {
            this.on_settings_change("showItemImage");
          },
          () => {
            console.error("error to save the settings changes (settings.js)");
          }
        );
      });
      this.general_settings_c1.find("#showDiscountFieldCheckBox").on("click", (event2) => {
        this.settings_data.settings.showDiscountField = $(event2.target).is(":checked");
        this.settings_data.setSettings(
          this.settings_data.settings,
          () => {
            this.on_settings_change("showDiscountField");
          },
          () => {
            console.error("error to save the settings changes (settings.js)");
          }
        );
      });
      this.general_settings_c1.find("#showItemGroupFilterCheckBox").on("click", (event2) => {
        this.settings_data.settings.search_by_group = $(event2.target).is(":checked");
        this.settings_data.setSettings(
          this.settings_data.settings,
          () => {
            this.on_settings_change("search_by_group");
          },
          () => {
            console.error("error to save the settings changes (settings.js)");
          }
        );
      });
      this.general_settings_c2.find("#onlineDebtCheckBoxCheckBox").on("click", (event2) => {
        this.settings_data.settings.onlineDebt = $(event2.target).is(":checked");
        this.settings_data.setSettings(
          this.settings_data.settings,
          () => {
            this.on_settings_change("");
          },
          () => {
            console.error("error to save the settings changes (pos_settings.js)");
          }
        );
      });
      this.general_settings_c2.find("#sendInvoiceToOtherPosCheckBox").on("click", (event2) => {
        this.settings_data.settings.sendInvoiceToOtherPos = $(event2.target).is(":checked");
        this.settings_data.setSettings(
          this.settings_data.settings,
          () => {
            this.on_settings_change("sendInvoiceToOtherPos");
          },
          () => {
            console.error("error to save the settings changes (settings.js)");
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
      console.log("this.checkList : ", this.checkList);
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
        type_img.style.transform = checkInOut.check_type === "In" ? "rotate(180deg)" : "";
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
      this.checkReason.append(this.selectedCheckInOut.reason || this.selectedCheckInOut.reason_note);
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

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_debt_cart.js
  pos_ar.PointOfSale.pos_debt_cart = class {
    constructor(wrapper, appData, openingEntry, refreshCheckInOut) {
      this.wrapper = wrapper;
      this.app_data = appData;
      this.openingEntry = openingEntry;
      this.refresh_check_in_out = refreshCheckInOut;
      this._filtredClientList = this.app_data.appData.customers;
      this.selected_client = {};
      this.payment_amount = 0;
      this._pos_invoice = [];
      this._sales_invoice = [];
      this._selected_invoice = [];
      this.start_work();
    }
    start_work() {
      this.prepare_cart();
      this.refreshClientPart();
      this.setListener();
    }
    prepare_cart() {
      this.wrapper.find("#LeftSection").append('<div id="debtLeftContainer" class="columnBox"></div>');
      this.wrapper.find("#RightSection").append('<div id="debtRightContainer" class="columnBox"></div>');
      this.leftContainer = this.wrapper.find("#debtLeftContainer");
      this.rightContainer = this.wrapper.find("#debtRightContainer");
      this.rightContainer.append(`
			<div class="debt-header">
				<input type="text" 
					id="debt_filterClientList" 
					placeholder="Search customers..."
				>
			</div>
			<div id="debt_customerList"></div>
		`);
      this.customerList = this.rightContainer.find("#debt_customerList");
      this.leftContainer.append(`
			<div class="payment-header">
				<div class="amount-input">
					<input id="debt_paymentAmount" type="number" placeholder="Enter amount">
				</div>
				<div id="total_client_debt">Total: 0 DA</div>
				<div id="partially_client_debt">Selected: 0 DA</div>
				<button id="pay_selected_invoices_btn">Pay</button>
			</div>
			<div id="debt_debtsList"></div>
		`);
      this.leftContainer.append(`
			<script src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs" type="module"><\/script>
			<div id="debt_waitingContainer" style="display:none;">
				<dotlottie-player 
					src="https://lottie.host/d6c76206-aab9-4d5a-af73-c4a6cfc5aaa9/H8vnpKcKj9.lottie" 
					background="transparent" 
					speed="1" 
					style="width: 300px; height: 300px" 
					loop 
					autoplay
				></dotlottie-player>
			</div>
		`);
      this.waiting_cart = this.leftContainer.find("#debt_waitingContainer");
      this.total_client_debt = this.leftContainer.find("#total_client_debt");
      this.partially_client_debt = this.leftContainer.find("#partially_client_debt");
      this.pay_selected_invoices_btn = this.leftContainer.find("#pay_selected_invoices_btn");
      this.debtList = this.leftContainer.find("#debt_debtsList");
    }
    add_customer_to_list(customer) {
      const customerElement = document.createElement("div");
      customerElement.className = "customer-item";
      customerElement.innerHTML = `
			<div class="customer-name">${customer.customer_name}</div>
			<div class="customer-info">
				<span>${customer.customer_primary_contact || ""}</span>
				<span>${customer.mobile_no || ""}</span>
			</div>
		`;
      customerElement.addEventListener("click", () => {
        this.customerList.find(".customer-item").removeClass("selected");
        customerElement.classList.add("selected");
        this.selected_client = structuredClone(customer);
        this.refreshClientDebtPart(customer);
      });
      this.customerList.append(customerElement);
    }
    showCart() {
      this.leftContainer.css("display", "flex");
      this.rightContainer.css("display", "flex");
    }
    hideCart() {
      this.leftContainer.css("display", "none");
      this.rightContainer.css("display", "none");
    }
    show_waiting() {
      this.waiting_cart.css("display", "flex");
    }
    hide_waiting() {
      this.waiting_cart.css("display", "none");
    }
    setListener() {
      this.rightContainer.find("#debt_filterClientList").on("input", (event2) => {
        const value = this.rightContainer.find("#debt_filterClientList").val().trim().toLowerCase();
        this._filtredClientList = this.app_data.appData.customers.filter(
          (customer) => customer.customer_name.toLowerCase().includes(value)
        );
        this.refreshClientPart();
      });
      this.leftContainer.find("#debt_paymentAmount").on("input", (event2) => {
        this.payment_amount = parseFloat(this.leftContainer.find("#debt_paymentAmount").val());
      });
      this.pay_selected_invoices_btn.on("click", async () => {
        console.log("check the list ==> ", this._selected_invoice);
        this.paySelectedInvoice();
      });
      this.debtList.on("click", '.invoiceBox input[type="checkbox"]', (event2) => {
        const checkbox = $(event2.target);
        const invoiceName = checkbox.data("invoice-name");
        const invoiceOutstandingAmount = checkbox.data("outstanding-amount");
        const invoiceType = checkbox.data("invoice-type");
        const invoice_data = { "name": invoiceName, "outstanding_amount": invoiceOutstandingAmount, "type": invoiceType };
        if (checkbox.is(":checked")) {
          if (!this._selected_invoice.some((invoice) => invoice.name == invoiceName)) {
            this._selected_invoice.push(invoice_data);
          }
        } else {
          const index = this._selected_invoice.findIndex((invoice) => invoice.name == invoiceName);
          if (index > -1) {
            this._selected_invoice.splice(index, 1);
          }
        }
        this.refresh_partially_paid();
      });
    }
    refreshClientPart() {
      this.customerList.html("");
      this._filtredClientList.forEach((customer) => {
        this.add_customer_to_list(customer);
      });
    }
    refreshTotal(total_debt) {
      this.total_client_debt.text(`Total Debt : ${total_debt} DA`);
    }
    refresh_partially_paid() {
      let partially_paid = 0;
      this._selected_invoice.forEach((invoice) => {
        partially_paid += invoice.outstanding_amount;
      });
      this.partially_client_debt.text(`Selected Debt : ${partially_paid} DA`);
    }
    async refreshClientDebtPart(customer) {
      this.refreshTotal("Loading ...");
      this._selected_invoice = [];
      this.refresh_partially_paid();
      const invoiceStyle = "width:calc(100% - 40px);height:60px;min-height:60px;border-bottom:2px solid #505050;";
      const payBtnStyle = "width:80px;height:35px;color:white;background:green;border-radius:12px;margin:0px 20px;cursor:pointer;";
      let total_debt = 0;
      this.debtList.html("");
      console.log("the company : ", this.app_data.appData.pos_profile.company);
      console.log("the profile : ", this.app_data.appData.pos_profile);
      const result = await this.app_data.fetchDebts(customer.name, this.app_data.appData.pos_profile.company);
      const result2 = await this.app_data.fetchDebtsSalesInvoices(customer.name, this.app_data.appData.pos_profile.company);
      result.forEach((invoice) => {
        total_debt += invoice.outstanding_amount;
        const customerBox = $(
          `<div  style="${invoiceStyle}" class="rowBox C_A_Center invoiceBox" data-invoice-name="${invoice.name}"></div>`
        );
        const checkbox = $(`<input type="checkbox" class="select_checkbox" style="margin:0px 16px;" data-invoice-type="POS Invoice" data-invoice-name="${invoice.name}" data-outstanding-amount="${invoice.outstanding_amount}" ></input>`);
        customerBox.append(`<div style="flex-grow:1;">${invoice.name}</div>`);
        customerBox.append(`<div style="flex-grow:1;">${invoice.outstanding_amount} DA</div>`);
        customerBox.append(`<div style="flex-grow:1;">${invoice.posting_date}</div>`);
        customerBox.append(`<div style="flex-grow:1;">POS Invoice</div>`);
        customerBox.append(`<div class="rowBox centerItem payBtn" style="${payBtnStyle}">Pay</div>`);
        customerBox.find(".payBtn").on("click", async () => {
          await this.payPosInvoice(invoice);
        });
        this.debtList.append(customerBox);
      });
      const me = this;
      result2.forEach((invoice) => {
        total_debt += invoice.outstanding_amount;
        const customerBox = $(`
				<div style="${invoiceStyle}; overflow:hidden; flex-direction: column; transition:0.3s;" 
					 class="rowBox C_A_Center invoiceBox" data-invoice-name="${invoice.name}">
				</div>
			`);
        const invoiceRow = $(`
				<div class="rowBox C_A_Center" style="width: 100%;">
				</div>
			`);
        invoiceRow.append(`<input type="checkbox" style="margin:0px 16px;" data-invoice-type="Sales Invoice" data-invoice-name="${invoice.name}" data-outstanding-amount="${invoice.outstanding_amount}">`);
        invoiceRow.append(`<div style="flex-grow:1;">${invoice.name}</div>`);
        invoiceRow.append(`<div style="flex-grow:1;">${invoice.outstanding_amount} DA</div>`);
        invoiceRow.append(`<div style="flex-grow:1;">${invoice.posting_date}</div>`);
        invoiceRow.append(`<div style="flex-grow:1;">Sales Invoice</div>`);
        invoiceRow.append(`
				<div style="flex-grow:1; display:flex; justify-content:center; align-items:center;">
					<svg class="expandIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24" style="cursor:pointer; transition:0.3s;">
						<path d="M7 10l5 5 5-5H7z"/>		
					</svg>
				</div>
			`);
        invoiceRow.append(`<div class="rowBox centerItem payBtn" style="${payBtnStyle}">Pay</div>`);
        const expandableContent = $(`
				<div class="expandableContent" style="width:100%; text-align:center; padding:10px; display:none; color:#555;">
					Loading facteur PDV...
				</div>
			`);
        customerBox.append(invoiceRow);
        customerBox.append(expandableContent);
        customerBox.find(".expandIcon").hover(
          function() {
            $(this).css("fill", "green");
          },
          function() {
            $(this).css("fill", "black");
          }
        );
        customerBox.find(".expandIcon").on("click", async function() {
          const isExpanded = customerBox.hasClass("expanded");
          if (!isExpanded) {
            expandableContent.slideDown(200);
            customerBox.addClass("expanded");
            $(this).css("transform", "rotate(180deg)");
            try {
              const posInvoices = await me.fetchPosInvoices(invoice.name);
              console.log("we are heeeeeer :: ", posInvoices);
              if (posInvoices.length > 0) {
                let html = `
								<div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">`;
                posInvoices.forEach((pos) => {
                  html += `
									<div style="display:flex; justify-content:space-between; align-items:center; 
												padding:8px 12px; border:1px solid #ccc; border-radius:8px; background:#f9f9f9;">
										<div style="flex:2; font-weight:bold;">${pos.name}</div>
										<div style="flex:1; color:#333;">${pos.outstanding_amount} DA</div>
									</div>`;
                });
                html += `</div>`;
                expandableContent.html(html);
              } else {
                expandableContent.html(`<div style="margin-top:10px;">No POS Factures found for this invoice.</div>`);
              }
            } catch (error) {
              console.error("Error fetching POS invoices:", error);
              expandableContent.html(`<div style="margin-top:10px; color:red;">Error loading POS invoices.</div>`);
            }
          } else {
            expandableContent.slideUp(200);
            customerBox.removeClass("expanded");
            $(this).css("transform", "rotate(0deg)");
          }
        });
        customerBox.find(".payBtn").on("click", async () => {
          await this.paySalesInvoice(invoice);
        });
        this.debtList.append(customerBox);
      });
      this.refreshTotal(total_debt);
    }
    async payPosInvoice(invoice) {
      const paymentAmount = parseFloat(this.payment_amount) || 0;
      if (paymentAmount <= 0) {
        frappe.msgprint(__("The paid amount should be grant than 0"));
        return;
      }
      try {
        this.show_waiting();
        const result = await this.app_data.update_invoice_payment(invoice.name, paymentAmount, this.openingEntry);
        this.payment_amount = result.remaining;
        this.leftContainer.find("#debt_paymentAmount").val(result.remaining);
        await this.refreshClientDebtPart(this.selected_client);
      } catch (error) {
        console.error("Error processing payment:", error);
        alert("An error occurred while processing the payment. Please try again.");
      } finally {
        this.hide_waiting();
      }
    }
    async paySalesInvoice(invoice) {
      try {
        this.show_waiting();
        const paymentAmount = parseFloat(this.payment_amount) || 0;
        if (paymentAmount <= 0) {
          frappe.msgprint(__("The paid amount should be grant than 0"));
          return;
        }
        const result = await this.app_data.update_sales_invoice_payment(invoice.name, paymentAmount);
        const check_in_amount = paymentAmount - result.remaining;
        const checkInOut = frappe.model.get_new_doc("check_in_out");
        checkInOut.creation_time = frappe.datetime.now_datetime();
        checkInOut.user = frappe.session.user;
        checkInOut.check_type = "In";
        checkInOut.is_sync = 0;
        checkInOut.amount = parseFloat(check_in_amount);
        checkInOut.reason_note = "Debt payment.";
        this.app_data.saveCheckInOut(
          checkInOut,
          (res) => {
            this.refresh_check_in_out();
          },
          (err) => {
            console.log("err to save checkInOut : ", err);
          }
        );
        if (result && typeof result.remaining === "number") {
          this.payment_amount = result.remaining;
          this.leftContainer.find("#debt_paymentAmount").val(result.remaining);
          await this.refreshClientDebtPart(this.selected_client);
        } else {
          throw new Error("Unexpected server response. Please try again.");
        }
      } catch (error) {
        console.error("Error processing sales invoice payment:", error);
        alert("An error occurred while processing the payment. Please try again later.");
      } finally {
        this.hide_waiting();
      }
    }
    async paySelectedInvoice() {
      try {
        this.show_waiting();
        const paymentAmount = parseFloat(this.payment_amount) || 0;
        const result = await this.app_data.paySelectedInvoice(this._selected_invoice, paymentAmount);
        const check_in_amount = paymentAmount - result.remaining;
        const checkInOut = frappe.model.get_new_doc("check_in_out");
        checkInOut.creation_time = frappe.datetime.now_datetime();
        checkInOut.user = frappe.session.user;
        checkInOut.check_type = "In";
        checkInOut.is_sync = 0;
        checkInOut.amount = parseFloat(check_in_amount);
        checkInOut.reason_note = "Debt payment.";
        this.app_data.saveCheckInOut(
          checkInOut,
          (res) => {
            this.refresh_check_in_out();
          },
          (err) => {
            console.log("err to save checkInOut : ", err);
          }
        );
        if (result && typeof result.remaining === "number") {
          this.payment_amount = result.remaining;
          this.leftContainer.find("#debt_paymentAmount").val(result.remaining);
          await this.refreshClientDebtPart(this.selected_client);
        } else {
          throw new Error("Unexpected server response. Please try again.");
        }
      } catch (error) {
        console.error("Error processing sales invoice payment:", error);
        alert("An error occurred while processing the payment. Please try again later.");
      } finally {
        this.hide_waiting();
      }
    }
    async fetchPosInvoices(_sales_invoice) {
      console.log("Fetching POS invoices for sales invoice:", _sales_invoice);
      const response = await frappe.db.get_list("POS Invoice", {
        fields: ["name", "outstanding_amount", "currency"],
        filters: {
          consolidated_invoice: _sales_invoice
        },
        limit: 1e5
      });
      console.log("Fetched POS invoices:", response);
      return response || [];
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/pos_unsynced_cart.js
  pos_ar.PointOfSale.pos_unsynced_cart = class {
    constructor(wrapper, appData, db, viewDetailsCallback, onDeleteCallback) {
      this.wrapper = wrapper;
      this.app_data = appData;
      this.db = db;
      this.view_details_callback = viewDetailsCallback;
      this.on_delete_callback = onDeleteCallback;
      this.invoices = [];
      this.filter = "All";
      this.selectedInvoice = null;
      this.search_value = "";
      this.start_work();
    }
    async start_work() {
      this.prepare_unsynced_pos_cart();
      await this.getAllUnsyncedInvoices();
      this.setListeners();
    }
    prepare_unsynced_pos_cart() {
      this.wrapper.find("#LeftSection").append('<div id="unsyncedPosLeftContainer" class="columnBox" style="display:none;"></div>');
      this.wrapper.find("#RightSection").append('<div id="unsyncedPosRightContainer" class="columnBox" style="display:none;"></div>');
      this.left_container = this.wrapper.find("#unsyncedPosLeftContainer");
      this.right_container = this.wrapper.find("#unsyncedPosRightContainer");
      this.right_container.append(`<div id="unsyncedRightContainerHeader" class="rowBox align_center"><h4 class="CartTitle">Unsynced Invoices</h4></div>`);
      this.right_container.append('<div id="unsyncedRightSearchContainer" class="rowBox align_center"></div>');
      this.search_container = this.right_container.find("#unsyncedRightSearchContainer");
      this.search_container.append('<select id="unsyncedFilterInput" placeholder="Filter Status">');
      this.filter_input = this.search_container.find("#unsyncedFilterInput");
      this.filter_input.append('<option value="All" selected>All</option><option value="Not Synced">Not Synced</option><option value="Failed">Failed</option>');
      this.search_container.append('<input type="text" id="unsyncedSearchInput" placeholder="Search by invoice number">');
      this.search_field = this.search_container.find("#unsyncedSearchInput");
      this.right_container.append('<div id="unsyncedInvoiceList" class="columnBox"></div>');
      this.unsynced_invoice_list = this.right_container.find("#unsyncedInvoiceList");
      const header = '<div id="detailsUnsyncedHeader" class="rowBox"><div class="c1 columnBox"><div id="unsyncedCustomer">Customer</div><div id="unsyncedSoldBy"></div><div id="unsyncedStatus" class="status"></div></div><div class="c2 columnBox"><div id="unsyncedCost">0,0000 DA</div><div id="unsyncedId">ACC-PSINV-2024-ID</div><div id="unsyncedRealId">POS realI</div></div></div>';
      this.left_container.append(header);
      this.details_unsynced_header = this.left_container.find("#detailsUnsyncedHeader");
      this.left_container.append('<div id="unsyncedContent" class="columnBox"></div>');
      this.unsyncedContent = this.left_container.find("#unsyncedContent");
      this.unsyncedContent.append('<div id="unsyncedItemContainer"><div class="posSectionTitle">Items</div><div id="unsyncedItemList"></div></div>');
      this.itemContainer = this.unsyncedContent.find("#unsyncedItemContainer");
      this.itemList = this.itemContainer.find("#unsyncedItemList");
      this.unsyncedContent.append('<div id="unsyncedTotalsContainer"><div class="posSectionTitle">Totals</div><div id="unsyncedTotalList"></div></div>');
      this.totalsContainer = this.unsyncedContent.find("#unsyncedTotalsContainer");
      this.totalList = this.unsyncedContent.find("#unsyncedTotalList");
      this.unsyncedContent.append('<div id="unsyncedPaymentsContainer"><div class="posSectionTitle">Payments</div><div id="unsyncedMethodList"></div></div>');
      this.paymentsContainer = this.unsyncedContent.find("#unsyncedPaymentsContainer");
      this.methodList = this.unsyncedContent.find("#unsyncedMethodList");
      this.left_container.append('<div id="unsyncedActionsContainer" class="rowBox align_content"><div id="unsyncedRetryBtn" class="actionBtn rowBox centerItem">Retry Sync</div><div id="unsyncedViewBtn" class="actionBtn rowBox centerItem">View Details</div></div>');
      this.actionButtonsContainer = this.left_container.find("#unsyncedActionsContainer");
      this.retryButton = this.actionButtonsContainer.find("#unsyncedRetryBtn");
      this.viewButton = this.actionButtonsContainer.find("#unsyncedViewBtn");
    }
    refreshData() {
      this.unsynced_invoice_list.empty();
      console.log("refreshing unsynced invoice list", this.invoices, "unsynced ", this.invoices.filter((invoice) => !invoice.synced));
      const filteredList = this.invoices.filter((invoice) => !invoice.synced);
      if (!filteredList.length) {
        this.unsynced_invoice_list.append('<div class="empty-state">No unsynced invoices found</div>');
        return;
      }
      filteredList.forEach((invoice) => {
        const invoiceContainer = document.createElement("div");
        invoiceContainer.classList.add("posInvoiceContainer");
        invoiceContainer.classList.add("columnBox");
        invoiceContainer.classList.add("align_content");
        const l1 = document.createElement("div");
        l1.classList.add("l1");
        l1.classList.add("rowBox");
        l1.classList.add("align_content");
        const posName = document.createElement("div");
        posName.classList.add("posName");
        posName.textContent = invoice.name;
        const posCost = document.createElement("div");
        posCost.classList.add("posCost");
        posCost.textContent = format_currency(invoice.grand_total, invoice.currency);
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
        customerName.textContent = invoice.customer || "Guest";
        customerName.classList.add("customerName");
        customer.appendChild(customerLogo);
        customer.appendChild(customerName);
        l2.appendChild(customer);
        const status = document.createElement("div");
        status.classList.add("status");
        status.classList.add(invoice.status.toLowerCase().replace(" ", "-"));
        status.textContent = invoice.status;
        l2.appendChild(status);
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("invoice-delete-btn");
        deleteBtn.innerHTML = `<i class="fa fa-trash fa-lg"></i>`;
        l2.appendChild(deleteBtn);
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.app_data.deletePosInvoice_callback(
            invoice.name,
            () => {
              this.getAllUnsyncedInvoices();
              this.on_delete_callback();
            },
            (err) => {
              console.error("Error deleting invoice:", err);
              frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Failed to delete invoice")
              });
            }
          );
        });
        invoiceContainer.appendChild(l1);
        invoiceContainer.appendChild(l2);
        invoiceContainer.addEventListener("click", () => {
          this.selectedInvoice = invoice;
          this.refreshInvoiceDetails();
          console.log("selected invoice : ", this.selectedInvoice);
          this.unsynced_invoice_list.find(".posInvoiceContainer").removeClass("selected");
          $(invoiceContainer).addClass("selected");
        });
        this.unsynced_invoice_list.append(invoiceContainer);
      });
      if (this.selectedInvoice) {
        this.refreshInvoiceDetails();
      }
    }
    refreshInvoiceDetails() {
      if (!this.selectedInvoice || !this.invoices.find((inv) => inv.name === this.selectedInvoice.name)) {
        this.selectedInvoice = null;
        this.unsyncedContent.addClass("d-none");
        const header2 = this.details_unsynced_header;
        header2.find("#unsyncedCustomer").text("");
        header2.find("#unsyncedSoldBy").text("");
        header2.find("#unsyncedStatus").text("").removeClass();
        header2.find("#unsyncedCost").text("");
        header2.find("#unsyncedId").text("");
        header2.find("#unsyncedRealId").text("");
        this.itemList.empty();
        this.totalList.empty();
        this.methodList.empty();
        return;
      }
      this.unsyncedContent.removeClass("d-none");
      const header = this.details_unsynced_header;
      header.find("#unsyncedCustomer").text(this.selectedInvoice.customer || "Guest");
      header.find("#unsyncedSoldBy").text(this.selectedInvoice.owner);
      header.find("#unsyncedStatus").text(this.selectedInvoice.status).removeClass("not-synced failed").addClass(this.selectedInvoice.status.toLowerCase().replace(" ", "-"));
      header.find("#unsyncedCost").text(format_currency(this.selectedInvoice.grand_total, this.selectedInvoice.currency));
      header.find("#unsyncedId").text(this.selectedInvoice.name);
      header.find("#unsyncedRealId").text(this.selectedInvoice.pos_profile);
      this.itemList.empty();
      this.selectedInvoice.items.forEach((item) => {
        const itemRow = document.createElement("div");
        itemRow.classList.add("itemRow", "rowBox");
        const itemName = document.createElement("div");
        itemName.classList.add("itemName");
        itemName.textContent = item.item_name;
        const itemQty = document.createElement("div");
        itemQty.classList.add("itemQty");
        itemQty.textContent = item.qty;
        const itemRate = document.createElement("div");
        itemRate.classList.add("itemRate");
        itemRate.textContent = format_currency(item.rate, this.selectedInvoice.currency);
        const itemAmount = document.createElement("div");
        itemAmount.classList.add("itemAmount");
        itemAmount.textContent = format_currency(item.amount, this.selectedInvoice.currency);
        itemRow.appendChild(itemName);
        itemRow.appendChild(itemQty);
        itemRow.appendChild(itemRate);
        itemRow.appendChild(itemAmount);
        this.itemList.append(itemRow);
      });
      this.totalList.empty();
      const totalRow = document.createElement("div");
      totalRow.classList.add("totalRow", "rowBox");
      const totalLabel = document.createElement("div");
      totalLabel.classList.add("totalLabel");
      totalLabel.textContent = "Grand Total";
      const totalAmount = document.createElement("div");
      totalAmount.classList.add("totalAmount");
      totalAmount.textContent = format_currency(this.selectedInvoice.grand_total, this.selectedInvoice.currency);
      totalRow.appendChild(totalLabel);
      totalRow.appendChild(totalAmount);
      this.totalList.append(totalRow);
      this.methodList.empty();
      this.selectedInvoice.payments.forEach((payment) => {
        const paymentRow = document.createElement("div");
        paymentRow.classList.add("paymentRow", "rowBox");
        const paymentMode = document.createElement("div");
        paymentMode.classList.add("paymentMode");
        paymentMode.textContent = payment.mode_of_payment;
        const paymentAmount = document.createElement("div");
        paymentAmount.classList.add("paymentAmount");
        paymentAmount.textContent = format_currency(payment.amount, this.selectedInvoice.currency);
        paymentRow.appendChild(paymentMode);
        paymentRow.appendChild(paymentAmount);
        this.methodList.append(paymentRow);
      });
    }
    show_cart() {
      this.left_container.css("display", "flex");
      this.right_container.css("display", "flex");
      this.getAllUnsyncedInvoices();
    }
    hide_cart() {
      this.left_container.css("display", "none");
      this.right_container.css("display", "none");
    }
    async getAllUnsyncedInvoices() {
      this.invoices = await this.db.getAllPosInvoice();
      this.refreshData();
      this.refreshInvoiceDetails();
    }
    async retrySync(invoice) {
      frappe.db.insert(
        invoice
      ).then((r) => {
        const updatedPos = structuredClone(invoice);
        updatedPos.synced = true;
        updatedPos.real_name = r.name;
        this.appData.updatePosInvoice(updatedPos);
      }).catch((err) => {
        console.error("Error retrying sync:", err);
        frappe.msgprint({
          title: __("Error"),
          indicator: "red",
          message: __("Failed to sync invoice")
        });
      });
    }
    async deleteInvoice(invoice_name) {
      if (!confirm("Are you sure you want to delete this unsynced invoice?")) {
        return;
      }
      try {
        this.refreshData();
        frappe.show_alert({
          message: __("Invoice deleted successfully"),
          indicator: "green"
        });
      } catch (error) {
        frappe.show_alert({
          message: __("Failed to delete invoice"),
          indicator: "red"
        });
      }
    }
    setListeners() {
      this.filter_input.on("change", () => {
        this.filter = this.filter_input.val();
        this.refreshData();
      });
      this.search_field.on("input", () => {
        this.search_value = this.search_field.val();
        this.refreshData();
      });
      this.retryButton.on("click", () => {
        if (this.selectedInvoice) {
          this.retrySync(this.selectedInvoice);
        }
      });
      this.viewButton.on("click", () => {
        if (this.selectedInvoice) {
          this.view_details_callback(this.selectedInvoice);
        }
      });
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/data/posSettingsData.js
  pos_ar.PointOfSale.posSettingsData = class {
    constructor(db) {
      this.db = db;
      this.price_bases = ["brand", "priceList"];
      this.keyboard_styles = ["primery", "secondary"];
      const defaults = {
        itemPriceBasedOn: "brand",
        keyboardStyle: "secondary",
        showItemDetails: false,
        showItemImage: false,
        showDiscountField: false,
        onlineDebt: true,
        testing: false,
        search_by_group: false,
        sendInvoiceToOtherPos: false
      };
      this.db.getSettings(
        (res) => {
          if (res && res.itemPriceBasedOn) {
            this.settings = __spreadValues(__spreadValues({}, defaults), res || {});
          } else {
            this.settings = {
              itemPriceBasedOn: "brand",
              keyboardStyle: "secondary",
              showItemDetails: false,
              showItemImage: false,
              showDiscountField: false,
              onlineDebt: true,
              search_by_group: false,
              sendInvoiceToOtherPos: false
            };
          }
        },
        (err) => {
          console.log("error when trying to get the setting from local, so we use the default.");
          this.settings = {
            itemPriceBasedOn: "brand",
            keyboardStyle: "secondary",
            showItemDetails: false,
            showItemImage: false,
            showDiscountField: false,
            onlineDebt: true,
            search_by_group: false,
            sendInvoiceToOtherPos: false
          };
        }
      );
    }
    getAllPriceBases() {
      return this.price_bases;
    }
    getAllKeyboardStyles() {
      return this.keyboard_styles;
    }
    getPriceBase() {
      return this.settings.itemPriceBasedOn;
    }
    setPriceItemBasedOn(base, onSuccess, onFailure) {
      if (this.price_bases.includes(base)) {
        this.settings.itemPriceBasedOn = base;
        this.db.updateSettings_callback(
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
    getShowItemDetails() {
      return this.settings.showItemDetails;
    }
    setShowItemDetails(show, onSuccess, onFailure) {
      this.settings.showItemDetails = show;
      this.db.updateSettings_callback(
        this.settings,
        () => {
          onSuccess();
          console.log("settings update is save successfuly");
        },
        () => {
          console.error("error occured when trying to save settings");
        }
      );
    }
    setSettings(settings, onSuccess, onFailure) {
      this.settings = settings;
      this.db.updateSettings_callback(
        this.settings,
        () => {
          onSuccess();
          console.log("settings update is save successfuly");
        },
        () => {
          console.error("error occured when trying to save settings");
        }
      );
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/data/posAppData.js
  pos_ar.PointOfSale.posAppData = class {
    constructor(db, apiHandler) {
      this.db = db;
      this.api_handler = apiHandler;
      this.since = localStorage.getItem("lastTime");
      this.since_bin = localStorage.getItem("lastTime-Bin");
      this.since_price = localStorage.getItem("lastTime-Price");
      this.appData = {};
    }
    async getAllData() {
      try {
        frappe.show_progress("Please Wait", 0, 12, "loading deleted documents");
        await this.getDeletedDocs();
        frappe.show_progress("Please Wait", 1, 12, "loading customers...");
        await this.getCustomers();
        console.log("we are here *****************");
        frappe.show_progress("Please Wait", 2, 12, "loading items...");
        await this.getItems();
        frappe.show_progress("Please Wait", 3, 12, "loading pos profiles");
        await this.getPosProfiles();
        frappe.show_progress("Please Wait", 4, 12, "loading mode of payment");
        await this.getPosProfileModeOfPayments(this.appData.pos_profile);
        await this.getBins(this.since, this.appData.pos_profile.warehouse);
        frappe.show_progress("Please Wait", 5, 12, "loading warehouses");
        await this.getWarehouses();
        frappe.show_progress("Please Wait", 6, 12, "loading price lists");
        await this.getPriceLists();
        frappe.show_progress("Please Wait", 7, 12, "loading item prices");
        frappe.show_progress("Please Wait", 8, 12, "loading item groups");
        await this.getItemGroups();
        frappe.show_progress("Please Wait", 9, 12, "loading invoices");
        await this.getPosInvoices();
        frappe.show_progress("Please Wait", 10, 12, "loading check in out");
        await this.getCheckInOuts();
        frappe.show_progress("Please Wait", 11, 12, "loading barcodes");
        await this.getItemBarcodes();
        frappe.show_progress("Please Wait", 12, 12, "Completed");
        frappe.hide_progress();
        frappe.hide_progress();
        frappe.hide_progress();
        frappe.hide_progress();
        this.since = frappe.datetime.now_datetime();
        localStorage.setItem("lastTime", frappe.datetime.now_datetime());
        console.log("app data : ", this.appData);
      } catch (err) {
        console.error("appData Class Error  : ", err);
        frappe.hide_progress();
      }
      frappe.hide_progress();
    }
    async getCustomers() {
      const localCustomers = [];
      const updatedCustomers = await this.api_handler.fetchCustomers(this.since);
      await this.db.saveCustomerList(updatedCustomers);
      this.appData.customers = updatedCustomers;
    }
    async getBrands() {
      this.appData.brands = await this.api_handler.fetchBrands(this.since);
    }
    async getItems() {
      const localItems = [];
      let updatedItems = await this.api_handler.fetchItems(this.since);
      console.log("we are here .............. ", updatedItems.message);
      console.log("updatedItems.length : ", updatedItems.length);
      await this.db.saveItemList(updatedItems.message);
      this.appData.items = this.combineLocalAndUpdated(localItems, updatedItems.message);
    }
    async getPosProfiles() {
      const posProfile = frappe.defaults.get_default("POS Profile");
      this.appData.pos_profile = await frappe.db.get_doc("POS Profile", posProfile);
    }
    async getPosProfileModeOfPayments(posProfile) {
      let modeOfPaymentsIds = [];
      posProfile.payments.forEach((modeId) => {
        modeOfPaymentsIds.push(modeId.mode_of_payment);
      });
      this.appData.posProfileModeOfPayments = await this.api_handler.fetchPosProfileModeOfPayments(modeOfPaymentsIds, posProfile.company);
    }
    async getBins() {
      const localBins = await this.db.getAllBin();
      const updatedBins = await this.api_handler.fetchBinList(this.since_bin, this.appData.pos_profile.warehouse);
      await this.db.saveBinList(updatedBins);
      const latestBinModified = this.getLatestModifiedDate(updatedBins);
      if (latestBinModified) {
        this.since_bin = latestBinModified;
        localStorage.setItem("lastTime-Bin", latestBinModified);
      }
      this.appData.bins = this.combineLocalAndUpdated(localBins, updatedBins);
      this.appData.bins.forEach((b) => {
        if (b.item_code == "1.56 BB BLEU -0.00 -0.00") {
          console.log("check it here : ", b);
        }
      });
    }
    async getWarehouses() {
      const localWarehouses = [];
      const updatedWarehouses = await this.api_handler.fetchWarehouseList(this.since);
      await this.db.saveWarehouseList(updatedWarehouses);
      this.appData.warehouses = this.combineLocalAndUpdated(localWarehouses, updatedWarehouses);
    }
    async getPriceLists() {
      const localPriceLists = [];
      const updatedPriceList = await this.api_handler.fetchPriceList(this.since);
      this.appData.price_lists = updatedPriceList;
    }
    async getItemGroups() {
      const localItemGroups = [];
      const updatedItemGroups = await this.api_handler.fetchItemGroups(this.since);
      await this.db.saveItemGroupList(updatedItemGroups);
      this.appData.item_groups = this.combineLocalAndUpdated(localItemGroups, updatedItemGroups);
    }
    async getItemBarcodes() {
      this.appData.item_barcodes = await this.api_handler.fetchItemBarCodes();
    }
    async getPosInvoices() {
      this.appData.pos_invoices = await this.db.getAllPosInvoice();
    }
    async getCheckInOuts() {
      this.appData.check_in_outs = await this.db.getAllCheckInOut();
    }
    async getDeletedDocs() {
      this.appData.deleted_documents = await this.api_handler.fetchDeletedDocs(this.since);
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
    async fetchDebts(customerName, company) {
      return await this.api_handler.fetchDebts(customerName, company);
    }
    async fetchDebtsSalesInvoices(customerName) {
      return await this.api_handler.fetchDebtsSalesInvoices(customerName);
    }
    async fetchCustomerDebt(customerName) {
      return await this.api_handler.fetchCustomerDebt(customerName);
    }
    async update_invoice_payment(invoiceName, amount, openingEntry) {
      const rest = await this.api_handler.update_invoice_payment(invoiceName, amount, openingEntry);
      await this.getPosInvoices();
      this.appData.pos_invoices.forEach((invoice) => {
        if (invoice.real_name == invoiceName) {
          let newInvoice = structuredClone(invoice);
          newInvoice.outstanding_amount = rest.outstanding_amount;
          newInvoice.paid_amount = rest.paid_amount;
          newInvoice.status = rest.paid;
          newInvoice.real_name = rest.real_name;
          this.db.updatePosInvoice(newInvoice);
        }
      });
      return rest;
    }
    async update_sales_invoice_payment(invoiceName, amount) {
      const rest = await this.api_handler.update_sales_invoice_payment(invoiceName, amount);
      rest.invoices.forEach((invoice) => {
        this.appData.pos_invoices.forEach((posInvoice) => {
          if (posInvoice.real_name == invoice.name) {
            posInvoice.consolidated_invoice = invoiceName;
            posInvoice.start_paying = true;
            if (rest.status == "Paid") {
              posInvoice.outstanding_amount = 0;
              posInvoice.paid_amount = invoice.total;
              posInvoice.grand_paid_amount = invoice.total;
              posInvoice.status = "Paid";
            }
            this.db.updatePosInvoice(posInvoice);
          }
        });
      });
      await this.getPosInvoices();
      return rest;
    }
    async paySelectedInvoice(invoices, amount) {
      const rest = await this.api_handler.pay_selected_invoice(invoices, amount);
      rest.invoices_state_collection.forEach((invoices_status) => {
        invoices_status.invoices.forEach((invoice) => {
          this.appData.pos_invoices.forEach((posInvoice) => {
            if (posInvoice.real_name == invoice.name) {
              posInvoice.consolidated_invoice = invoices_status.sales_invoice_name;
              posInvoice.start_paying = true;
              if (invoices_status.status == "Paid") {
                posInvoice.outstanding_amount = 0;
                posInvoice.paid_amount = invoice.total;
                posInvoice.grand_paid_amount = invoice.total;
                posInvoice.status = "Paid";
              }
              this.db.updatePosInvoice(posInvoice);
            }
          });
        });
      });
      return rest;
    }
    async getAllOpenedPosInvoice() {
      return await this.db.getAllOpenedPosInvoice();
    }
    async getAndDeleteAllOpenedPosInvoice() {
      return await this.db.getAndDeleteAllOpenedPosInvoice();
    }
    async deletePosInvoice_callback(invoiceName, onSuccess, onFailure) {
      this.db.deletePosInvoice_callback(
        invoiceName,
        onSuccess,
        onFailure
      );
    }
    combineLocalAndUpdated(local, updated) {
      const combinedMap = new Map(local.map((item) => [item.name, item]));
      this.appData.deleted_documents.forEach((deleted) => {
        combinedMap.delete(deleted.name);
      });
      updated.forEach((updatedItem) => {
        combinedMap.set(updatedItem.name, updatedItem);
      });
      return Array.from(combinedMap.values());
    }
    getLatestModifiedDate(list) {
      if (!list || list.length === 0)
        return null;
      const sorted = list.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      return sorted[0].modified;
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/remoteApi/FetchHandler.js
  pos_ar.PointOfSale.FetchHandler = class FetchHandler {
    constructor() {
      console.log("testing4");
    }
    async fetchCustomers(since) {
      try {
        const filter = { disabled: 0 };
        return await frappe.db.get_list("Customer", {
          fields: ["name", "customer_name", "custom_debt", "default_price_list"],
          filters: filter,
          limit: 1e5,
          order_by: "customer_name ASC"
        });
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    }
    async fetchStockBalance(since) {
      try {
        return await frappe.db.get_list("Stock Ledger Entry", {
          fields: ["*"],
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching stock balance:", error);
        return [];
      }
    }
    async fetchBrands(since) {
      try {
        const filter = {};
        return await frappe.db.get_list("Brand", {
          fields: ["brand"],
          filters: filter,
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    }
    async fetchItemGroups(since) {
      try {
        const filter = {};
        return await frappe.db.get_list("Item Group", {
          fields: ["name", "item_group_name", "parent_item_group", "is_group"],
          filters: filter,
          limit: 1e5,
          order_by: "item_group_name ASC"
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchItems(since) {
      try {
        const priceLists = await this.fetchPriceList();
        return await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_item",
          args: { priceLists }
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchItemBarCodes() {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_item_barcodes",
          args: {}
        });
        return response.message;
      } catch (error) {
        console.error("Error fetching Item Barcodes:", error);
        return [];
      }
    }
    async fetchStockQty() {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_stock_availability",
          args: {}
        });
        return response.message;
      } catch (error) {
        console.error("Error fetching Item Barcodes:", error);
        return [];
      }
    }
    async fetchCustomerDebt(name) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_customer_debt",
          args: { name }
        });
        return response.message;
      } catch (error) {
        console.error("Error fetching Item Barcodes:", error);
        return [];
      }
    }
    async fetchPriceList(since) {
      try {
        const filter = { selling: 1, enabled: 1 };
        const company = frappe.defaults.get_default("Company");
        if (company) {
          filter.custom_company = ["in", [company, ""]];
        }
        return await frappe.db.get_list("Price List", {
          fields: ["name", "price_list_name", "currency"],
          filters: filter,
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchItemPrice(since, priceLists) {
      try {
        const filter = {};
        if (since) {
          filter.modified = [">", since];
          console.log("===> since inside if : ", since);
        }
        const priceListNames = priceLists.map((pl) => pl.name);
        if (priceListNames && priceListNames.length > 0) {
          filter.price_list = ["in", priceListNames];
        }
        return await frappe.db.get_list("Item Price", {
          fields: ["name", "item_code", "item_name", "price_list", "price_list_rate", "brand", "modified"],
          filters: filter,
          limit: 1e9
        });
      } catch (error) {
        console.error("Error fetching Item Group :", error);
        return [];
      }
    }
    async fetchWarehouseList(since) {
      try {
        const filter = {};
        return await frappe.db.get_list("Warehouse", {
          fields: ["name", "warehouse_name"],
          filters: filter,
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching Warehouse list : ", error);
        return [];
      }
    }
    async fetchPosProfile() {
      try {
        const filter = { disabled: 0 };
        const pos = await frappe.db.get_list("POS Profile", {
          fields: ["name"],
          filters: filter,
          limit: 1
        });
        const r = await frappe.db.get_doc("POS Profile", pos[0].name);
        return r;
      } catch (error) {
        console.error("Error fetching pos profile list : ", error);
        return null;
      }
    }
    async fetchPosProfileModeOfPayments(modeOfPaymentsIds, company) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_mode_of_payments",
          args: {}
        });
        return response.message;
      } catch (error) {
        console.error("Error fetching mode_of_payments", error);
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
    async fetchBinList(since, warehouse) {
      try {
        const filter = {};
        let response = null;
        since = null;
        if (since) {
          response = await frappe.call({
            method: "pos_ar.api.get_all_item_qty",
            args: { warehouse, since }
          });
        } else {
          response = await frappe.call({
            method: "pos_ar.api.get_all_item_qty",
            args: { warehouse }
          });
        }
        return response.message;
      } catch (error) {
        console.error("Error fetching Bin list : ", error);
        return [];
      }
    }
    async fetchDeletedDocs(since) {
      try {
        const filter = {};
        if (since) {
          filter.modified = [">", since];
        }
        return await frappe.db.get_list("Deleted Document", {
          fields: ["name", "deleted_name", "deleted_doctype", "restored"],
          filters: filter,
          limit: 1e5
        });
      } catch (error) {
        console.error("Error fetching deleted documents :", error);
        return [];
      }
      return [];
    }
    async fetchDebts(customer_name, company) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_customer_debts",
          args: { customer_name, company }
        });
        if (response.message && !response.message.error) {
          return response.message;
        } else {
          return [];
        }
      } catch (error) {
        console.error("Error fetching debts:", error);
        frappe.msgprint(__("Error fetching debts."));
      }
    }
    async fetchDebtsSalesInvoices(customer_name) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.get_customer_debts_sales_invoices",
          args: { customer_name }
        });
        if (response.message && !response.message.error) {
          console.log("customer debts : ", response.message);
          return response.message;
        } else {
          return [];
        }
      } catch (error) {
        console.error("Error fetching debts:", error);
        frappe.msgprint(__("Error fetching debts."));
      }
    }
    async update_invoice_payment(invoice_name, payment_amount, openingEntry) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.update_invoice_payment",
          args: { invoice_name, payment_amount, openingEntry }
        });
        if (response.message && !response.message.error) {
          return response.message;
        } else {
          return [];
        }
      } catch (error) {
        console.error("Error fetching debts:", error);
        frappe.msgprint(__("Error fetching debts."));
      }
    }
    async update_sales_invoice_payment(invoice_name, payment_amount) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.update_sales_invoice_payment",
          args: { invoice_name, payment_amount }
        });
        if (response.message && !response.message.error) {
          return response.message;
        } else {
          return [];
        }
      } catch (error) {
        console.error("Error fetching debts:", error);
        frappe.msgprint(__("Error fetching debts."));
      }
    }
    async pay_selected_invoice(invoices, payment_amount) {
      try {
        const response = await frappe.call({
          method: "pos_ar.pos_ar.doctype.pos_info.pos_info.pay_selected_invoice",
          args: { invoices, payment_amount }
        });
        if (response.message && !response.message.error) {
          return response.message;
        } else {
          return [];
        }
      } catch (error) {
        console.error("Error fetching debts:", error);
        frappe.msgprint(__("Error fetching debts."));
      }
    }
  };

  // ../pos_ar/pos_ar/pos_ar/page/pos/manager/ScreenManager.js
  pos_ar.PointOfSale.ScreenManager = class {
    constructor(settings_data) {
      this.settings_data = settings_data;
      this.screens = /* @__PURE__ */ new Map();
      this.activeScreen = null;
    }
    registerScreen(screenId, screenComponent) {
      this.screens.set(screenId, screenComponent);
    }
    navigate(screenId) {
      switch (screenId) {
        case "history_cart":
          this.history_cart.show_cart();
          this.customer_box.showHomeBar();
          this.payment_cart.hideCart();
          this.item_details.hide_cart();
          this.item_selector.hideCart();
          this.selected_item_cart.hideCart();
          this.customer_box.hideSyncBar();
          this.settings_cart.hideCart();
          this.check_in_out_cart.hideCart();
          this.debt_cart.hideCart();
          this.unsynced_pos_cart.hide_cart();
          break;
        case "settings_cart":
          this.settings_cart.showCart();
          this.customer_box.showHomeBar();
          this.item_selector.hideCart();
          this.selected_item_cart.hideCart();
          this.item_details.hide_cart();
          this.payment_cart.hideCart();
          this.history_cart.hide_cart();
          this.check_in_out_cart.hideCart();
          this.debt_cart.hideCart();
          this.unsynced_pos_cart.hide_cart();
          this.customer_box.hideSyncBar();
          break;
        case "check_in_out_cart":
          this.check_in_out_cart.showCart();
          this.customer_box.showHomeBar();
          this.item_selector.hideCart();
          this.selected_item_cart.hideCart();
          this.item_details.hide_cart();
          this.payment_cart.hideCart();
          this.history_cart.hide_cart();
          this.settings_cart.hideCart();
          this.debt_cart.hideCart();
          this.unsynced_pos_cart.hide_cart();
          this.customer_box.hideSyncBar();
          break;
        case "home":
          this.item_selector.showCart();
          this.customer_box.showSyncBar();
          this.selected_item_cart.showCart();
          this.payment_cart.hideCart();
          this.customer_box.hideHomeBar();
          this.item_details.hide_cart();
          this.history_cart.hide_cart();
          this.settings_cart.hideCart();
          this.debt_cart.hideCart();
          this.check_in_out_cart.hideCart();
          if (this.settings_data.settings.showItemDetails) {
            this.selected_item_cart.hideKeyboard();
          }
          this.unsynced_pos_cart.hide_cart();
          this.selected_item_cart.setKeyboardOrientation("portrait");
          this.selected_item_cart.cleanHeighlight();
          this.selected_item_cart.refreshTabs();
          this.selected_item_cart.refreshSelectedItem();
          break;
        case "debt_cart":
          this.debt_cart.showCart();
          this.customer_box.showHomeBar();
          this.item_selector.hideCart();
          this.selected_item_cart.hideCart();
          this.item_details.hide_cart();
          this.history_cart.hide_cart();
          this.settings_cart.hideCart();
          this.payment_cart.hideCart();
          this.check_in_out_cart.hideCart();
          this.unsynced_pos_cart.hide_cart();
          break;
        case "payment_cart":
          this.payment_cart.showCart();
          this.item_selector.hideCart();
          this.item_details.hide_cart();
          this.settings_cart.hideCart();
          this.debt_cart.hideCart();
          this.payment_cart.calculateGrandTotal();
          this.selected_item_cart.setKeyboardOrientation("landscape");
          this.selected_item_cart.cleanHeighlight();
          this.selected_item_cart.showKeyboard();
          this.unsynced_pos_cart.hide_cart();
          break;
        case "item_details":
          if (this.settings_data.settings.showItemDetails) {
            this.item_details.show_cart();
            this.item_selector.hideCart();
            this.selected_item_cart.showKeyboard();
            this.payment_cart.hideCart();
            this.settings_cart.hideCart();
            this.unsynced_pos_cart.hide_cart();
            this.selected_item_cart.setKeyboardOrientation("landscape");
          }
          this.selected_item_cart.makeSelectedButtonHighlighted();
          break;
        case "unsynced_pos_cart":
          this.unsynced_pos_cart.show_cart();
          this.customer_box.showHomeBar();
          this.history_cart.hide_cart();
          this.check_in_out_cart.hideCart();
          this.item_selector.hideCart();
          this.customer_box.hideSyncBar();
          this.selected_item_cart.hideCart();
          this.payment_cart.hideCart();
          this.item_selector.hideCart();
          this.item_details.hide_cart();
          this.settings_cart.hideCart();
          this.debt_cart.hideCart();
          this.payment_cart.calculateGrandTotal();
          this.selected_item_cart.setKeyboardOrientation("landscape");
          this.selected_item_cart.cleanHeighlight();
          this.selected_item_cart.showKeyboard();
          break;
        default:
          break;
      }
    }
  };
})();
//# sourceMappingURL=pos.bundle.FNSR7SQL.js.map
