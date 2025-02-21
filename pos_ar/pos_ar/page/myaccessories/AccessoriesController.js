frappe.provide("pos_ar.myaccessories");

pos_ar.myaccessories.AccessoriesController = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/accessories_page/main.css">');
        this.selectedDate = frappe.datetime.get_today();
        this.selectedCompany = frappe.defaults.get_user_default('company');
        this.selectedPOSOpening = '';
        this.make();
    }

    make() {
        this.createLayout();
    }

    createLayout() {
        // Create the main container
        const container = $('<div class="accessories-container">').appendTo(this.wrapper);

        // Create top bar
        const topBar = $('<div class="top-bar">').appendTo(container);
        
        // Left side of top bar
        const leftSection = $('<div class="top-bar-left">').appendTo(topBar);
        $('<h2>').text('Accessories').appendTo(leftSection);

        // Center section with date filter
        const centerSection = $('<div class="top-bar-center">').appendTo(topBar);
        
        // Add company filter
        const companyWrapper = $('<div class="company-filter">').appendTo(centerSection);
        this.companySelect = $('<select>')
            .addClass('form-control')
            .change(() => {
                this.selectedCompany = this.companySelect.val();
                this.loadPOSOpenings();
                this.loadItems(container.find('.items-container'));
            })
            .appendTo(companyWrapper);

        // Add POS Opening Entry filter
        const posOpeningWrapper = $('<div class="pos-opening-filter">').appendTo(centerSection);
        this.posOpeningSelect = $('<select>')
            .addClass('form-control')
            .change(() => {
                this.selectedPOSOpening = this.posOpeningSelect.val();
                this.loadItems(container.find('.items-container'));
            })
            .appendTo(posOpeningWrapper);

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

        const dateWrapper = $('<div class="date-filter">').appendTo(centerSection);
        
        // Add date picker
        this.datePicker = $('<input type="date">')
            .val(this.selectedDate)
            .change(() => {
                this.selectedDate = this.datePicker.val();
                this.loadItems(container.find('.items-container'));
            })
            .appendTo(dateWrapper);

        // Right side of top bar with export button
        const rightSection = $('<div class="top-bar-right">').appendTo(topBar);
        $('<button class="btn-export">')
            .html('<i class="fa fa-download"></i> Export')
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
                    company: this.selectedCompany
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

        console.log("company : " , this.selectedCompany);
        console.log("pos opening : ", this.selectedPOSOpening);

        frappe.call({
            method: 'pos_ar.pos_ar.doctype.pos_info.pos_info.get_saled_item',
            args: {
                company: this.selectedCompany,
                pos_opening_entry: this.selectedPOSOpening
            },
            callback: (response) => {
                if (response.message) {
                    this.renderItems(container, response.message.items);
                }
            }
        });
    }

    renderItems(container, items) {
        container.find('.item-row:not(.header)').remove(); // Clear existing items
    
        console.log(items);
    
        // Check if there are no items
        if (Object.keys(items).length === 0) {
            // Show no data message
            $('<div class="item-row no-data">')
                .html('<div class="item-col name">No sales data found for selected date</div>')
                .appendTo(container);
            return;
        }
    
    
        // Iterate over map entries
        Object.entries(items).forEach(([itemName, item]) => {
    
            // Create item row
            $('<div class="item-row">')
                .html(`
                    <div class="item-col name">${frappe.utils.escape_html(itemName)}</div>
                    <div class="item-col qty">${item.qty}</div>
                    <div class="item-col total">${this.formatCurrency(item.rate)}</div>
                `)
                .appendTo(container);
        });
    
        // Add grand total row
        $('<div class="item-row grand-total">')
            .html(`
                <div class="item-col name">Grand Total</div>
                <div class="item-col qty"></div>
                <div class="item-col total">${this.formatCurrency(item.rate)}</div>
            `)
            .appendTo(container);
    }
    

    exportData() {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'POS Invoice Item',
                fields: ['item_name', 'qty', 'rate', 'amount'],
                filters: [
                    ['POS Invoice', 'posting_date', '=', this.selectedDate],
                    ['POS Invoice', 'docstatus', '=', 1]
                ],
                order_by: 'posting_date desc'
            },
            callback: (response) => {
                if (response.message) {
                    this.downloadCSV(response.message);
                }
            }
        });
    }

    downloadCSV(items) {
        const headers = ['Item Name', 'Price (DA)', 'Quantity', 'Total (DA)'];
        let csvContent = headers.join(',') + '\n';

        items.forEach(item => {
            const row = [
                `"${item.item_name}"`,
                item.rate.toFixed(2),
                item.qty,
                item.amount.toFixed(2)
            ];
            csvContent += row.join(',') + '\n';
        });

        // Add grand total
        const grandTotal = items.reduce((sum, item) => sum + item.amount, 0);
        csvContent += `\nGrand Total,,,"${grandTotal.toFixed(2)}"`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `accessories_sales_${this.selectedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
