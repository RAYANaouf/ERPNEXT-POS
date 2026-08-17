(() => {
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
          fields: ["name", "pos_profile", "period_start_date"],
          limit: 0,
          order_by: "creation desc"
        },
        callback: (response) => {
          if (response.message) {
            this.posOpeningSelect.empty();
            this.posOpeningSelect.append(
              $("<option></option>").val("").text("All POS Sessions")
            );
            response.message.forEach((entry) => {
              const dateStr = entry.period_start_date ? ` - ${entry.period_start_date}` : "";
              this.posOpeningSelect.append(
                $("<option></option>").val(entry.name).text(`${entry.name} (${entry.pos_profile})${dateStr}`)
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
        grandTotal += item.rate;
        $('<div class="item-row">').html(`
                    <div class="item-col name">${frappe.utils.escape_html(itemName)}</div>
                    <div class="item-col qty">${item.qty}</div>
                    <div class="item-col total">${this.formatCurrency(
          item.rate
        )}</div>
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
        total: value.rate
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

  // ../pos_ar/pos_ar/public/js/myaccessories.bundle.js
  frappe.provide("pos_ar.myaccessories");
  if (typeof pos_ar !== "undefined" && pos_ar.myaccessories) {
    window.pos_ar = pos_ar;
  }
})();
//# sourceMappingURL=myaccessories.bundle.MCULQDKP.js.map
