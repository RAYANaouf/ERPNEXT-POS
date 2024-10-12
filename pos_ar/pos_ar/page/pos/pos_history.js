

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

		this.right_container.append('<div id="histotyRecentInvoicesContainer"></div>');



		this.right_data_container = this.right_container.find('#histotyRecentInvoicesContainer')
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
		this.right_data_container.content('')

		this.result.forEach( record => {
			this.right_data_container.append(`<div> ${record} </div>`)
		})
	}


}
