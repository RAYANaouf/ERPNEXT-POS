frappe.provide("pos_ar.Pricing");

pos_ar.Pricing.PricingController = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.current_screen = 'pricing'; // Default screen
        this.setup_page();
        this.add_style();
        this.setup_events();
        this.load_companies();
    }

    setup_page() {
        this.page_content = $(`
            <div class="pricing-container">
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
        // This method will be implemented based on the specific needs of each screen
        if (this.current_screen === 'pricing') {
            // Handle pricing screen filtering
            this.load_pricing_data(company);
        } else if (this.current_screen === 'fixing') {
            // Handle fixing screen filtering
            this.load_fixing_data(company);
        }
    }

    load_pricing_data(company) {
        // To be implemented based on your specific requirements
        console.log('Loading pricing data for company:', company);
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
                }

                .filter-item {
                    min-width: 200px;
                }

                .filter-item .select2-container {
                    width: 100% !important;
                }

                .filter-item .select2-container .select2-selection--single {
                    height: 42px;
                    background: var(--bg-color);
                    border: 1px solid var(--border-color);
                    border-radius: 0.75rem;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }

                .filter-item .select2-container .select2-selection--single:hover {
                    border-color: var(--primary-color);
                }

                .filter-item .select2-container .select2-selection--single .select2-selection__rendered {
                    line-height: 42px;
                    padding-left: 1rem;
                    color: var(--text-primary);
                }

                .filter-item .select2-container .select2-selection--single .select2-selection__arrow {
                    height: 40px;
                    width: 40px;
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

                /* Select2 Dropdown Styling */
                .select2-dropdown {
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    margin-top: 4px;
                }

                .select2-search__field {
                    border: 1px solid var(--border-color) !important;
                    border-radius: 0.5rem !important;
                    padding: 0.5rem 0.75rem !important;
                    margin: 0.5rem !important;
                }

                .select2-search__field:focus {
                    border-color: var(--primary-color) !important;
                    outline: none !important;
                }

                .select2-results__option {
                    padding: 0.75rem 1rem !important;
                    color: var(--text-primary);
                }

                .select2-results__option--highlighted {
                    background: var(--primary-color) !important;
                    color: white !important;
                }
            </style>
        `;
        this.wrapper.append(style);
    }
};
