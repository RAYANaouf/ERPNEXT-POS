frappe.pages['testt'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Stock Quantities',
		single_column: true
	});

	const $container = $(wrapper).find('.layout-main-section');
	$container.empty();

	const table_html = `
		<div class="testt-wrapper" style="padding: 30px; max-width: 1000px; margin: 0 auto;">
            <style>
                .testt-wrapper {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .testt-card {
                    background: #fff;
                    border: 1px solid #ebeff2;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    padding: 24px;
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
                .company-dropdown {
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

                <div class="filter-section">
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        <span class="filter-label">Companies</span>
                        <div class="multi-select-container">
                            <div class="tags-input-wrapper" id="tags-wrapper">
                                <input type="text" class="search-input" id="company-search" placeholder="Type to search companies...">
                            </div>
                            <div class="company-dropdown" id="company-results">
                                <!-- Search results will appear here -->
                            </div>
                        </div>
                    </div>
                </div>

                <table class="stock-table" id="stock-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th style="width: 200px;">Quantity</th>
                            <th style="width: 48px;"></th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body">
                        <tr>
                            <td><input type="text" class="form-control-custom item-input" placeholder="e.g. Spare Parts"></td>
                            <td><input type="number" class="form-control-custom qty-input" value="0"></td>
                            <td><button class="btn-remove remove-row"><i class="fa fa-trash"></i></button></td>
                        </tr>
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

    let all_companies = [];
    let selected_companies = new Set();

    const render_tags = () => {
        const $wrapper = $('#tags-wrapper');
        $wrapper.find('.tag').remove();
        
        selected_companies.forEach(company => {
            const tag = $(`
                <div class="tag" data-company="${company}">
                    ${company}
                    <span class="tag-remove"><i class="fa fa-times"></i></span>
                </div>
            `);
            tag.insertBefore('#company-search');
        });

        // Update selected state in dropdown
        $('#company-results .dropdown-item').each(function() {
            const company = $(this).data('company');
            $(this).toggleClass('selected', selected_companies.has(company));
        });
    };

    const filter_results = (query) => {
        const $results = $('#company-results');
        $results.empty();
        
        const filtered = all_companies.filter(c => 
            c.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length > 0) {
            filtered.forEach(company => {
                const is_selected = selected_companies.has(company);
                $results.append(`
                    <div class="dropdown-item ${is_selected ? 'selected' : ''}" data-company="${company}">
                        ${company} ${is_selected ? '<i class="fa fa-check pull-right" style="margin-top: 3px;"></i>' : ''}
                    </div>
                `);
            });
            $results.show();
        } else {
            $results.hide();
        }
    };

    // Fetch companies for validation
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Company",
            fields: ["name"],
            limit_page_length: 500
        },
        callback: (r) => {
            if (r.message) {
                all_companies = r.message.map(c => c.name);
                // Set default
                const default_company = frappe.defaults.get_user_default('company');
                if (default_company) {
                    selected_companies.add(default_company);
                    render_tags();
                }
            }
        }
    });

    // Search behavior
    $('#company-search').on('focus input', function() {
        filter_results($(this).val());
    });

    $(document).on('click', (e) => {
        if (!$(e.target).closest('.multi-select-container').length) {
            $('#company-results').hide();
        }
    });

    $('#company-results').on('click', '.dropdown-item', function() {
        const company = $(this).data('company');
        if (!selected_companies.has(company)) {
            selected_companies.add(company);
            $('#company-search').val('').focus();
            filter_results('');
            render_tags();
        }
    });

    // Handle adding company via Enter key
    $('#company-search').on('keydown', function(e) {
        if (e.key === 'Enter') {
            const value = $(this).val().trim();
            if (!value) return;

            // Find exact match (case-insensitive)
            const matched_company = all_companies.find(c => c.toLowerCase() === value.toLowerCase());

            if (matched_company) {
                if (!selected_companies.has(matched_company)) {
                    selected_companies.add(matched_company);
                    $(this).val('');
                    render_tags();
                } else {
                    frappe.show_alert({message: __('Company already added'), indicator: 'orange'});
                    $(this).val('');
                }
            } else {
                frappe.show_alert({message: __('Invalid Company Name'), indicator: 'red'});
            }
        }
    });

    $('#tags-wrapper').on('click', '.tag-remove', function(e) {
        e.stopPropagation();
        const company = $(this).parent().data('company');
        selected_companies.delete(company);
        render_tags();
    });

    $('#tags-wrapper').on('click', () => {
        $('#company-search').focus();
    });

	const add_row = () => {
		const row_html = `
			<tr>
				<td><input type="text" class="form-control-custom item-input" placeholder="e.g. Spare Parts"></td>
				<td><input type="number" class="form-control-custom qty-input" value="0"></td>
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