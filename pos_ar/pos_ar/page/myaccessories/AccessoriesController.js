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
            this.selectedBrand = this.brandField.get_value();
            this.loadItems(container.find('.items-container'));
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
        frappe.call({
            method: 'pos_ar.pos_ar.doctype.pos_info.pos_info.get_saled_item',
            args: {
                company: this.selectedCompany,
                pos_opening_entry: this.selectedPOSOpening,
                brand: this.selectedBrand
            },
            callback: (response) => {
                if (response.message) {
                    this.renderItems(container, response.message.items);
                }
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
        // Collect the displayed items
        const items = [];
        let totalQty = 0;
        let grandTotal = 0;
    
        this.wrapper.find('.item-row:not(.header):not(.no-data)').each(function() {
            const name = $(this).find('.item-col.name').text().trim();
            const qty = $(this).find('.item-col.qty').text().trim();
            const total = $(this).find('.item-col.total').text().trim();
    
            if (name && qty && total) {
                items.push({ name, qty, total });
                // Accumulate quantities and totals
                totalQty += parseInt(qty.replace(/[^0-9.-]+/g, ''));
                grandTotal += parseFloat(total.replace(/[^0-9.-]+/g, ''));
            }
        });
    
        // Check if there are items to export
        if (items.length === 0) {
            frappe.msgprint('No items to export.');
            return;
        }
    
        // Prepare data for Excel
        const worksheetData = [
            ['Name', 'Quantity', 'Total'], // Header row
            ...items.map(item => [item.name, item.qty, item.total]), // Item rows
            ['Total', totalQty, grandTotal.toFixed(2)] // Total row
        ];
    
        // Create a worksheet and a workbook
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Accessories Sales');
    
        // Generate the Excel file and trigger the download
        const xlsxFile = XLSX.write(workbook, { bookType: 'xlsx', type: 'blob' });
        const url = URL.createObjectURL(xlsxFile);
    
        // Create a download link and trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'accessories_sales_data.xlsx';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
        
    
};
