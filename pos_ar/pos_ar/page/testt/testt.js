frappe.pages['testt'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Stock Quantities',
		single_column: true
	});

	const $container = $(wrapper).find('.layout-main-section');
	$container.empty();

	const table_html = `
		<div class="testt-wrapper">
            <style>
                body[data-route="testt"] .main-section .sticky-top,
                body[data-route="testt"] .page-head-flex .container {
                    display: none !important;
                }
                .testt-wrapper {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .testt-card {
                    background: #fff;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    min-height: 100vh !important;
                    z-index: 1000 !important;
                    padding: 40px !important;
                    overflow-y: auto !important;
                    border: none !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }
                .testt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .testt-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1a202c;
                    margin: 0;
                }
                .filter-section {
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .filter-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #4a5568;
                    margin-bottom: 8px;
                }
                .multi-select-container {
                    position: relative;
                    width: 100%;
                    max-width: 500px;
                }
                .tags-input-wrapper {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 6px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: #fff;
                    min-height: 42px;
                    cursor: text;
                    transition: all 0.2s;
                    margin-bottom: 4px;
                }
                .tags-input-wrapper:focus-within {
                    border-color: #4299e1;
                    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
                }
                .tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #edf2f7;
                    color: #2d3748;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                .tag-remove {
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    color: #718096;
                    transition: all 0.2s;
                }
                .tag-remove:hover {
                    background: #cbd5e0;
                    color: #2d3748;
                }
                .search-input {
                    border: none;
                    outline: none;
                    padding: 4px;
                    flex: 1;
                    min-width: 150px;
                    font-size: 0.875rem;
                }
                .custom-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    margin-top: 4px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1000;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    display: none;
                }
                .dropdown-item {
                    padding: 8px 12px;
                    font-size: 0.875rem;
                    color: #4a5568;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .dropdown-item:hover {
                    background: #f7fafc;
                    color: #2b6cb0;
                }
                .dropdown-item.selected {
                    background: #ebf8ff;
                    color: #2b6cb0;
                    pointer-events: none;
                }
                .stock-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-bottom: 16px;
                }
                .stock-table th {
                    background: #f8fafc;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                    padding: 12px 16px;
                    border-bottom: 2px solid #edf2f7;
                    text-align: left;
                }
                .stock-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #edf2f7;
                    vertical-align: middle;
                }
                .stock-table tr:last-child td {
                    border-bottom: none;
                }
                .item-select-container {
                    position: relative;
                }
                .item-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    margin-top: 2px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1001;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    display: none;
                }
                .form-control-custom {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    color: #4a5568;
                }
                .form-control-custom:focus {
                    outline: none;
                    border-color: #4299e1;
                    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
                }
                .form-control-custom[readonly] {
                    background-color: #f8fafc;
                    color: #718096;
                    cursor: not-allowed;
                    border-color: #edf2f7;
                }
                .btn-add-row {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-weight: 500;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-add-row:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }
                .btn-remove {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    color: #94a3b8;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-remove:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }
            </style>

            <div class="testt-card">
                <div class="testt-header">
                    <h2 class="testt-title">Inventory Quantities</h2>
                </div>

                <div class="filter-section" style="flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 300px;">
                        <span class="filter-label">Companies</span>
                        <div class="multi-select-container">
                            <div class="tags-input-wrapper" id="company-tags-wrapper">
                                <input type="text" class="search-input" id="company-search" placeholder="Search companies...">
                            </div>
                            <div class="custom-dropdown" id="company-results"></div>
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 300px;">
                        <span class="filter-label">Warehouses</span>
                        <div class="multi-select-container">
                            <div class="tags-input-wrapper" id="warehouse-tags-wrapper">
                                <input type="text" class="search-input" id="warehouse-search" placeholder="Search warehouses...">
                            </div>
                            <div class="custom-dropdown" id="warehouse-results"></div>
                        </div>
                    </div>
                </div>

                <table class="stock-table" id="stock-table">
                    <thead id="stock-table-head">
                        <tr>
                            <th>Item Name</th>
                            <!-- Warehouse columns will appear here -->
                            <th style="width: 48px;"></th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body">
                        <!-- Rows will be rendered here -->
                    </tbody>
                </table>

                <div style="margin-top: 16px;">
                    <button class="btn-add-row" id="add-row-btn">
                        <i class="fa fa-plus"></i> Add New Item
                    </button>
                </div>
            </div>
		</div>
	`;

	$container.append(table_html);

    // --- Multi-Select Logic ---
    let company_selection = new Set();
    let warehouse_selection = new Set();
    let warehouse_cache = []; // Store all warehouses to filter locally

    const setupMultiSelect = (type, doctype, defaultVal = null, onChange = null) => {
        let all_data = [];
        let selected = (type === 'company') ? company_selection : warehouse_selection;
        const $wrapper = $(`#${type}-tags-wrapper`);
        const $search = $(`#${type}-search`);
        const $results = $(`#${type}-results`);

        const render_tags = () => {
            $wrapper.find('.tag').remove();
            selected.forEach(val => {
                const tag = $(`
                    <div class="tag" data-val="${val}">
                        ${val}
                        <span class="tag-remove"><i class="fa fa-times"></i></span>
                    </div>
                `);
                tag.insertBefore($search);
            });
            $results.find('.dropdown-item').each(function() {
                $(this).toggleClass('selected', selected.has($(this).data('val')));
            });
            if (onChange) onChange(Array.from(selected));
        };

        const filter_results = (query) => {
            $results.empty();
            let data_to_filter = all_data;

            // SPECIAL LOGIC: Filter warehouses based on selected companies
            if (type === 'warehouse' && company_selection.size > 0) {
                const companies = Array.from(company_selection);
                data_to_filter = warehouse_cache
                    .filter(w => companies.includes(w.company))
                    .map(w => w.name);
            }

            const filtered = data_to_filter.filter(v => v.toLowerCase().includes(query.toLowerCase()));
            if (filtered.length > 0) {
                filtered.forEach(val => {
                    const is_selected = selected.has(val);
                    $results.append(`
                        <div class="dropdown-item ${is_selected ? 'selected' : ''}" data-val="${val}">
                            ${val} ${is_selected ? '<i class="fa fa-check pull-right" style="margin-top: 3px;"></i>' : ''}
                        </div>
                    `);
                });
                $results.show();
            } else {
                $results.hide();
            }
        };

        const load_data = () => {
            let call_args = { doctype, fields: ["name"], limit_page_length: 500 };
            if (type === 'warehouse') call_args.fields.push("company");

            frappe.call({
                method: "frappe.client.get_list",
                args: call_args,
                callback: (r) => {
                    if (r.message) {
                        if (type === 'warehouse') {
                            warehouse_cache = r.message;
                            all_data = r.message.map(d => d.name);
                        } else {
                            all_data = r.message.map(d => d.name);
                        }

                        if (defaultVal) {
                            selected.add(defaultVal);
                            render_tags();
                        }
                    }
                }
            });
        };

        load_data();

        $search.on('focus input', function() { filter_results($(this).val()); });
        $results.on('click', '.dropdown-item', function() {
            const val = $(this).data('val');
            if (!selected.has(val)) {
                selected.add(val);
                $search.val('').focus();
                filter_results('');
                render_tags();
            }
        });
        $wrapper.on('click', '.tag-remove', function(e) {
            e.stopPropagation();
            const val = $(this).parent().data('val');
            selected.delete(val);
            render_tags();
        });
        $wrapper.on('click', () => $search.focus());

        // Return a way to trigger filtering from outside
        return { filter_results, render_tags, selected };
    };

    let current_warehouses = [];

    const updateTableHeaders = (warehouses) => {
        current_warehouses = warehouses;
        const $head = $('#stock-table-head tr');
        $head.empty();
        $head.append('<th>Item Name</th>');
        warehouses.forEach(w => {
            $head.append(`<th style="min-width: 120px;">${w}</th>`);
        });
        $head.append('<th style="width: 48px;"></th>');
        
        // Refresh rows to match new columns
        $('#stock-table-body').empty();
        add_row();
    };

    // Initialize Multi-selects
    const warehouse_control = setupMultiSelect('warehouse', 'Warehouse', null, (warehouses) => {
        updateTableHeaders(warehouses);
    });

    setupMultiSelect('company', 'Company', frappe.defaults.get_user_default('company'), (companies) => {
        // When companies change, we need to:
        // 1. Remove selected warehouses that don't belong to these companies
        if (companies.length > 0) {
            warehouse_selection.forEach(w_name => {
                const w_data = warehouse_cache.find(w => w.name === w_name);
                if (w_data && !companies.includes(w_data.company)) {
                    warehouse_selection.delete(w_name);
                }
            });
        }
        // 2. Refresh warehouse tags and table
        warehouse_control.render_tags();
    });

    let all_items = [];
    frappe.call({
        method: "frappe.client.get_list",
        args: { doctype: "Item", fields: ["name", "item_name"], limit_page_length: 5000 },
        callback: (r) => { if (r.message) all_items = r.message; }
    });

    $(document).on('click', (e) => {
        if (!$(e.target).closest('.multi-select-container').length) {
            $('.custom-dropdown').hide();
        }
        if (!$(e.target).closest('.item-select-container').length) {
            $('.item-results').hide();
        }
    });

    // Item search logic
    $container.on('focus input', '.item-input', function() {
        const $input = $(this);
        const $results = $input.siblings('.item-results');
        const query = $input.val().toLowerCase();
        
        const filtered = all_items.filter(i => 
            i.name.toLowerCase().includes(query) || 
            (i.item_name && i.item_name.toLowerCase().includes(query))
        );

        $results.empty();
        if (filtered.length > 0) {
            // Only render first 10 to keep the page smooth
            filtered.slice(0, 10).forEach(item => {
                const label = (item.item_name && item.item_name !== item.name) 
                    ? `${item.name} - ${item.item_name}` 
                    : item.name;
                $results.append(`<div class="dropdown-item" data-val="${item.name}">${label}</div>`);
            });
            if (filtered.length > 10) {
                $results.append(`<div class="dropdown-item disabled text-muted" style="font-style: italic; pointer-events: none; background: #f8fafc;">Type more to refine ${filtered.length - 10} more results...</div>`);
            }
            $results.show();
        } else {
            $results.hide();
        }
    });

    $container.on('click', '.item-results .dropdown-item', function() {
        const $item = $(this);
        const item_code = $item.data('val');
        const $row = $item.closest('tr');
        const $input_container = $item.closest('.item-select-container');
        
        $input_container.find('.item-input').val(item_code);
        $item.closest('.item-results').hide();

        // Fetch quantities for this item across all selected companies and warehouses
        const companies = Array.from(company_selection);
        const warehouses = current_warehouses;

        if (warehouses.length > 0) {
            // Set loading state
            $row.find('.qty-input').val('...').css('opacity', '0.5');

            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Bin",
                    filters: {
                        item_code: item_code,
                        warehouse: ["in", warehouses]
                    },
                    fields: ["warehouse", "actual_qty"]
                },
                callback: (r) => {
                    $row.find('.qty-input').css('opacity', '1');
                    const stock_map = {};
                    if (r.message) {
                        r.message.forEach(bin => {
                            stock_map[bin.warehouse] = bin.actual_qty;
                        });
                    }

                    // Fulfill the table columns
                    $row.find('.qty-input').each(function(index) {
                        const warehouse = warehouses[index];
                        const qty = stock_map[warehouse] || 0;
                        $(this).val(qty);
                        
                        // Optional: Highlight positive/negative stock
                        if (qty > 0) $(this).css('color', '#2f855a');
                        else if (qty < 0) $(this).css('color', '#c53030');
                        else $(this).css('color', '#718096');
                    });
                }
            });
        }
    });

	const add_row = () => {
		let warehouse_cols = '';
        current_warehouses.forEach(w => {
            warehouse_cols += `<td><input type="number" class="form-control-custom qty-input" value="0" readonly></td>`;
        });

		const row_html = `
			<tr>
				<td>
                    <div class="item-select-container">
                        <input type="text" class="form-control-custom item-input" placeholder="Search item...">
                        <div class="item-results"></div>
                    </div>
                </td>
				${warehouse_cols}
				<td><button class="btn-remove remove-row"><i class="fa fa-trash"></i></button></td>
			</tr>
		`;
		$('#stock-table-body').append(row_html);
	};

	// Event listener for Add Row button
	$container.find('#add-row-btn').on('click', () => {
		add_row();
	});

	// Event listener for Remove Row button (using delegation)
	$container.on('click', '.remove-row', function() {
		$(this).closest('tr').remove();
	});
};