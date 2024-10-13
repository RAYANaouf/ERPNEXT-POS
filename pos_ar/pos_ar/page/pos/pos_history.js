

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
		this.selected_pos      = {} ;
		this.start_work();
	}



	start_work(){
		this.prepare_history_cart();
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
							console.log("selected pos ==> " , this.selected_pos)
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

		this.left_container.append('<div id="posContent"></div>')

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
				this.selected_pos = record
				this.refreshPosDetailsData();
			})

			this.right_data_container.append(posContainer);
		})


		//dont forget to refresh the details cart view because the selected pos may change
		this.refreshPosDetailsData();

	}



	refreshPosDetailsData(){

		console.log(" refreshing details data " , this.selected_pos);

		//const customer = document.getElementById("posCustomer");
		//customer.textContent = this.selected_pos.customer;

		this.pos_header.find('#posCustomer').text(this.selected_pos.customer)
		//it is not the paid amount it should be the total invoice amount
		this.pos_header.find('#posCost').text(this.selected_pos.paid_amount??0 + "DA")
		this.pos_header.find('#posId').text(this.selected_pos.name)
		let posStatus = ""
		if(this.selected_pos.docStatus == 0){
			posStatus = "Paid"
		}
		else{
			posStatus = "Consolidated"
		}

		console.log("pos status : " , posStatus );

		this.pos_header.find('#posStatus').text(posStatus)

		this.itemList.html('');
		this.selected_pos.items.forEach(item => {
			this.itemList.append(`<div class="rowBox align_item">    <div class="itemName rowBox centerItem">${item.item_name}</div>   <div class="itemQuantity rowBox centerItem">${item.qty}</div>   <div class="itemCost rowBox centerItem">${item.qty * item.rate} DA</div>  </div>`)
		})



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




	/************************************* set listeners  ***********************************************/
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
