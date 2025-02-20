frappe.provide("pos_ar.myaccessories");

pos_ar.myaccessories.AccessoriesController = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/accessories_page/main.css">');
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
            <div class="item-col price">Price</div>
            <div class="item-col qty">Quantity</div>
            <div class="item-col total">Total</div>
        `).appendTo(listContainer);

        // Add items
        this.loadItems(listContainer);
    }

    formatCurrency(amount) {
        return amount.toFixed(2) + ' DA';
    }

    loadItems(container) {
        // Get today's date in YYYY-MM-DD format
        const today = frappe.datetime.get_today();

        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'POS Invoice Item',
                fields: ['item_name', 'qty', 'rate', 'amount'],
                filters: [
                    ['POS Invoice', 'posting_date', '>=', today],
                    ['POS Invoice', 'docstatus', '=', 1]
                ],
                order_by: 'posting_date desc'
            },
            callback: (response) => {
                if (response.message) {
                    this.renderItems(container, response.message);
                }
            }
        });
    }

    renderItems(container, items) {
        container.find('.item-row:not(.header)').remove(); // Clear existing items

        let grandTotal = 0;

        items.forEach(item => {
            grandTotal += item.amount;
            const itemRow = $('<div class="item-row">')
                .html(`
                    <div class="item-col name">${frappe.utils.escape_html(item.item_name)}</div>
                    <div class="item-col price">${this.formatCurrency(item.rate)}</div>
                    <div class="item-col qty">${item.qty}</div>
                    <div class="item-col total">${this.formatCurrency(item.amount)}</div>
                `)
                .appendTo(container);
        });

        // Add grand total row
        $('<div class="item-row grand-total">')
            .html(`
                <div class="item-col name">Grand Total</div>
                <div class="item-col price"></div>
                <div class="item-col qty"></div>
                <div class="item-col total">${this.formatCurrency(grandTotal)}</div>
            `)
            .appendTo(container);
    }

    exportData() {
        // Get today's date in YYYY-MM-DD format
        const today = frappe.datetime.get_today();

        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'POS Invoice Item',
                fields: ['item_name', 'qty', 'rate', 'amount'],
                filters: [
                    ['POS Invoice', 'posting_date', '>=', today],
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
        link.setAttribute('download', `accessories_sales_${frappe.datetime.get_today()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
