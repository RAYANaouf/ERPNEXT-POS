

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
		this.selected_pos      = { name : null } ;
		this.start_work();
	}



	start_work(){
		this.prepare_selected_item_cart();
		this.db.getAllPosInvoice(
						(result)=>{
							console.log("the result ::::" , result);
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

	prepare_selected_item_cart(){
		this.wrapper.find('#LeftSection').append('<div id="historyLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="historyRightContainer" class="columnBox"></div>')

		this.left_container  = this.wrapper.find('#historyLeftContainer')
		this.right_container = this.wrapper.find('#historyRightContainer')

		//left
		this.left_container.append('<div id="historyLeftContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">POS Order</h4></div>')
		this.left_container.append('<div id="historyLeftContainerContent" class="columnBox"> </div>')


		//pos details  the container of the pos details
		this.pos_details = this.left_container.find('#historyLeftContainerContent');
		this.pos_details.append('<div id="PosContentHeader" class="rowBox" ><div class="c1 columnBox"><div id="posCustomer">Customer</div><div id="posSoldBy">Sold by : User</div></div><div class="c2 columnBox"><div id="posCost">0,0000 DA</div><div id="posId">ACC-PSINV-2024-ID</div><div>POS Status</div></div></div>')

		//first section is the header information
		this.pos_content_header = this.pos_details.find('#PosContentHeader');

		this.pos_details.append('<div id="posContent"></div>')

		//second section is the data like items , cost and payments methods.
		this.pos_content = this.pos_details.find('#posContent')
		this.pos_content.append('<div id="posItemContainer"><div class="posSectionTitle">Items</div><div id="posItemList"></div></div>')

		this.itemContainer = this.pos_content.find('#posItemContainer')
		this.itemList      = this.itemContainer.find('#posItemList')

		this.pos_content.append('<div id="posTotalsContainer"><div class="posSectionTitle">Totals</div><div id="posTotalList"></div></div>')

		this.totalsContainer = this.pos_content.find('#posTotalsContainer')
		this.totalList       = this.itemContainer.find('#posTotalList')

		this.pos_content.append('<div id="posPaymentsContainer"><div class="posSectionTitle">Payments</div><div id="posMethodList"></div></div>')

		this.paymentsContainer = this.pos_content.find('#posPaymentsContainer')
		this.methodList        = this.itemContainer.find('#posMethodList')

		this.pos_details.append('<div id="posActionsContainer" class="rowBox align_content"> <div id="posPrintBtn" class="actionBtn rowBox centerItem"> Print Receipt </div>  <div id="posEmailBtn" class="actionBtn rowBox centerItem"> Email Receipt </div>   <div id="posReturnBtn" class="actionBtn rowBox centerItem"> Return </div>  </div>')

		//third and last section is the action buttons
		this.actionButtonsContainer = this.pos_content.find('#posActionsContainer')
		this.printBtn  = this.actionButtonsContainer.find('#posPrintBtn')
		this.emailBtn  = this.actionButtonsContainer.find('#posEmailBtn')
		this.returnBtn = this.actionButtonsContainer.find('#posReturnBtn')

		this.right_container.append('<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4></div>')
		this.right_container.append('<div id="historyRightSearchContainer" class="rowBox align_center" ></div>');

		this.search_container = this.right_container.find('#historyRightSearchContainer');
		this.search_container.append('<input list="PosInvoiceTypeList" id="PosInvoiceTypeInput" placeholder="POS Invoice Type">');
		this.search_container.append('<datalist id="PosInvoiceTypeList"><option value="Draft"><option value="Paid"><option value="Consolidated"></datalist>')

		this.filter_input = this.search_container.find("#PosInvoiceTypeInput")

		this.search_container.append('<input type="text" id="historyInput" placeholder="Search by invoice id or custumer name">');

		this.right_container.append('<div id="historyRecentInvoicesContainer" ></div>');



		this.right_data_container = this.right_container.find('#historyRecentInvoicesContainer')
	}




	//show and hide
	show_cart(){
		this.left_container.css('display' , 'flex');
		this.right_container.css('display' , 'flex');
	}

	//hide and hide
	hide_cart(){
		this.left_container.css('display' , 'none');
		this.right_container.css('display' , 'none');
	}



	refreshData(){
		this.right_data_container.html('');

		console.log("refresh with : "  , this.localPosInvoice.pos_invoices);

		this.filtered_pos_list.forEach( record => {
			console.log("record : " , record);
			//this.right_data_container.append(`<div class="posInvoiceContiner"> ${record} </div>`)

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
				this.refreshPosDetailsData();
			})

			this.right_data_container.append(posContainer);
		})
	}



	refreshPosDetailsData(){

		const posDetailsHeader = document.createElement('div');
		const posCustomer      = document.createElement('div');
		const posCost          = document.createElement('div');
		const posId            = document.createElement('div');
		const posSoldBy        = document.createElement('div');
		const posState         = document.createElement('div');

		const posItemsCaontainer = document.createElement('div');
		const posItem            = document.createElement('div');
		const posItemId          = document.createElement('div');
		const posItemQnt         = document.createElement('div');
		const posItemDiscount    = document.createElement('div');
		const posItemCost        = document.createElement('div');

		const totalContainer     = document.createElement('div');
		const netTotal           = document.createElement('div');
		const grandTotal         = document.createElement('div');

		const paymentContainer   = document.createElement('div');
		const cashMethod         = document.createElement('div');

		const actionButtons      = document.createElement('div');
		const printActionBtn     = document.createElement('div');
		const emailActionBtn     = document.createElement('div');
		const returnActionBtn    = document.createElement('div');


	}

	//set listeners
	setListener(){

		this.filter_input.on('input' , (event) => {
			console.log(event.target.value);
			const filter = event.target.value;

			this.filtered_pos_list = this.localPosInvoice.pos_invoices.filter( pos => {
				if(filter == ""){
					return true ;
				}
				else if(filter == "Paid" ){
					return pos.docstatus == 0 ;
				}
				else if(filter == "Consolidated"){
					return pos.docstatus == 1 ;
				}
				else{
					return false ;
				}
			})

			console.log("we should refresh the data ::: " , this.filtered_pos_list)
			this.refreshData();
		});

	}


}
