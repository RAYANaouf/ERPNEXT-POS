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
        
        // Right side of top bar
        const rightSection = $('<div class="top-bar-right">').appendTo(topBar);
        $('<button class="btn-new">').html('<i class="fa fa-plus"></i> New Item').appendTo(rightSection);

        // Create items list container
        const listContainer = $('<div class="items-container">').appendTo(container);
        
        // Add some sample items
        this.loadItems(listContainer);
    }

    loadItems(container) {
        // Sample data - replace with actual data fetch
        const items = [
            { name: 'Keyboard', price: '29.99', stock: 15 },
            { name: 'Mouse', price: '19.99', stock: 20 },
            { name: 'Headphones', price: '49.99', stock: 10 },
            { name: 'USB Cable', price: '9.99', stock: 30 }
        ];

        items.forEach(item => {
            const itemCard = $('<div class="item-card">')
                .html(`
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <div class="item-meta">
                            <span class="price">$${item.price}</span>
                            <span class="stock">Stock: ${item.stock}</span>
                        </div>
                    </div>
                `)
                .appendTo(container);
        });
    }
};
