frappe.provide("pos_ar.myaccessories");

pos_ar.myaccessories.AccessoriesController = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.wrapper.append('<link rel="stylesheet" type="text/css" href="/assets/pos_ar/css/accessories_page/main.css">');
        this.make();
    }

    make() {
        this.createTopBar();
    }

    createTopBar() {
        // Create top bar container
        this.topBar = $('<div class="accessories-top-bar">').appendTo(this.wrapper);

        // Left section with title
        const leftSection = $('<div class="top-bar-left">').appendTo(this.topBar);
        $('<h2 class="page-title">').text('Accessories Management').appendTo(leftSection);

        // Right section with action buttons
        const rightSection = $('<div class="top-bar-right">').appendTo(this.topBar);

        // Add New button
        $('<button class="btn btn-primary">')
            .html('<i class="fa fa-plus"></i> New Accessory')
            .click(() => this.createNewAccessory())
            .appendTo(rightSection);

        // Import button
        $('<button class="btn btn-default">')
            .html('<i class="fa fa-upload"></i> Import')
            .click(() => this.importAccessories())
            .appendTo(rightSection);

        // Export button
        $('<button class="btn btn-default">')
            .html('<i class="fa fa-download"></i> Export')
            .click(() => this.exportAccessories())
            .appendTo(rightSection);
    }

    createNewAccessory() {
        frappe.new_doc('Accessory', {}, doc => {
            frappe.set_route('Form', 'Accessory', doc.name);
        });
    }

    importAccessories() {
        // TODO: Implement import functionality
        frappe.msgprint(__('Import functionality coming soon'));
    }

    exportAccessories() {
        // TODO: Implement export functionality
        frappe.msgprint(__('Export functionality coming soon'));
    }
};
