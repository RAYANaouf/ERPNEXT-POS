frappe.provide("pos_ar.Pricing");

pos_ar.Pricing.PricingController = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.current_screen = 'pricing'; // Default screen
        this.fetcher = new pos_ar.Pricing.PricingFetcher();
        this.setup_page();
        this.add_style();
        this.setup_events();
        this.load_companies();


        //global data 
        this.priceLists = [];
        this.brands = [];
        this.priceMap = {}

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
                        <button class="btn btn-primary fix-all-prices">Fix All Prices</button>
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

        // Initialize the popover
        this.loadingPopover = document.getElementById('loadingPopover');
    }

    setup_events() {
        // Handle navigation clicks
        this.wrapper.find('.nav-item').on('click', (e) => {
            const screen = $(e.currentTarget).data('screen');
            this.switch_screen(screen);
        });

        // Handle company filter change
        this.wrapper.find('.company-filter').on('change', (e) => {
            const company = $(e.currentTarget).val();
            this.filter_by_company(company);
        });

        // Handle new price list button click
        this.wrapper.find('.btn-primary').on('click', () => {
            this.create_new_item_price();
        });

        // Handle export button click
        this.wrapper.find('.btn-default:contains("Export")').on('click', () => {
            this.export_pricing_data();
        });

        // Handle Fix All Prices button click
        this.wrapper.find('.fix-all-prices').on('click', () => {
            frappe.confirm(
                'This will add missing price entries for all items. Do you want to continue?',
                () => {
                    frappe.call({
                        method: 'pos_ar.pos_ar.page.pricing.pricing.add_price_for_all_item2',
                        freeze: true,
                        freeze_message: __('Adding missing prices...'),
                        callback: (r) => {
                            if (!r.exc) {
                                frappe.show_alert({
                                    message: __('Prices added successfully'),
                                    indicator: 'green'
                                });
                                // Refresh the current view
                                const company = $('.company-filter').val();
                                if (this.current_screen === 'fixing') {
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

        // Handle price fixing
        this.wrapper.on('click', '.fix-prices', (e) => {
            const $button = $(e.currentTarget);
            const brand = $button.data('brand');
            const priceList = $button.data('price-list');
            
            // Get prices from the priceMap for this brand and price list
            const prices = this.priceMap[`${brand}_${priceList}`];
            
            // Get unique prices
            const uniquePrices = [...new Set(prices.map(p => p.price))];
            
            // Create dialog showing current prices and new price field
            const d = new frappe.ui.Dialog({
                title: __(`Fix Prices for ${brand}`),
                fields: [
                    {
                        fieldtype: 'HTML',
                        fieldname: 'current_prices',
                        label: __('Current Prices'),
                        options: `
                            <div class="current-prices-table">
                                <table class="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>${__('Current Price')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${uniquePrices.map(price => `
                                            <tr>
                                                <td>${price}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `
                    },
                    {
                        fieldtype: 'Currency',
                        fieldname: 'new_price',
                        label: __('New Price'),
                        reqd: 1,
                        description: __('This price will be applied to all items shown above')
                    }
                ],
                primary_action_label: __('Update Prices'),
                primary_action: (values) => {
                    frappe.call({
                        method: 'pos_ar.pos_ar.page.pricing.pricing.fix_prices',
                        args: {
                            brand: brand,
                            price_list: priceList,
                            new_price: values.new_price
                        },
                        freeze: true,
                        freeze_message: __('Fixing Prices...'),
                        callback: (r) => {
                            console.log("r : ",r);
                            if (!r.exc) {
                                d.hide();
                                frappe.show_alert({
                                    message: __('Prices fixed successfully'),
                                    indicator: 'green'
                                });
                                // Refresh the current view
                                const company = $('.company-filter').val();
                                if (this.current_screen === 'fixing') {
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

        // Edit price button handler using event delegation
        $(document).off('click', '.edit-price').on('click', '.edit-price', function (e) {
            const itemName = $(this).data('item');
            if (itemName) {
                this.show_price_editor(itemName);
            }
        }.bind(this));
    }

    switch_screen(screen) {
        // Update navigation active state
        this.wrapper.find('.nav-item').removeClass('active');
        this.wrapper.find(`.nav-item[data-screen="${screen}"]`).addClass('active');

        // Update screen visibility
        this.wrapper.find('.screen').removeClass('active');
        this.wrapper.find(`.${screen}-screen`).addClass('active');

        this.current_screen = screen;
    }

    load_companies() {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Company',
                fields: ['name', 'company_name'],
                order_by: 'company_name asc'
            },
            callback: (response) => {
                if (response.message) {
                    const companies = response.message;
                    const $companyFilter = this.wrapper.find('.company-filter');
                    $companyFilter.empty();

                    // Add companies without a default option
                    companies.forEach(company => {
                        $companyFilter.append(`<option value="${company.name}">${company.company_name}</option>`);
                    });

                    // Set default company if available
                    if (frappe.defaults.get_default('company')) {
                        $companyFilter.val(frappe.defaults.get_default('company'));
                        this.filter_by_company(frappe.defaults.get_default('company'));
                    } else {
                        this.filter_by_company(companies[0].name);
                    }

                    // Initialize select2 with placeholder
                    $companyFilter.select2({
                        placeholder: 'Company',
                        allowClear: true
                    });
                }
            }
        });
    }

    filter_by_company(company) {
        if (this.current_screen === 'pricing') {
            this.load_pricing_data(company);
        } else if (this.current_screen === 'fixing') {
            this.load_fixing_data(company);
        }
    }

    async load_pricing_data(company) {

        if (!company) return;

        try {
            // Get or initialize loading popover
            if (!this.loadingPopover) {
                this.loadingPopover = document.getElementById('loadingPopover');
            }

            // Close any existing popover
            if (this.loadingPopover.matches(':popover-open')) {
                this.loadingPopover.hidePopover();
            }

            // Show the popover
            requestAnimationFrame(() => {
                this.loadingPopover.showPopover();
            });

            const result = await this.fetcher.fetchItemPrices(company);
            const data = result.prices;
            this.priceLists = result.price_lists;
            this.brands = result.brands;

            // Hide loading popover
            this.loadingPopover.hidePopover();

            this.render_pricing_data(data, this.priceLists, this.brands);
        } catch (error) {
            // Hide loading popover in case of error
            if (this.loadingPopover) {
                this.loadingPopover.hidePopover();
            }

            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Failed to load item prices')
            });
            console.error('Error loading item prices:', error);
        }
    }

    render_pricing_data(data, priceLists, brands) {
        const $pricingScreen = this.wrapper.find('.pricing-screen');
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

        // Create a map for quick price lookup
        this.priceMap = {};
        data.forEach(item => {
            const key = `${item.brand || 'No Brand'}_${item.price_list}`;
            if (!this.priceMap[key]) {
                this.priceMap[key] = [];
            }
            this.priceMap[key].push({
                name: item.name,
                price: item.price_list_rate,
                item_code: item.item_code,
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
                                ${priceLists.map(pl => `
                                    <th class="sortable" data-sort="price" data-price-list="${pl.name}">
                                        ${pl.name} <i class="fa fa-sort"></i>
                                    </th>
                                `).join('')}
                            </tr>
                            <tr class="filters" style="display: none;">
                                <td>
                                    <input type="text" class="form-control brand-filter" placeholder="Filter Brand...">
                                </td>
                                ${priceLists.map(() => `
                                    <td>
                                        <input type="text" class="form-control price-filter" placeholder="Filter Price...">
                                    </td>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${brands.map(brand => `
                                <tr>
                                    <td>${brand.brand || brand.name}</td>
                                    ${priceLists.map(pl => {
                                        const priceData = this.priceMap[`${brand.name}_${pl.name}`] || [];
                                        const hasDifferentPrices = priceData.length > 1 && 
                                            !priceData.every(item => item.price === priceData[0].price);
                                        
                                        // Get all prices for this brand across all price lists
                                        const allPricesForBrand = priceLists.map(plist => {
                                            const data = this.priceMap[`${brand.name}_${plist.name}`] || [];
                                            return data.length > 0 ? data[0].price : 0;
                                        }).filter(price => price > 0);

                                        // Calculate price range
                                        const currentPrice = priceData.length > 0 ? priceData[0].price : 0;
                                        let priceClass = '';
                                        
                                        if (currentPrice > 0 && allPricesForBrand.length > 0) {
                                            const max = Math.max(...allPricesForBrand);
                                            const min = Math.min(...allPricesForBrand);
                                            const range = max - min;
                                            const threshold = range / 6;

                                            if (currentPrice >= max - threshold) {
                                                priceClass = 'price-highest';
                                            } else if (currentPrice >= max - 2 * threshold) {
                                                priceClass = 'price-high';
                                            } else if (currentPrice >= max - 3 * threshold) {
                                                priceClass = 'price-medium-high';
                                            } else if (currentPrice >= max - 4 * threshold) {
                                                priceClass = 'price-medium-low';
                                            } else if (currentPrice >= max - 5 * threshold) {
                                                priceClass = 'price-low';
                                            } else {
                                                priceClass = 'price-lowest';
                                            }
                                        }
                                        
                                        return `
                                            <td>
                                                ${priceData.length > 0 ?
                                                    `<div class="price-cell ${hasDifferentPrices ? 'different-prices' : ''} ${priceClass}">
                                                        <div class="price-value">
                                                            ${frappe.format(priceData[0].price, { fieldtype: 'Currency' })}
                                                        </div>
                                                    </div>` :
                                                    ''
                                                }
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `);

        // Add event handlers
        this.setupTableEvents($content);

        // Add some custom styles for the matrix layout
        const style = $(`
            <style>
                .pricing-table {
                    overflow-x: auto;
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
                    background-color: rgba(0, 255, 0, 0.1) !important;
                }
                .price-high {
                    background-color: rgba(100, 255, 0, 0.1) !important;
                }
                .price-medium-high {
                    background-color: rgba(200, 255, 0, 0.1) !important;
                }
                .price-medium-low {
                    background-color: rgba(255, 165, 0, 0.1) !important;
                }
                .price-low {
                    background-color: rgba(255, 100, 0, 0.1) !important;
                }
                .price-lowest {
                    background-color: rgba(255, 0, 0, 0.1) !important;
                }
                .price-cell {
                    padding: 8px;
                    border-radius: 4px;
                }
            </style>
        `);

        $pricingScreen.append(style).append($content);
    }


    
    async load_fixing_data(company) {

        if (!company) return;

        try {
            // Get or initialize loading popover
            if (!this.loadingPopover) {
                this.loadingPopover = document.getElementById('loadingPopover');
            }

            // Close any existing popover
            if (this.loadingPopover.matches(':popover-open')) {
                this.loadingPopover.hidePopover();
            }

            // Show the popover
            requestAnimationFrame(() => {
                this.loadingPopover.showPopover();
            });

            const result = await this.fetcher.fetchAllItemPrices(company);
            const data = result.prices;
            this.priceLists = result.price_lists;
            this.brands = result.brands;

            // Hide loading popover
            this.loadingPopover.hidePopover();

            this.render_Fixing_data(data, this.priceLists, this.brands);
        } catch (error) {
            // Hide loading popover in case of error
            if (this.loadingPopover) {
                this.loadingPopover.hidePopover();
            }

            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Failed to load item prices')
            });
            console.error('Error loading item prices:', error);
        }

    }

    render_Fixing_data(data, priceLists, brands) {
        const $fixingScreen = this.wrapper.find('.fixing-screen');
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

        // Create a map for quick price lookup
        this.priceMap = {};
        data.forEach(item => {
            const key = `${item.brand || 'No Brand'}_${item.price_list}`;
            if (!this.priceMap[key]) {
                this.priceMap[key] = [];
            }
            this.priceMap[key].push({
                name: item.name,
                price: item.price_list_rate,
                item_code: item.item_code,
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
                                ${priceLists.map(pl => `
                                    <th class="sortable" data-sort="price" data-price-list="${pl.name}">
                                        ${pl.name} <i class="fa fa-sort"></i>
                                    </th>
                                `).join('')}
                            </tr>
                            <tr class="filters" style="display: none;">
                                <td>
                                    <input type="text" class="form-control brand-filter" placeholder="Filter Brand...">
                                </td>
                                ${priceLists.map(() => `
                                    <td>
                                        <input type="text" class="form-control price-filter" placeholder="Filter Price...">
                                    </td>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${brands.map(brand => `
                                <tr>
                                    <td>
                                        ${brand.brand || brand.name}
                                        <button class="btn btn-xs btn-primary btn-modern set-brand-prices" 
                                            data-brand="${brand.name}"
                                            title="Set Prices for All Items">
                                            Set Prices
                                        </button>
                                    </td>
                                    ${priceLists.map(pl => {
                                        const priceData = this.priceMap[`${brand.name}_${pl.name}`] || [];
                                        const hasDifferentPrices = priceData.length > 1 && 
                                            !priceData.every(item => item.price === priceData[0].price);
                                        
                                        // Get all prices for this brand across all price lists
                                        const allPricesForBrand = priceLists.map(plist => {
                                            const data = this.priceMap[`${brand.name}_${plist.name}`] || [];
                                            return data.length > 0 ? data[0].price : 0;
                                        }).filter(price => price > 0);

                                        // Calculate price range
                                        const currentPrice = priceData.length > 0 ? priceData[0].price : 0;
                                        let priceClass = '';
                                        
                                        if (currentPrice > 0 && allPricesForBrand.length > 0) {
                                            const max = Math.max(...allPricesForBrand);
                                            const min = Math.min(...allPricesForBrand);
                                            const range = max - min;
                                            const threshold = range / 6;

                                            if (currentPrice >= max - threshold) {
                                                priceClass = 'price-highest';
                                            } else if (currentPrice >= max - 2 * threshold) {
                                                priceClass = 'price-high';
                                            } else if (currentPrice >= max - 3 * threshold) {
                                                priceClass = 'price-medium-high';
                                            } else if (currentPrice >= max - 4 * threshold) {
                                                priceClass = 'price-medium-low';
                                            } else if (currentPrice >= max - 5 * threshold) {
                                                priceClass = 'price-low';
                                            } else {
                                                priceClass = 'price-lowest';
                                            }
                                        }
                                        
                                        return `
                                            <td>
                                                ${priceData.length > 0 ?
                                                    `<div class="price-cell ${hasDifferentPrices ? 'different-prices' : ''} ${priceClass}">
                                                        <div class="price-value">
                                                            ${frappe.format(priceData[0].price, { fieldtype: 'Currency' })}
                                                            ${hasDifferentPrices ? `
                                                                <div class="price-warning">(Multiple prices)</div>
                                                                <button class="btn btn-xs btn-danger btn-modern fix-prices" 
                                                                    data-brand="${brand.name}"
                                                                    data-price-list="${pl.name}"
                                                                    title="Fix Price Discrepancy">
                                                                    Fix
                                                                </button>` : ''}
                                                            <button class="btn btn-xs btn-default btn-modern edit-price" 
                                                                    data-item="${priceData[0].name}"
                                                                    title="Edit Price">
                                                                <i class="fa fa-pencil"></i>
                                                            </button>
                                                        </div>
                                                    </div>` :
                                                    ''
                                                }
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `);


        // Add event handlers
        this.setupTableEvents($content);


        const style = $(`
            <style>
                .pricing-table {
                    overflow-x: auto;
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
                    background: #f8f9fa;
                    color: #495057;
                    border: 1px solid #dee2e6;
                }

                .btn-modern.btn-default:hover {
                    background: #e9ecef;
                }

                .btn-modern.btn-xs {
                    padding: 4px 8px;
                    font-size: 12px;
                }
                .price-highest {
                    background-color: rgba(0, 255, 0, 0.15) !important;
                }
                .price-high {
                    background-color: rgba(100, 255, 0, 0.15) !important;
                }
                .price-medium-high {
                    background-color: rgba(200, 255, 0, 0.15) !important;
                }
                .price-medium-low {
                    background-color: rgba(255, 165, 0, 0.15) !important;
                }
                .price-low {
                    background-color: rgba(255, 100, 0, 0.15) !important;
                }
                .price-lowest {
                    background-color: rgba(255, 0, 0, 0.15) !important;
                }
                .price-cell {
                    padding: 8px;
                    border-radius: 4px;
                }
            </style>
        `);

        $fixingScreen.append(style).append($content);
    }

    setupTableEvents($content) {
        const self = this;

        // Toggle filters
        $content.find('.toggle-filters').on('click', function () {
            $content.find('.filters').toggle();
        });

        // Clear filters
        $content.find('.clear-filters').on('click', function () {
            $content.find('.filters input, .global-search').val('');
            $content.find('tbody tr').show();
        });

        // Global search
        $content.find('.global-search').on('input', function () {
            const searchTerm = $(this).val().toLowerCase();
            $content.find('tbody tr').each(function () {
                const $row = $(this);
                const text = $row.text().toLowerCase();
                $row.toggle(text.includes(searchTerm));
            });
        });

        // Column filters
        $content.find('.brand-filter, .price-filter').on('input', function () {
            const $filters = $content.find('.filters input');
            const filterValues = $filters.map(function () {
                return {
                    column: $(this).closest('td').index(),
                    value: $(this).val().toLowerCase()
                };
            }).get();

            $content.find('tbody tr').each(function () {
                const $row = $(this);
                const visible = filterValues.every(filter => {
                    const cellText = $row.find(`td:eq(${filter.column})`).text().toLowerCase();
                    return !filter.value || cellText.includes(filter.value);
                });
                $row.toggle(visible);
            });
        });

        // Sorting
        let currentSort = { column: null, direction: 'asc' };

        $content.find('.sortable').on('click', function () {
            const column = $(this).data('sort');
            const priceList = $(this).data('price-list');
            const columnIndex = $(this).index();

            // Update sort direction
            if (currentSort.column === columnIndex) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = { column: columnIndex, direction: 'asc' };
            }

            // Update sort icons
            $content.find('.sortable i').attr('class', 'fa fa-sort');
            $(this).find('i').attr('class', `fa fa-sort-${currentSort.direction}`);

            // Sort rows
            const rows = $content.find('tbody tr').get();
            rows.sort((a, b) => {
                let aVal = $(a).find(`td:eq(${columnIndex})`).text();
                let bVal = $(b).find(`td:eq(${columnIndex})`).text();

                if (column === 'price') {
                    // Extract numeric values for price sorting
                    aVal = parseFloat(aVal.replace(/[^0-9.-]+/g, '')) || 0;
                    bVal = parseFloat(bVal.replace(/[^0-9.-]+/g, '')) || 0;
                }

                if (currentSort.direction === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });

            $content.find('tbody').html(rows);
        });

        // Set prices button handler
        $content.on('click', '.set-brand-prices', (e) => {
            const brand = $(e.currentTarget).data('brand');
            frappe.confirm(
                `This will set prices for all items of brand "${brand}". Do you want to continue?`,
                () => {
                    frappe.call({
                        method: 'pos_ar.pos_ar.page.pricing.pricing.add_price_for_all_item_by_brand2',
                        args: {
                            brand: brand
                        },
                        freeze: true,
                        freeze_message: __('Setting Prices...'),
                        callback: (r) => {
                            if (!r.exc) {
                                frappe.show_alert({
                                    message: __('Prices set successfully'),
                                    indicator: 'green'
                                });
                                // Refresh the current view
                                const company = $('.company-filter').val();
                                if (this.current_screen === 'fixing') {
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
    }

    create_new_item_price() {
        const company = this.wrapper.find('.company-filter').val();
        if (!company) {
            frappe.throw(__('Please select a company first'));
            return;
        }

        frappe.prompt([
            {
                label: 'Brand',
                fieldname: 'brand',
                fieldtype: 'Link',
                options: 'Brand',
                reqd: 1
            },
            {
                label: 'Price List',
                fieldname: 'price_list',
                fieldtype: 'Link',
                options: 'Price List',
                reqd: 1
            },
            {
                label: 'Price List Rate',
                fieldname: 'price_list_rate',
                fieldtype: 'Currency',
                reqd: 1
            }
        ], (values) => {
            // Check if an item with the specified brand exists
            frappe.db.get_list('Item', {
                filters: {
                    brand: values.brand
                }
            }).then(items => {
                if (items.length > 0) {
                    // Item with the specified brand exists, create a new item price
                    const item_code = items[0].name;
                    frappe.call({
                        method: 'frappe.client.insert',
                        args: {
                            doc: {
                                doctype: 'Item Price',
                                item_code: item_code,
                                price_list: values.price_list,
                                price_list_rate: values.price_list_rate,
                                company: company
                            }
                        },
                        callback: (r) => {
                            if (r.message) {
                                frappe.show_alert({
                                    message: __('Item Price created successfully'),
                                    indicator: 'green'
                                });
                                this.load_pricing_data(company);
                            }
                        }
                    });
                } else {
                    // No item with the specified brand exists, display a message
                    frappe.msgprint({
                        title: __('Error'),
                        indicator: 'red',
                        message: __('No item with the specified brand exists. Please create an item with the specified brand first.')
                    });
                }
            });
        }, 'Create New Item Price', 'Create');
    }

    show_price_editor(itemPriceName) {
        frappe.db.get_doc('Item Price', itemPriceName)
            .then(doc => {
                frappe.prompt([
                    {
                        label: 'Current Price',
                        fieldname: 'current_price',
                        fieldtype: 'Currency',
                        read_only: 1,
                        default: doc.price_list_rate
                    },
                    {
                        label: 'New Price',
                        fieldname: 'price',
                        fieldtype: 'Currency',
                        reqd: 1
                    }
                ], (values) => {
                    frappe.call({
                        method: 'frappe.client.set_value',
                        args: {
                            doctype: 'Item Price',
                            name: itemPriceName,
                            fieldname: 'price_list_rate',
                            value: values.price
                        },
                        callback: (r) => {
                            if (r.exc) {
                                frappe.msgprint({
                                    title: __('Error'),
                                    indicator: 'red',
                                    message: __('Failed to update price')
                                });
                                return;
                            }

                            frappe.show_alert({
                                message: __('Price updated successfully'),
                                indicator: 'green'
                            });

                            // Refresh the pricing data
                            const company = this.wrapper.find('.company-filter').val();
                            if (this.current_screen === 'fixing') {
                                this.load_fixing_data(company);
                            } else {
                                this.load_pricing_data(company);
                            }
                        }
                    });
                }, __('Update Price'), __('Update'));
            })
            .catch(err => {
                frappe.msgprint({
                    title: __('Error'),
                    indicator: 'red',
                    message: __('Failed to fetch item price details')
                });
                console.error('Error fetching item price:', err);
            });
    }

    export_pricing_data() {

        const company = this.wrapper.find('.company-filter').val();
        if (!company) {
            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Please select a company first')
            });
            return;
        }

        // Create the CSV content//+
        let csvContent = "data:text/csv;charset=utf-8,";//+

        // Add the header row//+
        csvContent += "Brand," + this.priceLists.map(pl => pl.name).join(",") + "\n";//+
        console.log("the price lists : ", csvContent)
        //+
        // Add the pricing data//+
        this.brands.forEach(brand => {//+
            let row = brand.brand;//+
            this.priceLists.forEach(pl => {//+
                const data_price = this.priceMap[`${brand.name}_${pl.name}`] || [];//+

                row += "," + (data_price.length > 0 ? data_price.map(pd => pd.price).join(',') : "empty");//+
            });//+
            csvContent += row + "\n";//+
        });//+
        //+
        // Create a temporary link and trigger a download//+
        const encodedUri = encodeURI(csvContent);//+
        const link = document.createElement("a");//+
        link.setAttribute("href", encodedUri);//+
        link.setAttribute("download", `pricing_matrix_${company}.csv`);//+
        document.body.appendChild(link);//+
        link.click();//+
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
                    background-color: rgba(0, 255, 0, 0.1) !important;
                }
                .price-high {
                    background-color: rgba(100, 255, 0, 0.1) !important;
                }
                .price-medium-high {
                    background-color: rgba(200, 255, 0, 0.1) !important;
                }
                .price-medium-low {
                    background-color: rgba(255, 165, 0, 0.1) !important;
                }
                .price-low {
                    background-color: rgba(255, 100, 0, 0.1) !important;
                }
                .price-lowest {
                    background-color: rgba(255, 0, 0, 0.1) !important;
                }
                .price-cell {
                    padding: 8px;
                    border-radius: 4px;
                }
            </style>
        `;

        this.wrapper.append(style);
    }
};
