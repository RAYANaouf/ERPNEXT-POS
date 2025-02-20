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
        // Create modern page header
        this.page = $('<div class="page-head d-flex justify-content-between border-bottom">').appendTo(this.wrapper);

        // Left section with title and search
        const leftSection = $('<div class="d-flex align-items-center gap-4">').appendTo(this.page);

        // Title section with icon
        const titleSection = $('<div class="d-flex align-items-center">').appendTo(leftSection);
        
        // Icon container with primary color background
        $('<div class="d-flex align-items-center justify-content-center rounded" style="width: 32px; height: 32px; background: var(--primary-light)">')
            .html('<i class="fa fa-box-open text-primary" style="font-size: 16px;"></i>')
            .appendTo(titleSection);

        // Title text
        $('<h1 class="title-text ms-3">')
            .text('Accessories Management')
            .appendTo(titleSection);

        // Right section with actions
        const rightSection = $('<div class="d-flex align-items-center gap-2">').appendTo(this.page);

        // Primary action button
        const primaryBtn = $('<button class="btn btn-primary btn-sm d-flex align-items-center gap-2">')
            .html('<i class="fa fa-plus"></i><span>New Accessory</span>')
            .click(() => this.createNewAccessory())
            .appendTo(rightSection);

        // Button group for secondary actions
        const btnGroup = $('<div class="btn-group">').appendTo(rightSection);

        // Import button
        $('<button class="btn btn-default btn-sm d-flex align-items-center gap-2">')
            .html('<i class="fa fa-upload"></i><span>Import</span>')
            .click(() => this.importAccessories())
            .appendTo(btnGroup);

        // Export button
        $('<button class="btn btn-default btn-sm d-flex align-items-center gap-2">')
            .html('<i class="fa fa-download"></i><span>Export</span>')
            .click(() => this.exportAccessories())
            .appendTo(btnGroup);
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
