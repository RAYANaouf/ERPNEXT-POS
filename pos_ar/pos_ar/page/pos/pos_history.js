pos_ar.PointOfSale.pos_history = class {

	constructor(
		wrapper,
		db,
		selectedPosProfile,
		appData,
		appSettings,
		company,
		salesTaxes,
		onClick
	) {
		this.wrapper = wrapper;
		this.db = db;
		this.selected_pos_profile = selectedPosProfile;
		this.app_data = appData;
		this.app_settings = appSettings;
		this.company = company;
		this.sales_taxes = salesTaxes;
		this.on_click = onClick;

		//local data
		this.localPosInvoice = { lastTime: null, pos_invoices: [] }
		this.filter = "";
		this.search_value = "";

		this.filtered_pos_list = [];
		this.selected_pos = null;

		this.start_work();
	}

	async start_work() {
		this.prepare_history_cart();
		const result = await this.db.getAllPosInvoice()

		this.localPosInvoice.pos_invoices = result;

		this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter(pos => {
			if (pos.status == 'Unpaid') {
				return true;
			} else {
				return false;
			}
		})
		console.log("log init data : ", this.filtered_pos_list)
		if (this.filtered_pos_list.length == 0) {
			this.selected_pos = null
		} else {
			this.selected_pos = structuredClone(this.filtered_pos_list[0])
		}
		this.refreshData()
		this.setListener();
	}


	/*************************************    UI    *******************************************************/

	prepare_history_cart() {
		this.wrapper.find('#LeftSection').append('<div id="historyLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="historyRightContainer" class="columnBox"></div>')

		this.left_container = this.wrapper.find('#historyLeftContainer')
		this.right_container = this.wrapper.find('#historyRightContainer')


		//pos details  the container of the pos details
		this.left_container.append('<div id="PosContentHeader" class="rowBox" ><div class="c1 columnBox"><div id="posCustomer">Customer</div><div id="posSoldBy"></div><div id="posStatus" class="Paid"></div></div><div class="c2 columnBox"><div id="posCost">0,0000 DA</div><div id="posId">ACC-PSINV-2024-ID</div><div id="posRealId">POS realI</div></div></div>')

		//first this.selected_pos.taxes_and_charges = ""section is the header information
		this.pos_header = this.left_container.find('#PosContentHeader');

		this.left_container.append('<div id="posContent" class="columnBox"></div>')

		//second section is the data like items , cost and payments methods.
		this.pos_content = this.left_container.find('#posContent')
		this.pos_content.append('<div id="posItemContainer"><div class="posSectionTitle">Items</div><div id="posItemList"></div></div>')

		this.itemContainer = this.pos_content.find('#posItemContainer')
		this.itemList = this.itemContainer.find('#posItemList')

		this.pos_content.append('<div id="posTotalsContainer"><div class="posSectionTitle">Totals</div><div id="posTotalList"></div></div>')

		this.totalsContainer = this.pos_content.find('#posTotalsContainer')
		this.totalList = this.pos_content.find('#posTotalList')

		this.pos_content.append('<div id="posPaymentsContainer"><div class="posSectionTitle">Payments</div><div id="posMethodList"></div></div>')

		this.paymentsContainer = this.pos_content.find('#posPaymentsContainer')
		this.methodList = this.pos_content.find('#posMethodList')

		this.left_container.append('<div id="posActionsContainer" class="rowBox align_content"  style="display = none ;" > <div id="posPrintBtn" class="actionBtn rowBox centerItem"> Print Receipt </div>  <div id="posDuplicateBtn" class="actionBtn rowBox centerItem"> Duplicate </div>   <div id="posReturnBtn" class="actionBtn rowBox centerItem"> Return </div>  </div>')
		this.left_container.append('<div id="posDraftActionsContainer" class="rowBox align_content" style="display = none ;"> <div id="posEditBtn" class="actionBtn rowBox centerItem"> Edit Invoice </div>  <div id="posDeleteBtn" class="actionBtn rowBox centerItem"> Delete Invoice </div>  </div>')

		//third and last section is the action buttons
		this.actionButtonsContainer = this.left_container.find('#posActionsContainer')
		this.printBtn = this.actionButtonsContainer.find('#posPrintBtn')
		this.duplicateBtn = this.actionButtonsContainer.find('#posDuplicateBtn')
		this.returnBtn = this.actionButtonsContainer.find('#posReturnBtn')

		this.draftActionButtonsContainer = this.left_container.find('#posDraftActionsContainer')
		this.deleteBtn = this.draftActionButtonsContainer.find('#posDeleteBtn')
		this.editBtn = this.draftActionButtonsContainer.find('#posEditBtn')


		this.right_container.append(`<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4></div>`)
		this.right_container.append('<div id="historyRightSearchContainer" class="rowBox align_center" ></div>');

		this.search_container = this.right_container.find('#historyRightSearchContainer');
		this.search_container.append('<select  id="PosInvoiceTypeInput" placeholder="POS Invoice Type">');

		this.filter_input = this.search_container.find("#PosInvoiceTypeInput")
		this.filter_input.append('<option value="Draft">Draft</option><option value="Paid">Paid</option> <option value="Unpaid" selected>Unpaid</option>')

		this.search_container.append('<input type="text" id="historyInput" placeholder="Search by invoice id or custumer name">');
		this.search_field = this.search_container.find("#historyInput")

		this.right_container.append('<div id="historyRecentInvoicesContainer" ></div>');

		this.right_data_container = this.right_container.find('#historyRecentInvoicesContainer')
	}


	refreshData() {
		this.right_data_container.html('');

		this.filtered_pos_list.forEach(record => {

			const posContainer = document.createElement('div');
			posContainer.classList.add('posInvoiceContainer')
			posContainer.classList.add('columnBox')
			posContainer.classList.add('align_content')

			//line 1
			const l1 = document.createElement('div')
			l1.classList.add('l1')
			l1.classList.add('rowBox')
			l1.classList.add('align_content')

			const posName = document.createElement('div')
			posName.classList.add('posName')
			posName.textContent = record.refNum

			const posCost = document.createElement('div')
			posCost.classList.add('posCost')
			posCost.textContent = record.paid_amount + " DA" ?? 0 + " DA"

			l1.appendChild(posName)
			if (record.consolidated_invoice) {
				const consolidatedFlag = document.createElement('div')
				consolidatedFlag.classList.add('consolidated-flag')
				consolidatedFlag.style.margin = '0 8px 0 8px'
				consolidatedFlag.innerHTML = `Consolidated`
				l1.appendChild(consolidatedFlag)
			}
			l1.appendChild(posCost)

			///////////// line 2
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
			customerLogo.src = '/assets/pos_ar/images/customer.png';
			customerLogo.width = 16;
			customerLogo.height = 16;
			customerLogo.classList.add('customerLogo');

			const customerName = document.createElement('div')
			customerName.textContent = record.customer
			customerName.classList.add('customerName');

			customer.appendChild(customerLogo);
			customer.appendChild(customerName);

			l2.appendChild(customer);

			//l2 creation time
			const creationTime = document.createElement('div')
			creationTime.textContent = record.creation_time
			l2.appendChild(creationTime);

			posContainer.appendChild(l1)
			posContainer.appendChild(l2)

			posContainer.addEventListener('click', () => {
				console.log('click', record)
				this.selected_pos = record
				this.refreshPosDetailsData();
			})

			this.right_data_container.append(posContainer);
		})


		//dont forget to refresh the details cart view because the selected pos may change
		this.refreshPosDetailsData();

	}



	refreshPosDetailsData() {

		/******************  check if there is a selected one *********************/
		// render the empty page or the selected pos details.
		if (this.selected_pos == null) {
			this.setEmpty();
			return;
		} else {
			this.setData();
		}

		this.pos_header.find('#posCustomer').text(this.selected_pos.customer ?? "CustomerName")
		//this.pos_header.find('#posSoldBy').text('Sold By : ' + this.selected_pos.owner?? "saler")
		//it is not the paid amount it should be the total invoice amount
		this.pos_header.find('#posCost').text(this.selected_pos.paid_amount + " DA" ?? 0 + " DA")
		this.pos_header.find('#posId').text(this.selected_pos.refNum ?? "POS Invoice CachId")

		this.pos_header.find('#posRealId').text(this.selected_pos.real_name ?? "")

		this.pos_header.find('#posStatus').text(this.selected_pos.status)
		this.pos_header.find('#posStatus').removeClass().addClass(`${this.selected_pos.status}`)

		// Add consolidated information if present
		if (this.selected_pos.consolidated_invoice) {
			if (!this.pos_header.find('#posConsolidated').length) {
				this.pos_header.find('.c1').append('<div id="posConsolidated" class="consolidated-info"></div>')
			}
			this.pos_header.find('#posConsolidated').html(`
                <span class="consolidated-label">Consolidated:</span>
                <span class="consolidated-value">${this.selected_pos.consolidated_invoice}</span>
            `)
		} else {
			this.pos_header.find('#posConsolidated').remove()
		}

		if (this.selected_pos.status == "Draft") {
			this.draftActionButtonsContainer.css('display', 'flex')
			this.actionButtonsContainer.css('display', 'none')
		} else {
			this.draftActionButtonsContainer.css('display', 'none')
			this.actionButtonsContainer.css('display', 'flex')
		}


		/**********************  items list ***************************/
		this.itemList.html('');
		this.selected_pos.items.forEach(item => {
			this.itemList.append(`<div class="rowBox align_item">    <div class="itemName rowBox align_center">${item.item_name}</div>   <div class="itemQuantity rowBox align_center">${item.qty}</div>   <div class="itemCost rowBox align_center">${item.qty * item.rate} DA</div>  </div>`)
		})


		/*********************  net ,  VAT  , Discount , Grand Total *******************/

		this.totalList.html('');


		//if there are no taxes we should show only the grand total

		/////net total
		let netTotal = 0;
		this.selected_pos.items.forEach(item => {
			netTotal += item.rate * item.qty
		})


		if (this.selected_pos.taxes_and_charges == "" || this.selected_pos.taxes_and_charges == null) {
			// grand otal
			this.totalList.append(`<div class="rowBox align_item"> <div class="grandTotalName rowBox align_center">Grand Total</div> <div class="grandTotalPrice rowBox align_center">${netTotal} DA</div> </div>`)
		} else {
			this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">Net Total</div> <div class="price rowBox align_center">${netTotal} DA</div> </div>`)
			let allTax = 0
			if (this.selected_pos.taxes_and_charges != "" && this.selected_pos.taxes_and_charges != null) {
				this.sales_taxes.forEach(tax => {
					allTax += (tax.rate / 100) * netTotal
					this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">${tax.description}</div> <div class="price rowBox align_center">${(tax.rate / 100) * netTotal} DA</div> </div>`)
				})
			}
			// grand otal
			this.totalList.append(`<div class="rowBox align_item"> <div class="grandTotalName rowBox align_center">Grand Total</div> <div class="grandTotalPrice rowBox align_center">${netTotal + allTax} DA</div> </div>`)
		}






		/***************************** payment methode list *********************************/
		this.methodList.html('')
		const payments = this.selected_pos.payments;

		if (payments != null && payments != "") {
			payments.forEach(method => {
				this.methodList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">${method.mode_of_payment}</div> <div class="price rowBox align_center">${method.amount} DA</div> </div>`)
			})
		}

	}



	//show and hide
	show_cart() {
		this.left_container.css('display', 'flex');
		this.right_container.css('display', 'flex');

		const filter = this.filter_input.val();

		//refrenshing data
		this.db.getAllPosInvoice_callback(
			(result) => {
				this.localPosInvoice.pos_invoices = result;
				this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter(pos => {

					if (pos.status == filter) {
						return true;
					}
					else {
						return false;
					}
				})

				if (this.filtered_pos_list.length == 0) {
					this.selected_pos = null
				}
				else {
					this.selected_pos = this.filtered_pos_list[0]
				}
				this.refreshData()
			}, (error) => {
				console.log(error)
			}
		)

	}

	//hide and hide
	hide_cart() {
		this.left_container.css('display', 'none');
		this.right_container.css('display', 'none');
	}


	//set empty
	setEmpty() {
		this.pos_header.css('display', 'none')
		this.pos_content.css('display', 'none')
		this.actionButtonsContainer.css('display', 'none')
		this.draftActionButtonsContainer.css('display', 'none')
	}

	//set data
	setData() {
		this.pos_header.css('display', 'flex')
		this.pos_content.css('display', 'flex')
	}



	/************************************* set listeners  ***********************************************/
	//set listeners
	setListener() {

		this.filter_input.on('input', (event) => {
			console.log("we are here1")
			this.filterList(this.search_field.val(), this.filter_input.val())
		});

		this.search_field.on('input', (event) => {
			console.log("we are here2")
			this.filterList(this.search_field.val(), this.filter_input.val())
		})

		this.deleteBtn.on('click', (event) => {
			this.db.deletePosInvoice_callback(
				this.selected_pos.name,
				(event) => {
					//remove the deleted one from the filtred list
					this.filtered_pos_list = this.filtered_pos_list.filter(pos => pos.name != this.selected_pos.name)
					//selected new pos
					if (this.filtered_pos_list.length > 0) {
						this.selected_pos = this.filtered_pos_list[0]
					}
					else {
						this.selected_pos = null;
					}
					this.refreshData()
				},
				(error) => {
					//error callback
					console.log("error on deleting the pos : ", error);
				}
			)
		})

		this.editBtn.on('click', (event) => {
			this.on_click('edit', this.selected_pos);
		})

		this.returnBtn.on('click', (event) => {
			console.log("returned invoice : ", this.selected_pos)
			this.on_click('return', this.selected_pos);
		})

		this.printBtn.on('click', (event) => {
			this.print_receipt(this.selected_pos)
		})

		this.duplicateBtn.on('click', (event) => {
			this.on_click('duplicate', this.selected_pos);
		})

	}

	/******************************************** functions  ********************************************************/


	filterList(search, filter) {
		console.log("log : ", this.filtered_pos_list)
		this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter(pos => {


			const matchesCustomer = (pos.customer || "").toLowerCase().includes(search.toLowerCase());
			const matchesRefNum = (pos.refNum || "").toLowerCase().includes(search.toLowerCase());
			const matchesName = (pos.real_name || "").toLowerCase().includes(search.toLowerCase());
			const matchesAll = search == "";
			const matchesFilter = pos.status == filter;

			return matchesFilter && (matchesCustomer || matchesRefNum || matchesName || matchesAll);
		})

		if (this.filtered_pos_list.length == 0) {
			this.selected_pos = null;
		} else {
			this.selected_pos = this.filtered_pos_list[0]
			console.log("debuging invoice : ", this.selected_pos, "and : ", this.filtered_pos_list)
		}
		this.refreshData();
	}



	
	 async print_receipt(pos) {
		try {
			if (!pos) {
				console.error("No POS data provided");
				frappe.throw(__("Error: No POS data available for printing"));
				return;
			}

			// Initialize totals
			const totals = {
				netTotal: 0,
				taxes: 0,
				grandTotal: 0,
				totalQty: 0,
				totalItems: 0
			};

			// Format number helper
			const formatNumber = (num) => {
				return new Intl.NumberFormat('fr-DZ', {
					minimumFractionDigits: 0,
					maximumFractionDigits: 0
				}).format(num);
			};

			// Get customer data
			const customer = this.app_data.appData.customers.find(customer => customer.name == pos.customer);
			if (!customer) {
				console.error("Customer not found:", pos.customer);
				frappe.throw(__("Error: Customer information not found"));
				return;
			}

			let ancien_sold = customer.custom_debt;
			if (this.app_settings.settings.onlineDebt) {
				ancien_sold = await this.app_data.fetchCustomerDebt(customer.name);
			}

			// Parse creation time
			const creation_time = pos.creation_time || pos.creation;
			if (!creation_time) {
				console.error("No creation time found in POS object");
				frappe.throw(__("Error: Invalid receipt date"));
				return;
			}
			const [date, time] = creation_time.split(' ');

			// Generate CSS styles
			const styles = `
				<style>
					@media print {
						@page {
							margin: 0;
							size: 80mm auto;
						}
						body {
							margin: 1mm;
						}
					}
					body {
						font-family: Arial, sans-serif;
						line-height: 1.4;
						color: #000;
					}
					.receipt-container {
						max-width: 80mm;
						margin: 0 auto;
						padding: 1px;
					}
					.logo-container {
						text-align: center;
						margin-bottom: 10px;
						margin-top: 10px;
					}
					.logo-container img {
						width:90%;
						height: auto;
					}
					.company-name {
						text-align: center;
						font-size: 16px;
						font-weight: bold;
						margin: 10px 0;
					}
					.receipt-header {
						margin: 10px 0;
						padding: 5px 0;
						border-top: 1px dashed #000;
						border-bottom: 1px dashed #000;
					}
					.customer-info {
						margin-bottom: 10px;
					}
					.receipt-table {
						width: 100%;
						border-collapse: collapse;
						margin: 10px 0;
					}
					.receipt-table th {
						border-bottom: 1px solid #000;
						padding: 5px;
						text-align: left;
						font-size: 12px;
					}
					.receipt-table td {
						padding: 5px;
						font-size: 12px;
						border-bottom: 1px dotted #ccc;
					}
					.totals {
						margin: 10px 0;
						text-align: left;
						font-size: 14px;
					}
					.receipt-footer {
						margin-top: 20px;
						text-align: center;
						font-size: 12px;
						border-top: 1px dashed #000;
						padding-top: 10px;
					}
					.bold {
						font-weight: bold;
					}
					.text-right {
						text-align: right;
					}
				</style>
			`;

			// Generate receipt HTML
			let receiptHTML = `
				${styles}
				<div class="receipt-container">
					<div class="logo-container">
						<img src="/assets/pos_ar/images/logo.jpg" alt="Company Logo">
					</div>
					<div class="company-name">${this.company.company_name}</div>
					
					<div class="receipt-header">
						<div class="customer-info">
							<div class="bold">Client: ${pos.customer}</div>
							<div style="font-size:10px;">Commande: ${pos.refNum}</div>
							<div style="font-size:10px;">Date: ${date}</div>
							<div style="font-size:10px;">Heure: ${time}</div>
						</div>
					</div>

					<table class="receipt-table">
						<thead>
							<tr>
								<th>Article</th>
								<th class="text-right">Qté</th>
								<th class="text-right">Prix</th>
								<th class="text-right">Total</th>
							</tr>
						</thead>
						<tbody>
			`;

			// Add items to receipt
			pos.items.forEach(item => {
				const itemTotal = item.rate * item.qty;
				totals.netTotal += itemTotal;
				totals.totalQty += item.qty;
				totals.totalItems += 1;

				receiptHTML += `
					<tr>
						<td>${item.item_name}</td>
						<td class="text-right">${item.qty}</td>
						<td class="text-right">${formatNumber(item.rate)}</td>
						<td class="text-right">${formatNumber(itemTotal)}</td>
					</tr>
				`;
			});

			// Calculate final totals
			const discount = pos.additional_discount_percentage ? (totals.netTotal * pos.additional_discount_percentage) : 0;
			totals.grandTotal = totals.netTotal - discount;




			// Add totals section
			receiptHTML += `
						</tbody>
					</table>

					<div class="totals" style="text-align:left;">
						<div>Quantité Totale: ${totals.totalQty}</div>
						 <div>Remise: ${formatNumber(discount)} DA</div>
						<div style="margin-top:15px; text-align:left;">
							<div class="bold" style="display:flex; align-items:center; font-size:18px;">
								<div style="width:120px; font-size:18px;">Total:</div>
								<div style="flex-grow:1; text-align:center; font-size:18px;">${formatNumber(totals.grandTotal)} DA</div>
							</div>
							<div style="display:flex; align-items:center; font-size:14px;">
								<div style="width:120px; font-size:14px;">Total Solde:</div>
								<div style="flex-grow:1; text-align:center; font-size:14px;">${formatNumber(ancien_sold)} DA</div>
							</div>
						</div>
					</div>

					<div class="receipt-footer">
						<div>Merci de votre visite!</div>
						<div>${this.company.company_name}</div>
					</div>
				</div>
			`;

			// Print the receipt
			const printWindow = window.open('', '_blank');
			if (!printWindow) {
				frappe.throw(__("Error: Popup blocked. Please allow popups for printing."));
				return;
			}

			printWindow.document.write(receiptHTML);
			printWindow.document.close();

			// Wait for images to load before printing
			printWindow.onload = () => {
				setTimeout(() => {
					printWindow.focus();
					printWindow.print();
					printWindow.close();
				}, 250); // Small delay to ensure styles are applied
			};

		} catch (error) {
			console.error("Error printing receipt:", error);
			frappe.throw(__("Error printing receipt. Please try again."));
		}
	}
}
