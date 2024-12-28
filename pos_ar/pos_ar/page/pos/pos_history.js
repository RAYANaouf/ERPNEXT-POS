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
	){
		this.wrapper               = wrapper     ;
		this.db                    = db          ;
		this.selected_pos_profile  = selectedPosProfile;
		this.app_data              = appData     ;
		this.app_settings          = appSettings ;
		this.company               = company     ;
		this.sales_taxes           = salesTaxes  ;
		this.on_click              = onClick     ;

		//local data
		this.localPosInvoice   = { lastTime : null , pos_invoices : [] }
		this.filter            = "" ;
		this.search_value      = "" ;

		this.filtered_pos_list = [] ;
		this.selected_pos      = null ;

		this.start_work();
	}

	async start_work(){
		this.prepare_history_cart();
		const result = await this.db.getAllPosInvoice()

		this.localPosInvoice.pos_invoices = result ;

		this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter( pos => {
			if(pos.status == 'Unpaid' ){
				return true ;
			}else{
				return false ;
			}
		})
		console.log("log init data : " , this.filtered_pos_list)
		if(this.filtered_pos_list.length == 0){
			this.selected_pos = null
		}else{
			this.selected_pos = structuredClone(this.filtered_pos_list[0])
		}
		this.refreshData()
		this.setListener();
	}


	/*************************************    UI    *******************************************************/

	prepare_history_cart(){
		this.wrapper.find('#LeftSection').append('<div id="historyLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="historyRightContainer" class="columnBox"></div>')

		this.left_container  = this.wrapper.find('#historyLeftContainer')
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
		this.itemList      = this.itemContainer.find('#posItemList')

		this.pos_content.append('<div id="posTotalsContainer"><div class="posSectionTitle">Totals</div><div id="posTotalList"></div></div>')

		this.totalsContainer = this.pos_content.find('#posTotalsContainer')
		this.totalList       = this.pos_content.find('#posTotalList')

		this.pos_content.append('<div id="posPaymentsContainer"><div class="posSectionTitle">Payments</div><div id="posMethodList"></div></div>')

		this.paymentsContainer = this.pos_content.find('#posPaymentsContainer')
		this.methodList        = this.pos_content.find('#posMethodList')

		this.left_container.append('<div id="posActionsContainer" class="rowBox align_content"  style="display = none ;" > <div id="posPrintBtn" class="actionBtn rowBox centerItem"> Print Receipt </div>  <div id="posDuplicateBtn" class="actionBtn rowBox centerItem"> Duplicate </div>   <div id="posReturnBtn" class="actionBtn rowBox centerItem"> Return </div>  </div>')
		this.left_container.append('<div id="posDraftActionsContainer" class="rowBox align_content" style="display = none ;"> <div id="posEditBtn" class="actionBtn rowBox centerItem"> Edit Invoice </div>  <div id="posDeleteBtn" class="actionBtn rowBox centerItem"> Delete Invoice </div>  </div>')

		//third and last section is the action buttons
		this.actionButtonsContainer = this.left_container.find('#posActionsContainer')
		this.printBtn      = this.actionButtonsContainer.find('#posPrintBtn')
		this.duplicateBtn  = this.actionButtonsContainer.find('#posDuplicateBtn')
		this.returnBtn     = this.actionButtonsContainer.find('#posReturnBtn')

		this.draftActionButtonsContainer = this.left_container.find('#posDraftActionsContainer')
		this.deleteBtn  = this.draftActionButtonsContainer.find('#posDeleteBtn')
		this.editBtn    = this.draftActionButtonsContainer.find('#posEditBtn')


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


	refreshData(){
		this.right_data_container.html('');

		this.filtered_pos_list.forEach( record => {

			const posContainer = document.createElement('div');
			posContainer.classList.add('posInvoiceContainer')
			posContainer.classList.add('columnBox')
			posContainer.classList.add('align_content')

			//line 1
			const l1           = document.createElement('div')
			l1.classList.add('l1')
			l1.classList.add('rowBox')
			l1.classList.add('align_content')

			const posName      = document.createElement('div')
			posName.classList.add('posName')
			posName.textContent = record.refNum

			const posCost      = document.createElement('div')
			posCost.classList.add('posCost')
			posCost.textContent = record.paid_amount + " DA" ?? 0 + " DA"

			l1.appendChild(posName)
            l1.appendChild(posCost)

			///////////// line 2
			const l2           = document.createElement('div')
			l2.classList.add('l2')
			l2.classList.add('rowBox')
			l2.classList.add('align_content')

			//l2 customer
			const customer = document.createElement('div')
			customer.classList.add('customer')
			customer.classList.add('rowBox')
			customer.classList.add('align_content')

			const customerLogo  = document.createElement('img')
			customerLogo.src    = '/assets/pos_ar/images/customer.png' ;
			customerLogo.width  = 16 ;
			customerLogo.height = 16 ;
			customerLogo.classList.add('customerLogo');

			const customerName       = document.createElement('div')
			customerName.textContent = record.customer
			customerName.classList.add('customerName');

			customer.appendChild(customerLogo);
			customer.appendChild(customerName);

			l2.appendChild(customer);

			//l2 creation time
			const creationTime  = document.createElement('div')
			creationTime.textContent = record.creation_time
			l2.appendChild(creationTime);

			// Add l3 with consolidated flag and sales invoice if consolidated
			if (record.consolidated_invoice) {
                const l3 = document.createElement('div')
                l3.classList.add('l3')
                l3.classList.add('rowBox')
                l3.classList.add('align_content')

                const consolidatedFlag = document.createElement('div')
                consolidatedFlag.classList.add('consolidated-flag')
                consolidatedFlag.textContent = 'Consolidated'
                l3.appendChild(consolidatedFlag)

                const salesInvoice = document.createElement('div')
                salesInvoice.classList.add('sales-invoice')
                salesInvoice.textContent = record.consolidated_sales_invoice
                l3.appendChild(salesInvoice)

                posContainer.appendChild(l1)
                posContainer.appendChild(l3)
                posContainer.appendChild(l2)
            } else {
                posContainer.appendChild(l1)
                posContainer.appendChild(l2)
            }

			posContainer.addEventListener('click' , () => {
				console.log('click' , record)
				this.selected_pos = record
				this.refreshPosDetailsData();
			})

			this.right_data_container.append(posContainer);
		})


		//dont forget to refresh the details cart view because the selected pos may change
		this.refreshPosDetailsData();

	}



	refreshPosDetailsData(){

		/******************  check if there is a selected one *********************/
		// render the empty page or the selected pos details.
		if(this.selected_pos == null ){
			this.setEmpty();
			return;
		}else{
			this.setData();
		}

		this.pos_header.find('#posCustomer').text(this.selected_pos.customer?? "CustomerName")
		//this.pos_header.find('#posSoldBy').text('Sold By : ' + this.selected_pos.owner?? "saler")
		//it is not the paid amount it should be the total invoice amount
		this.pos_header.find('#posCost').text(this.selected_pos.paid_amount +" DA" ??0 + " DA")
		this.pos_header.find('#posId').text(this.selected_pos.refNum?? "POS Invoice CachId")

		this.pos_header.find('#posRealId').text(this.selected_pos.real_name ?? "")

		this.pos_header.find('#posStatus').text(this.selected_pos.status)
		this.pos_header.find('#posStatus').removeClass().addClass(`${this.selected_pos.status}`)

		if(this.selected_pos.status == "Draft"){
			this.draftActionButtonsContainer.css('display' , 'flex')
			this.actionButtonsContainer.css('display' , 'none')
		}else{
			this.draftActionButtonsContainer.css('display' , 'none')
			this.actionButtonsContainer.css('display' , 'flex')
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
		let netTotal = 0 ;
		this.selected_pos.items.forEach(item => {
			netTotal += item.rate * item.qty
		})


		if(this.selected_pos.taxes_and_charges == "" || this.selected_pos.taxes_and_charges == null){
			// grand otal
			this.totalList.append(`<div class="rowBox align_item"> <div class="grandTotalName rowBox align_center">Grand Total</div> <div class="grandTotalPrice rowBox align_center">${netTotal} DA</div> </div>`)
		}else{
			this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">Net Total</div> <div class="price rowBox align_center">${netTotal} DA</div> </div>`)
			let allTax = 0
			if(this.selected_pos.taxes_and_charges != "" && this.selected_pos.taxes_and_charges != null){
				this.sales_taxes.forEach( tax =>{
					allTax += (tax.rate/100) * netTotal
					this.totalList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">${tax.description}</div> <div class="price rowBox align_center">${(tax.rate/100) * netTotal} DA</div> </div>`)
				})
			}
			// grand otal
			this.totalList.append(`<div class="rowBox align_item"> <div class="grandTotalName rowBox align_center">Grand Total</div> <div class="grandTotalPrice rowBox align_center">${netTotal + allTax} DA</div> </div>`)
		}






		/***************************** payment methode list *********************************/
		this.methodList.html('')
		const payments = this.selected_pos.payments ;

		if(payments != null && payments != ""){
			payments.forEach( method => {
				this.methodList.append(`<div class="rowBox align_item"> <div class="name rowBox align_center">${method.mode_of_payment}</div> <div class="price rowBox align_center">${method.amount} DA</div> </div>`)
			})
		}

	}



	//show and hide
	show_cart(){
		this.left_container.css('display' , 'flex');
		this.right_container.css('display' , 'flex');

		const filter = this.filter_input.val();

		//refrenshing data
		this.db.getAllPosInvoice_callback(
						(result)=>{
							this.localPosInvoice.pos_invoices = result ;
							this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter( pos => {

								if(pos.status == filter ){
									return true ;
								}
								else{
									return false ;
								}
							})

							if(this.filtered_pos_list.length == 0){
								this.selected_pos = null
							}
							else{
								this.selected_pos = this.filtered_pos_list[0]
							}
							this.refreshData()
						},(error) => {
							console.log(error)
						}
		)

	}

	//hide and hide
	hide_cart(){
		this.left_container.css('display' , 'none');
		this.right_container.css('display' , 'none');
	}


	//set empty
	setEmpty(){
		this.pos_header.css('display' , 'none')
		this.pos_content.css('display' , 'none')
		this.actionButtonsContainer.css('display' , 'none')
		this.draftActionButtonsContainer.css('display' , 'none')
	}

	//set data
	setData(){
		this.pos_header.css('display' , 'flex')
		this.pos_content.css('display' , 'flex')
	}



	/************************************* set listeners  ***********************************************/
	//set listeners
	setListener(){

		this.filter_input.on('input' , (event) => {
			console.log("we are here1")
			this.filterList( this.search_field.val() , this.filter_input.val())
		});

		this.search_field.on('input' , (event) =>{
			console.log("we are here2")
			this.filterList( this.search_field.val() , this.filter_input.val())
		})

		this.deleteBtn.on('click' , (event)=>{
			this.db.deletePosInvoice_callback(
				this.selected_pos.name,
				(event)=>{
					//remove the deleted one from the filtred list
					this.filtered_pos_list = this.filtered_pos_list.filter(pos => pos.name != this.selected_pos.name)
					//selected new pos
					if(this.filtered_pos_list.length > 0){
						this.selected_pos = this.filtered_pos_list[0]
					}
					else{
						this.selected_pos = null ;
					}
					this.refreshData()
				},
				(error)=>{
					//error callback
					console.log("error on deleting the pos : " , error);
				}
			)
		})

		this.editBtn.on('click' , (event)=>{
			this.on_click('edit' , this.selected_pos );
		})

		this.returnBtn.on('click' , (event)=>{
			console.log("returned invoice : " , this.selected_pos)
			this.on_click('return' , this.selected_pos );
		})

		this.printBtn.on('click' , (event)=>{
			this.print_receipt(this.selected_pos)
		})

		this.duplicateBtn.on('click' , (event)=>{
			this.on_click('duplicate' , this.selected_pos );
		})

	}

	/******************************************** functions  ********************************************************/


	filterList(search , filter){
		console.log("log : " , this.filtered_pos_list)
		this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter( pos => {


			const matchesCustomer  = (pos.customer  || "" ).toLowerCase().includes(search.toLowerCase());
			const matchesRefNum    = (pos.refNum    || "" ).toLowerCase().includes(search.toLowerCase());
			const matchesName      = (pos.real_name || "" ).toLowerCase().includes(search.toLowerCase());
			const matchesAll       = search == "" ;
			const matchesFilter    = pos.status == filter ;

			return matchesFilter && ( matchesCustomer || matchesRefNum  || matchesName ||  matchesAll );
		})

		if(this.filtered_pos_list.length == 0){
			this.selected_pos = null;
		}else{
			this.selected_pos = this.filtered_pos_list[0]
			console.log("debuging invoice : " , this.selected_pos , "and : " , this.filtered_pos_list)
		}
		this.refreshData();
	}


	async print_receipt(pos) {

		let netTotal   = 0
		let taxes      = 0
		let grandTotal = 0

		console.log("appData : " , this.app_data)
		let customer = this.app_data.appData.customers.find(customer => customer.name == pos.customer)

		let ancien_sold = customer.custom_debt;

		console.log("check the condition : " , this.app_settings.settings.onlineDebt )
		if(this.app_settings.settings.onlineDebt){
			ancien_sold = await this.app_data.fetchCustomerDebt(customer.name);
			console.log("the result id : " , ancien_sold)
		}

		const creation_time = pos.creation_time
		const [date, time]  = creation_time.split(' ')


		let invoiceHTML =
			'<style>'+
				'#company_container {'+
					'width: 100% ; height: 40px ; '+
					'display:flex; align-items:center; '+
					'font-size : 12px;'+
				'}'+
				'table{'+
					//'border: 1px solid #505050; border-spacing:0px;'+
					'width: 100%; margin-top:16px;'+
				'}'+
				'tr{'+
					'width:100%; height:16px;'+
				'}'+
				'tr:nth-child(1){'+
					''+
				'}'+
				'#first_row{'+
					'border: 5px solid black;'+
				'}'+
				'#logContainer{'+
					'width: 100%;height:80px;'+
					'display : flex;'+
					'justify-content:center;'+
				'}'+
				'#logContainer img{'+
					'width:50%; height:100%;'+
				'}'+
				'#top_data_container{'+
					'width:100%;display:flex;'+
				'}'+
				'#top_data_container>div.c1{'+
					'font-size:12px;flex-grow:1;'+
				'}'+
				'#top_data_container>div.c2{'+
					'font-size:12px;flex-grow:1;'+
					'display:flex;flex-direction:column;align-items:end;'+
				'}'+
				'td>div{'+
					'height:18px; width:100%;'+
					'font-size:12px;'+
					'display:flex; justify-content:start; align-items:center;'+
				'}'+
				'#footer_message{'+
					'height:20px;'+
				'}'+
				'</style>'+
				'<div style="display:flex; flex-direction:column;">'+
					'<div id="logContainer"  >'+
						'<div style="width:20%;"></div>'+
						'<img src="/assets/pos_ar/images/logo.jpg"  id="company_logo">'+
						'<div style="width:20%;"></div>'+
					'</div>'+
					'<div id="company_container">' +
						'<div style="flex-grow:1;"></div>'+
						`<p style="margin:0px 25px;">${this.company.company_name}</p>`+
						'<div style="flex-grow:1;"></div>'+
					'</div>'+
					'<div id="top_data_container">'+
						'<div class="c1">'+
							`<div class="customer" style="font-weight:600;font-size:18px;"> Customer : ${pos.customer} </div>`+
							`<div class="refrence"> Commande : ${pos.refNum} </div>`+
						'</div>'+
						'<div class="c2">'+
							`<div class="date"> ${date}/${time} </div>`+
						'</div>'+
					'</div>'+
					'<table>'+
						'<tr id="first_row" ><th style="boder:1px solid black;">Nom</th><th>Qté</th><th>Prix</th><th>Value</th>'

		pos.items.forEach(item => {
			netTotal    += item.rate * item.qty
			invoiceHTML += `<tr > <td ><div >${item.item_name}</div></td>  <td><div>${item.qty}</div></td>  <td><div>${item.rate}</div></td>  <td><div>${item.rate * item.qty}</div></td></tr>`
		})

			invoiceHTML += `<tr style="height:23px;font-size:12px;font-weight:700;" > <td colspan="3" ><div >      </div></td>   <td><div> ${netTotal+(netTotal*(taxes/100)) - pos.additional_discount_percentage * netTotal} DA </div></td></tr>`
			invoiceHTML += `<tr style="height:23px;font-size:12px;font-weight:700;" > <td colspan="3" ><div >Ancien Sold        </div></td>   <td><div> ${ancien_sold} DA </div></td></tr>`
			invoiceHTML += `<tr style="height:23px;font-size:12px;font-weight:700;" > <td colspan="3" ><div >Versement   </div></td>   <td><div> ${pos.total_customer_payment} DA </div></td></tr>`



		invoiceHTML += '</table>'

		/*

		invoiceHTML += `<div style="height:23px;"> <p style="font-size:12px;font-weight:500;" ><span style="font-size:12px;font-weight:600;">Sous-total : </span> ${netTotal} DA </p> </div>`
		invoiceHTML += `<div style="height:23px;"> <p style="font-size:12px;font-weight:500;" ><span style="font-size:12px;font-weight:600;">Reduction : </span> ${pos.additional_discount_percentage * netTotal} DA </p> </div>`

		this.sales_taxes.forEach(tax => {
			taxes += tax.rate
			invoiceHTML += `<div style="height:23px;"> <p style="font-size:12px;font-weight:500;" ><span style="font-size:12px;font-weight:600;">${tax.description} : </span> ${tax.rate} % </p> </div>`
		})

		invoiceHTML += `<div style="height:23px;"> <p style="font-size:12px;font-weight:500;" ><span style="font-size:12px;font-weight:600;">Total : </span> ${netTotal+(netTotal*(taxes/100)) - pos.additional_discount_percentage * netTotal} DA </p> </div>`
		*/

		invoiceHTML +=
		'<div id="footer_message" style="width:100%; display:flex; align-items:center; margin-top:30px;">'+
			'<div style="flex-grow:1;"></div>'+
			'<div style="margin:30px 25px;"> Thank You, Come Again</div>'+
			'<div style="flex-grow:1;"></div>'+
		'</div>'

		invoiceHTML += '</div>'



		// Open a new window and print the HTML content
		const printWindow = window.open('', '_blank');
		printWindow.document.write(invoiceHTML);
		printWindow.document.close();


		const logoImage = printWindow.document.getElementById('company_logo');
		logoImage.onload = () => {
			printWindow.focus();
			printWindow.print();
			printWindow.close();
		};




        }

}
