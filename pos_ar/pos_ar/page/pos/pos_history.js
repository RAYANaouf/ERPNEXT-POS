

pos_ar.PointOfSale.pos_history = class {

	constructor(
		wrapper,
		db
	){
		this.wrapper = wrapper;
		this.db      = db;


		//local data
		this.localPosInvoice   = { lastTime : null , pos_invoices : [] }
		this.filter            = "" ;
		this.filtered_pos_list = [] ;
		this.selected_pos      = null ;
		this.start_work();
	}



	start_work(){
		this.prepare_history_cart();
		this.db.getAllPosInvoice(
						(result)=>{
							console.log("the db data " , result)
							this.localPosInvoice.pos_invoices = result ;
							this.filtered_pos_list            = result ;
							if(this.filtered_pos_list.length == 0){
								this.selected_pos = null
							}
							else{
								this.selected_pos = structuredClone(this.filtered_pos_list[0])
							}
							this.refreshData()
						},
						(error) => {
							console.log(error)
						}
					)
		this.setListener();
	}


	/*************************************    UI    *******************************************************/

	prepare_history_cart(){
		this.wrapper.find('#LeftSection').append('<div id="historyLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="historyRightContainer" class="columnBox"></div>')

		this.left_container  = this.wrapper.find('#historyLeftContainer')
		this.right_container = this.wrapper.find('#historyRightContainer')


		//pos details  the container of the pos details
		this.left_container.append('<div id="PosContentHeader" class="rowBox" ><div class="c1 columnBox"><div id="posCustomer">Customer</div><div id="posSoldBy">Sold by : User</div></div><div class="c2 columnBox"><div id="posCost">0,0000 DA</div><div id="posId">ACC-PSINV-2024-ID</div><div id="posStatus">POS Status</div></div></div>')

		//first section is the header information
		this.pos_header = this.left_container.find('#PosContentHeader');

		this.left_container.append('<div id="posContent" class="columnBox"></div>')

		//second section is the data like items , cost and payments methods.
		this.pos_content = this.left_container.find('#posContent')
		this.pos_content.append('<div id="posItemContainer"><div class="posSectionTitle">Items</div><div id="posItemList"></div></div>')

		this.itemContainer = this.pos_content.find('#posItemContainer')
		this.itemList      = this.itemContainer.find('#posItemList')

		this.pos_content.append('<div id="posTotalsContainer"><div class="posSectionTitle">Totals</div><div id="posTotalList"></div></div>')

		this.totalsContainer = this.pos_content.find('#posTotalsContainer')
		this.totalList       = this.itemContainer.find('#posTotalList')

		this.pos_content.append('<div id="posPaymentsContainer"><div class="posSectionTitle">Payments</div><div id="posMethodList"></div></div>')

		this.paymentsContainer = this.pos_content.find('#posPaymentsContainer')
		this.methodList        = this.itemContainer.find('#posMethodList')

		this.left_container.append('<div id="posActionsContainer" class="rowBox align_content"> <div id="posPrintBtn" class="actionBtn rowBox centerItem"> Print Receipt </div>  <div id="posEmailBtn" class="actionBtn rowBox centerItem"> Email Receipt </div>   <div id="posReturnBtn" class="actionBtn rowBox centerItem"> Return </div>  </div>')

		//third and last section is the action buttons
		this.actionButtonsContainer = this.left_container.find('#posActionsContainer')
		this.printBtn  = this.actionButtonsContainer.find('#posPrintBtn')
		this.emailBtn  = this.actionButtonsContainer.find('#posEmailBtn')
		this.returnBtn = this.actionButtonsContainer.find('#posReturnBtn')

		this.right_container.append('<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4></div>')
		this.right_container.append('<div id="historyRightSearchContainer" class="rowBox align_center" ></div>');

		this.search_container = this.right_container.find('#historyRightSearchContainer');
		this.search_container.append('<select  id="PosInvoiceTypeInput" placeholder="POS Invoice Type">');

		this.filter_input = this.search_container.find("#PosInvoiceTypeInput")
		this.filter_input.append('<option value="Draft">Draft</option><option value="Paid">Paid</option><option value="Consolidated">Consolidated</option>')

		this.search_container.append('<input type="text" id="historyInput" placeholder="Search by invoice id or custumer name">');

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
			posName.textContent = record.name
			const posCost      = document.createElement('div')
			posCost.classList.add('posCost')
			posCost.textContent = record.paid_amount ?? 0 + " DA"

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

			//add all to container
			posContainer.appendChild(l1)
			posContainer.appendChild(l2)

			posContainer.addEventListener('click' , () => {
				this.selected_pos = record
				this.refreshPosDetailsData();
			})

			this.right_data_container.append(posContainer);
		})


		//dont forget to refresh the details cart view because the selected pos may change
		this.refreshPosDetailsData();

	}



	refreshPosDetailsData(){

		if(this.selected_pos == null ){
			console.log("empty ")
			this.setEmpty();
			return;
		}
		else{
			this.setData();
		}


		this.pos_header.find('#posCustomer').text(this.selected_pos.customer?? "CustomerName")
		//it is not the paid amount it should be the total invoice amount
		this.pos_header.find('#posCost').text(this.selected_pos.paid_amount??0 + "DA")
		this.pos_header.find('#posId').text(this.selected_pos.name?? "POS Invoice Name")
		let posStatus = ""
		if(this.selected_pos.docStatus??0 == 0){
			posStatus = "Paid"
		}
		else{
			posStatus = "Consolidated"
		}

		this.pos_header.find('#posStatus').text(posStatus)

		this.itemList.html('');
		this.selected_pos.items.forEach(item => {
			this.itemList.append(`<div class="rowBox align_item">    <div class="itemName rowBox align_center">${item.item_name}</div>   <div class="itemQuantity rowBox align_center">${item.qty}</div>   <div class="itemCost rowBox align_center">${item.qty * item.rate} DA</div>  </div>`)
		})



	}



	//show and hide
	show_cart(){
		this.left_container.css('display' , 'flex');
		this.right_container.css('display' , 'flex');

		//refrenshing data
		this.db.getAllPosInvoice(
						(result)=>{
							this.localPosInvoice.pos_invoices = result ;
							this.filtered_pos_list            = result ;
							if(this.filtered_pos_list.length == 0){
								this.selected_pos = null
							}
							else{
								this.selected_pos = structuredClone(this.filtered_pos_list[0])
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
	}

	//set data
	setData(){
		this.pos_header.css('display' , 'flex')
		this.pos_content.css('display' , 'flex')
		this.actionButtonsContainer.css('display' , 'flex')
	}




	/************************************* set listeners  ***********************************************/
	//set listeners
	setListener(){

		this.filter_input.on('input' , (event) => {
			const filter = event.target.value;

			this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter( pos => {
				if(filter == ""){
					return true ;
				}
				else if(filter == "Draft" ){
					return pos.docstatus == 0 ;
				}
				else if(filter == "Paid" ){
					return pos.docstatus == 1 ;
				}
				else if(filter == "Consolidated"){
					return pos.docstatus == 1 ;
				}
				else{
					return false ;
				}
			})

			if(this.filtered_pos_list.length == 0){
				this.selected_pos = null;
			}
			else{
				this.selected_pos = this.filtered_pos_list[0]
			}
			this.refreshData();
		});

		this.refreshData();

	}


}
