frappe.provide("pos_ar.myaccessories");

pos_ar.myaccessories.AccessoriesController = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/accessories_page/main.css">');
        this.selectedCompany = frappe.defaults.get_user_default('company');
        this.selectedPOSOpening = '';
        this.selectedBrand = '';
        this.brandList = [];
        this.make();
    }

    make() {
        this.createLayout();
    }

    createLayout() {
        // Create the main container
        const container = $('<div class="accessories-container">').appendTo(this.wrapper);

        // Create top bar with modern design
        const topBar = $('<div class="top-bar shadow">').appendTo(container);
        
        // Left side of top bar with logo and title
        const leftSection = $('<div class="top-bar-left">').appendTo(topBar);
        $('<div class="page-icon"><i class="fa fa-box-open fa-lg"></i></div>').appendTo(leftSection);
        $('<h2>').text('Accessories').appendTo(leftSection);

        // Center section with filters
        const centerSection = $('<div class="top-bar-center">').appendTo(topBar);
        
        // Create filter container with modern design
        const filterContainer = $('<div class="filter-container">').appendTo(centerSection);
        
        // Add company filter
        const companyWrapper = $('<div class="filter-group">').appendTo(filterContainer);
        this.companySelect = $('<select>')
            .addClass('form-control')
            .change(() => {
                this.selectedCompany = this.companySelect.val();
                this.loadPOSOpenings();
                this.loadItems(container.find('.items-container'));
            })
            .appendTo(companyWrapper);

        // Add POS Opening Entry filter
        const posOpeningWrapper = $('<div class="filter-group">').appendTo(filterContainer);
        this.posOpeningSelect = $('<select>')
            .addClass('form-control')
            .change(() => {
                this.selectedPOSOpening = this.posOpeningSelect.val();
                this.loadItems(container.find('.items-container'));
            })
            .appendTo(posOpeningWrapper);

        // Add Brand filter with autocomplete
        const brandWrapper = $('<div class="filter-group">').appendTo(filterContainer);
        const brandInputWrapper = $('<div class="brand-input-wrapper">').appendTo(brandWrapper);
        
        // Create the brand input using Frappe's Link field
        this.brandField = frappe.ui.form.make_control({
            parent: brandInputWrapper,
            df: {
                fieldtype: 'Link',
                options: 'Brand',
                placeholder: 'Type to search brands...',
                only_select: false,
                filter_fields: ['name'],
                get_query: () => {
                    return {
                        filters: {}
                    };
                }
            },
            render_input: true
        });
        
        this.brandField.refresh();
        
        // Style the input
        this.brandField.$input
            .addClass('brand-filter-input')
            .removeClass('input-with-feedback');

        // Add clear button
        const clearBtn = $('<button>')
            .addClass('clear-brand-btn')
            .html('<i class="fa fa-times"></i>')
            .click(() => {
                this.brandField.set_value('');
                this.selectedBrand = '';
                this.loadItems(container.find('.items-container'));
            })
            .appendTo(brandInputWrapper);

        // Handle brand selection
        this.brandField.$input.on('change', () => {
            const newValue = this.brandField.get_value();
            if (this.selectedBrand !== newValue) {
                this.selectedBrand = newValue;
                console.log("Brand changed to:", this.selectedBrand);
                // Add a small delay to ensure the value is properly set
                setTimeout(() => {
                    this.loadItems(container.find('.items-container'));
                }, 100);
            }
        });

        // Also handle the awesomplete-selectcomplete event
        this.brandField.$input.on('awesomplete-selectcomplete', () => {
            const newValue = this.brandField.get_value();
            if (this.selectedBrand !== newValue) {
                this.selectedBrand = newValue;
                console.log("Brand selected from dropdown:", this.selectedBrand);
                this.loadItems(container.find('.items-container'));
            }
        });

        // Load companies
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Company',
                fields: ['name'],
                limit: 0
            },
            callback: (response) => {
                if (response.message) {
                    this.companySelect.empty();
                    response.message.forEach(company => {
                        this.companySelect.append(
                            $('<option></option>')
                                .val(company.name)
                                .text(company.name)
                        );
                    });
                    this.companySelect.val(this.selectedCompany);
                    this.loadPOSOpenings();
                }
            }
        });

        // Right side of top bar with export button
        const rightSection = $('<div class="top-bar-right">').appendTo(topBar);
        $('<button class="btn btn-primary btn-export">')
            .html('<i class="fa fa-download mr-2"></i>Export')
            .click(() => this.exportData())
            .appendTo(rightSection);

        // Create items list container
        const listContainer = $('<div class="items-container">').appendTo(container);
        
        // Add header row
        const headerRow = $('<div class="item-row header">').html(`
            <div class="item-col name">Name</div>
            <div class="item-col qty">Quantity</div>
            <div class="item-col total">Total</div>
        `).appendTo(listContainer);

        // Add items
        this.loadItems(listContainer);
    }

    formatCurrency(amount) {
        return amount.toFixed(2) + ' DA';
    }

    loadPOSOpenings() {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'POS Opening Entry',
                filters: {
                    company   : this.selectedCompany,
                    docstatus : 1
                },
                fields: ['name', 'pos_profile'],
                limit: 0
            },
            callback: (response) => {
                if (response.message) {
                    this.posOpeningSelect.empty();
                    this.posOpeningSelect.append(
                        $('<option></option>')
                            .val('')
                            .text('All POS Sessions')
                    );
                    response.message.forEach(entry => {
                        this.posOpeningSelect.append(
                            $('<option></option>')
                                .val(entry.name)
                                .text(`${entry.name} (${entry.pos_profile})`)
                        );
                    });
                    this.posOpeningSelect.val(this.selectedPOSOpening);
                }
            }
        });
    }


    loadItems(container) {
        // Clear any previous loading state
        container.find('.item-row:not(.header)').remove();
        container.append('<div class="loading-message">Loading items...</div>');

        console.log("Loading items with filters:", {
            company: this.selectedCompany,
            pos_opening_entry: this.selectedPOSOpening,
            brand: this.selectedBrand
        });

        frappe.call({
            method: 'pos_ar.pos_ar.doctype.pos_info.pos_info.get_saled_item',
            args: {
                company: this.selectedCompany,
                pos_opening_entry: this.selectedPOSOpening,
                brand: this.selectedBrand || ''  // Ensure we pass empty string if no brand selected
            },
            callback: (response) => {
                container.find('.loading-message').remove();
                if (response.message) {
                    this.data = response.message.items; // Store data for export
                    this.renderItems(container, this.data);
                } else {
                    container.append('<div class="no-items-message">No items found</div>');
                }
            },
            error: (err) => {
                container.find('.loading-message').remove();
                container.append('<div class="error-message">Error loading items</div>');
                console.error("Error loading items:", err);
            }
        });
    }
    

    renderItems(container, items) {
        container.find('.item-row:not(.header)').remove();
    
        // Check if there are no items
        if (Object.keys(items).length === 0) {
            $('<div class="item-row no-data">')
                .html('<div class="item-col name">No sales data found for selected date</div>')
                .appendTo(container);
            return;
        }
    
        let grandTotal = 0;
    
        Object.entries(items).forEach(([itemName, item]) => {
            grandTotal += item.rate * item.qty;
    
            $('<div class="item-row">')
                .html(`
                    <div class="item-col name">${frappe.utils.escape_html(itemName)}</div>
                    <div class="item-col qty">${item.qty}</div>
                    <div class="item-col total">${this.formatCurrency(item.rate * item.qty)}</div>
                `)
                .appendTo(container);
        });
    
        $('<div class="item-row grand-total">')
            .html(`
                <div class="item-col name">Grand Total</div>
                <div class="item-col qty"></div>
                <div class="item-col total">${this.formatCurrency(grandTotal)}</div>
            `)
            .appendTo(container);
    }
    
    exportData() {
        // Convert this.data to an array if it's an object
        const dataArray = Object.entries(this.data || {}).map(([key, value]) => ({
            name: key,
            qty: value.qty,
            total: value.rate * value.qty
        }));
    
        // Check if dataArray is not empty
        if (dataArray.length === 0) {
            frappe.msgprint("No data to export.");
            return;
        }
    
        // Calculate totals
        const totalRecords = dataArray.length;
        const totalQty = dataArray.reduce((sum, item) => sum + (item.qty || 0), 0);
        const totalCost = dataArray.reduce((sum, item) => sum + (item.total || 0), 0);
    
        // Add the totals row
        dataArray.push({
            name: "Total",
            qty: totalQty,
            total: totalCost
        });
    
        // Create a new workbook and add the sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataArray);
    
        // Add the total records in the first column of the last row
        const lastRowIndex = dataArray.length;
        ws[`A${lastRowIndex + 1}`] = { t: 's', v: 'Total Records' };
        ws[`B${lastRowIndex + 1}`] = { t: 'n', v: totalRecords };
    
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    
        // Use type 'array' instead of 'blob'
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
        // Create a Blob from the array buffer
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
        // Create download link and trigger download
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
