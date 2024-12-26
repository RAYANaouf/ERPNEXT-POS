pos_ar.PointOfSale.pos_unsynced_cart = class {

    constructor(
        wrapper,
        db
    ){
        this.wrapper   = wrapper;
        this.db        = db;

        //local data
        this.invoices = [];
        this.filter = 'All';
        this.selectedInvoice = null;
        this.search_value = '';

        this.start_work();
    }

    /****************************************    INIT    *******************************************************/
    async start_work() {
        this.prepare_unsynced_pos_cart();
        await this.getAllUnsyncedInvoices();
        this.setListeners();
    }

    /****************************************    UI    *******************************************************/
    prepare_unsynced_pos_cart() {
        this.wrapper.find('#LeftSection').append('<div id="unsyncedPosLeftContainer" class="columnBox" style="display:none;"></div>')
        this.wrapper.find('#RightSection').append('<div id="unsyncedPosRightContainer" class="columnBox" style="display:none;"></div>')

        this.left_container = this.wrapper.find('#unsyncedPosLeftContainer')
        this.right_container = this.wrapper.find('#unsyncedPosRightContainer')

        ///////////////////right section
        this.right_container.append(`<div id="unsyncedRightContainerHeader" class="rowBox align_center"><h4 class="CartTitle">Unsynced Invoices</h4></div>`)
        
        //search and filter
        this.right_container.append('<div id="unsyncedRightSearchContainer" class="rowBox align_center"></div>');
        this.search_container = this.right_container.find('#unsyncedRightSearchContainer');
        
        this.search_container.append('<select id="unsyncedFilterInput" placeholder="Filter Status">');
        this.filter_input = this.search_container.find("#unsyncedFilterInput")
        this.filter_input.append('<option value="All" selected>All</option><option value="Not Synced">Not Synced</option><option value="Failed">Failed</option>')
        
        this.search_container.append('<input type="text" id="unsyncedSearchInput" placeholder="Search by invoice number">');
        this.search_field = this.search_container.find("#unsyncedSearchInput")

        //invoice list
        this.right_container.append('<div id="unsyncedInvoiceList" class="columnBox"></div>')
        this.unsynced_invoice_list = this.right_container.find('#unsyncedInvoiceList')

        //////////////////now left section
        //header with status and amounts
        const header =
            '<div id="detailsUnsyncedHeader" class="rowBox">' +
                '<div class="c1 columnBox">' +
                    '<div id="unsyncedCustomer">Customer</div>' +
                    '<div id="unsyncedSoldBy"></div>' +
                    '<div id="unsyncedStatus" class="status"></div>' +
                '</div>' +
                '<div class="c2 columnBox">' +
                    '<div id="unsyncedCost">0,0000 DA</div>' +
                    '<div id="unsyncedId">ACC-PSINV-2024-ID</div>' +
                    '<div id="unsyncedRealId">POS realI</div>' +
                '</div>' +
            '</div>'
        this.left_container.append(header)
        this.details_unsynced_header = this.left_container.find('#detailsUnsyncedHeader')

        // invoice details content
        this.left_container.append('<div id="unsyncedContent" class="columnBox"></div>')
        this.unsyncedContent = this.left_container.find('#unsyncedContent')
        
        //items section
        this.unsyncedContent.append('<div id="unsyncedItemContainer"><div class="posSectionTitle">Items</div><div id="unsyncedItemList"></div></div>')
        this.itemContainer = this.unsyncedContent.find('#unsyncedItemContainer')
        this.itemList = this.itemContainer.find('#unsyncedItemList')

        //totals section
        this.unsyncedContent.append('<div id="unsyncedTotalsContainer"><div class="posSectionTitle">Totals</div><div id="unsyncedTotalList"></div></div>')
        this.totalsContainer = this.unsyncedContent.find('#unsyncedTotalsContainer')
        this.totalList = this.unsyncedContent.find('#unsyncedTotalList')

        //payments section
        this.unsyncedContent.append('<div id="unsyncedPaymentsContainer"><div class="posSectionTitle">Payments</div><div id="unsyncedMethodList"></div></div>')
        this.paymentsContainer = this.unsyncedContent.find('#unsyncedPaymentsContainer')
        this.methodList = this.unsyncedContent.find('#unsyncedMethodList')

        //action buttons
        this.left_container.append('<div id="unsyncedActionsContainer" class="rowBox align_content">' +
            '<div id="unsyncedRetryBtn" class="actionBtn rowBox centerItem">Retry Sync</div>' +
            '<div id="unsyncedViewBtn" class="actionBtn rowBox centerItem">View Details</div>' +
        '</div>')

        this.actionButtonsContainer = this.left_container.find('#unsyncedActionsContainer')
        this.retryButton = this.actionButtonsContainer.find('#unsyncedRetryBtn')
        this.viewButton = this.actionButtonsContainer.find('#unsyncedViewBtn')
    }

    refreshData() {
        this.unsynced_invoice_list.empty();
        
        console.log("refreshing unsynced invoice list" , this.invoices , "unsynced " , this.invoices.filter(invoice => !invoice.synced))
        const filteredList = this.invoices.filter(invoice => !invoice.synced)
        if (!filteredList.length) {
            this.unsynced_invoice_list.append('<div class="empty-state">No unsynced invoices found</div>');
            return;
        }

        console.log("filteredList : " , filteredList)

        filteredList.forEach(invoice => {
            console.log("invoice : " , invoice)
            const invoiceContainer = document.createElement('div');
            invoiceContainer.classList.add('posInvoiceContainer')
            invoiceContainer.classList.add('columnBox')
            invoiceContainer.classList.add('align_content')

            //line 1
            const l1 = document.createElement('div')
            l1.classList.add('l1')
            l1.classList.add('rowBox')
            l1.classList.add('align_content')

            const posName = document.createElement('div')
            posName.classList.add('posName')
            posName.textContent = invoice.name
            const posCost = document.createElement('div')
            posCost.classList.add('posCost')
            posCost.textContent = format_currency(invoice.grand_total, invoice.currency)

            l1.appendChild(posName)
            l1.appendChild(posCost)

            //line 2
            const l2 = document.createElement('div')
            l2.classList.add('l2')
            l2.classList.add('rowBox')
            l2.classList.add('align_content')

            //l2 customer
            const customer = document.createElement('div')
            customer.classList.add('customer')
            customer.classList.add('rowBox')
            customer.classList.add('align_content')

            const customerLogo = document.createElement('img')
            customerLogo.src = '/assets/pos_ar/images/customer.png'
            customerLogo.width = 16
            customerLogo.height = 16
            customerLogo.classList.add('customerLogo')

            const customerName = document.createElement('div')
            customerName.textContent = invoice.customer || 'Guest'
            customerName.classList.add('customerName')

            customer.appendChild(customerLogo)
            customer.appendChild(customerName)

            l2.appendChild(customer)

            //l2 status
            const status = document.createElement('div')
            status.classList.add('status')
            status.classList.add(invoice.status.toLowerCase().replace(' ', '-'))
            status.textContent = invoice.status
            l2.appendChild(status)

            //add all to container
            invoiceContainer.appendChild(l1)
            invoiceContainer.appendChild(l2)

            invoiceContainer.addEventListener('click', () => {
                this.selectedInvoice = invoice;
                this.refreshInvoiceDetails();
                this.unsynced_invoice_list.find('.posInvoiceContainer').removeClass('selected');
                $(invoiceContainer).addClass('selected');
            })

            this.unsynced_invoice_list.append(invoiceContainer);
        });

        //refresh details if needed
        if (this.selectedInvoice) {
            this.refreshInvoiceDetails();
        }
    }

    refreshInvoiceDetails() {
        if (!this.selectedInvoice) {
            this.unsyncedContent.addClass('d-none');
            return;
        }

        this.unsyncedContent.removeClass('d-none');
        
        //update header
        const header = this.details_unsynced_header;
        header.find('#unsyncedCustomer').text(this.selectedInvoice.customer || 'Guest');
        header.find('#unsyncedSoldBy').text(this.selectedInvoice.owner);
        header.find('#unsyncedStatus').text(this.selectedInvoice.status)
            .removeClass('not-synced failed')
            .addClass(this.selectedInvoice.status.toLowerCase().replace(' ', '-'));
        header.find('#unsyncedCost').text(format_currency(this.selectedInvoice.grand_total, this.selectedInvoice.currency));
        header.find('#unsyncedId').text(this.selectedInvoice.name);
        header.find('#unsyncedRealId').text(this.selectedInvoice.pos_profile);

        //update items
        this.itemList.empty();
        this.selectedInvoice.items.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.classList.add('itemRow', 'rowBox');
            
            const itemName = document.createElement('div');
            itemName.classList.add('itemName');
            itemName.textContent = item.item_name;
            
            const itemQty = document.createElement('div');
            itemQty.classList.add('itemQty');
            itemQty.textContent = item.qty;
            
            const itemRate = document.createElement('div');
            itemRate.classList.add('itemRate');
            itemRate.textContent = format_currency(item.rate, this.selectedInvoice.currency);
            
            const itemAmount = document.createElement('div');
            itemAmount.classList.add('itemAmount');
            itemAmount.textContent = format_currency(item.amount, this.selectedInvoice.currency);
            
            itemRow.appendChild(itemName);
            itemRow.appendChild(itemQty);
            itemRow.appendChild(itemRate);
            itemRow.appendChild(itemAmount);
            
            this.itemList.append(itemRow);
        });

        //update totals
        this.totalList.empty();
        const totalRow = document.createElement('div');
        totalRow.classList.add('totalRow', 'rowBox');
        
        const totalLabel = document.createElement('div');
        totalLabel.classList.add('totalLabel');
        totalLabel.textContent = 'Grand Total';
        
        const totalAmount = document.createElement('div');
        totalAmount.classList.add('totalAmount');
        totalAmount.textContent = format_currency(this.selectedInvoice.grand_total, this.selectedInvoice.currency);
        
        totalRow.appendChild(totalLabel);
        totalRow.appendChild(totalAmount);
        this.totalList.append(totalRow);

        //update payments
        this.methodList.empty();
        this.selectedInvoice.payments.forEach(payment => {
            const paymentRow = document.createElement('div');
            paymentRow.classList.add('paymentRow', 'rowBox');
            
            const paymentMode = document.createElement('div');
            paymentMode.classList.add('paymentMode');
            paymentMode.textContent = payment.mode_of_payment;
            
            const paymentAmount = document.createElement('div');
            paymentAmount.classList.add('paymentAmount');
            paymentAmount.textContent = format_currency(payment.amount, this.selectedInvoice.currency);
            
            paymentRow.appendChild(paymentMode);
            paymentRow.appendChild(paymentAmount);
            
            this.methodList.append(paymentRow);
        });
    }

    show_cart() {
        this.left_container.css("display", "flex");
        this.right_container.css("display", "flex");
        this.getAllUnsyncedInvoices();
    }

    hide_cart() {
        this.left_container.css("display", "none");
        this.right_container.css("display", "none");
    }

    async getAllUnsyncedInvoices() {
        this.invoices = await this.db.getAllPosInvoice()
        this.refreshData();
    }

    async retrySync(invoice_name) {
        try {
            const result = await frappe.call({
                method: 'pos_ar.pos_ar.page.pos.pos.retry_sync_invoice',
                args: {
                    invoice_name: invoice_name
                }
            });

            if (result.message) {
                frappe.show_alert({
                    message: __('Invoice synced successfully'),
                    indicator: 'green'
                });
                this.getAllUnsyncedInvoices();
            }
        } catch (error) {
            console.error('Error retrying sync:', error);
            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Failed to sync invoice')
            });
        }
    }

    setListeners() {
        this.filter_input.on('change', () => {
            this.filter = this.filter_input.val();
            this.refreshData();
        });

        this.search_field.on('input', () => {
            this.search_value = this.search_field.val();
            this.refreshData();
        });

        this.retryButton.on('click', () => {
            if (this.selectedInvoice) {
                this.retrySync(this.selectedInvoice.name);
            }
        });

        this.viewButton.on('click', () => {
            if (this.selectedInvoice) {
                frappe.set_route('Form', 'POS Invoice', this.selectedInvoice.name);
            }
        });
    }
}