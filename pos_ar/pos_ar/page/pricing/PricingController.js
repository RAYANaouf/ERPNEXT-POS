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
                    }else{
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
            const price_lists = result.price_lists;
            const brands = result.brands;
            
            // Hide loading popover
            this.loadingPopover.hidePopover();
            
            this.render_pricing_data(data, price_lists, brands);
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

    render_pricing_data(data, price_lists, brands) {
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
        const priceMap = {};
        data.forEach(item => {
            const key = `${item.brand || 'No Brand'}_${item.price_list}`;
            priceMap[key] = {
                price: item.price_list_rate,
                item_code: item.item_code
            };
        });

        const $content = $(`
            <div class="pricing-data">
                <div class="pricing-table">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                ${price_lists.map(pl => `
                                    <th>${pl.name}</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${brands.map(brand => `
                                <tr>
                                    <td>${brand.name}</td>
                                    ${price_lists.map(pl => {
                                        const priceData = priceMap[`${brand.name}_${pl.name}`] || {};
                                        return `
                                            <td>
                                                ${priceData.price ? 
                                                    `<div>
                                                        ${frappe.format(priceData.price, {fieldtype: 'Currency'})}
                                                        <button class="btn btn-xs btn-default edit-price ml-2" 
                                                                data-item="${priceData.item_code}">
                                                            <i class="fa fa-pencil"></i>
                                                        </button>
                                                    </div>`
                                                    : '-'
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

        // Add some custom styles for the matrix layout
        const style = $(`
            <style>
                .pricing-table table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .pricing-table th, .pricing-table td {
                    text-align: center;
                    padding: 8px;
                }
                .pricing-table th:first-child, 
                .pricing-table td:first-child {
                    text-align: left;
                    font-weight: bold;
                }
                .pricing-table td div {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .edit-price {
                    padding: 2px 6px;
                }
            </style>
        `);

        // Add event handlers for the edit buttons
        $content.find('.edit-price').on('click', (e) => {
            const itemCode = $(e.currentTarget).data('item');
            this.show_price_editor(itemCode);
        });

        $pricingScreen.html($content);
        $pricingScreen.append(style);
    }

    show_price_editor(itemCode) {
        // Implementation for price editor dialog
        frappe.prompt([
            {
                label: 'New Price',
                fieldname: 'price',
                fieldtype: 'Currency',
                reqd: 1
            }
        ], (values) => {
            // Here you would implement the price update logic
            frappe.show_alert({
                message: __('Price updated successfully'),
                indicator: 'green'
            });
        }, __('Update Price'), __('Update'));
    }

    load_fixing_data(company) {
        // To be implemented based on your specific requirements
        console.log('Loading fixing data for company:', company);
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
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
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

                /* Select2 Dropdown Styling */
                .select2-dropdown {
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 14px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    overflow: hidden;
                    margin-top: 12px;
                    transform-origin: top;
                    animation: dropdownIn 0.2s ease-out;
                }

                @keyframes dropdownIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .select2-container--default .select2-search--dropdown {
                    padding: 12px 12px 8px;
                    background: var(--surface-color);
                    border-bottom: 1px solid var(--border-color);
                }

                .select2-search__field {
                    height: 44px !important;
                    border: 1px solid var(--border-color) !important;
                    border-radius: 10px !important;
                    padding: 0 1.25rem !important;
                    margin: 0 !important;
                    background: var(--bg-color) !important;
                    color: var(--text-primary) !important;
                    font-size: 0.9375rem !important;
                    transition: all 0.2s !important;
                }

                .select2-search__field:focus {
                    border-color: var(--primary-color) !important;
                    outline: none !important;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15) !important;
                }

                .select2-results {
                    padding: 8px;
                }

                .select2-results__options {
                    max-height: 300px;
                    padding: 4px;
                }

                .select2-results__option {
                    padding: 12px 16px !important;
                    border-radius: 10px;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                    font-weight: 500;
                    transition: all 0.15s;
                    position: relative;
                    cursor: pointer;
                }

                .select2-results__option:last-child {
                    margin-bottom: 0;
                }

                .select2-results__option--highlighted {
                    background: rgba(79, 70, 229, 0.08) !important;
                    color: var(--primary-color) !important;
                }

                .select2-results__option[aria-selected=true] {
                    background: var(--primary-color) !important;
                    color: white !important;
                }

                .select2-results__option[aria-selected=true]::before {
                    content: '✓';
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 1.1em;
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
            </style>
        `;
        this.wrapper.append(style);
    }
};
