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
        // Sample data - replace with actual data fetch
        const items = [
            { name: 'Keyboard', price: 2999.99, stock: 15 },
            { name: 'Mouse', price: 1999.99, stock: 20 },
            { name: 'Headphones', price: 4999.99, stock: 10 },
            { name: 'USB Cable', price: 999.99, stock: 30 }
        ];

        let grandTotal = 0;

        items.forEach(item => {
            const total = item.price * item.stock;
            grandTotal += total;
            const itemRow = $('<div class="item-row">')
                .html(`
                    <div class="item-col name">${item.name}</div>
                    <div class="item-col price">${this.formatCurrency(item.price)}</div>
                    <div class="item-col qty">${item.stock}</div>
                    <div class="item-col total">${this.formatCurrency(total)}</div>
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
        // Implement export functionality
        frappe.show_alert({
            message: 'Exporting data...',
            indicator: 'green'
        });
        // Add actual export logic here
    }
};
