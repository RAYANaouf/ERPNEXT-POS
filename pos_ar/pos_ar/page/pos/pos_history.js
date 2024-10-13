

pos_ar.PointOfSale.pos_history = class {

	constructor(
		wrapper,
		db
	){
		this.wrapper = wrapper;
		this.db      = db;

		this.start_work();
	}



	start_work(){
		console.log("we are heeeeeeeeeeeeeeeeeeeeeeeere")
		this.prepare_selected_item_cart();
		this.db.getAllPosInvoice(
					(result)=>{
						console.log("the result ::::" , result);
						this.data = result;
						this.refreshData()
					},
					(error) => {
						console.log(error)
					}
					)
	}


	/*************************************    UI    *******************************************************/

	prepare_selected_item_cart(){
		this.wrapper.find('#LeftSection').append('<div id="historyLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="historyRightContainer" class="columnBox"></div>')

		this.left_container  = this.wrapper.find('#historyLeftContainer')
		this.right_container = this.wrapper.find('#historyRightContainer')

		//left
		this.left_container.append('<div id="historyLeftContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">POS Order</h4></div>')

		this.right_container.append('<div id="historyRightContainerHeader" class="rowBox align_center" ><h4 class="CartTitle">Recent Orders</h4></div>')
		this.right_container.append('<div id="historyRightSearchContainer" class="rowBox align_center" ></div>');

		this.search_container = this.right_container.find('#historyRightSearchContainer');
		this.search_container.append('<input list="PosInvoiceTypeList" id="PosInvoiceTypeInput" placeholder="POS Invoice Type">');
		this.search_container.append('<datalist id="PosInvoiceTypeList"><option value="Draft"><option value="Paid"><option value="Consolidated"></datalist>')
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
		this.right_data_container.html = '';

		this.data.forEach( record => {
			console.log("record : " , record);
			//this.right_data_container.append(`<div class="posInvoiceContiner"> ${record} </div>`)

			const posContainer = document.createElement('div');
			posContainer.classList.add('posInvoiceContainer')
			posContainer.classList.add('rowBox')
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


			// line 2
			const l2           = document.createElement('div')
			l2.classList.add('l2')
			l2.classList.add('rowBox')
			l2.classList.add('align_content')

			const customer = document.createElement('div')
			const customerLogo  = document.createElement('img')
			customerLogo.src    = '/assets/pos_ar/images/customer.png' ;
			customerLogo.width  = 40 ;
			customerLogo.height = 40 ;

			const customerName       = document.createElement('div')
			customerName.textContent = record.customer

			customer.appendChild(customerLogo);
			customer.appendChild(customerName);

			//add all to container
			posContainer.appendChild(l1)
			posContainer.appendChild(l2)


			this.right_data_container.append(posContainer);
		})
	}


}
