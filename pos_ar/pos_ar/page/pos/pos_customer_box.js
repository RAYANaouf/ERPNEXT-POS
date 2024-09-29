
pos_ar.PointOfSale.pos_customer_box = class{

	constructor(
		wrapper,
		customersList,
		onSync
	){
		this.wrapper        = wrapper ;
		this.customers_list = customersList ;
		this.on_sync        = onSync ;
		//local
		this.online  = true    ;

		this.start_work();
	}



	start_work(){
		this.prepare_customer_box();
		this.setCustomersInList();
		this.setListeners();
	}

	prepare_customer_box(){
		this.wrapper.append('<div id="CustomerBox" class="rowBox align_center">');


		this.customerBox = this.wrapper.find('#CustomerBox');
		this.customerBox.append('<input list="CustomerList"  id="CustomerInput" name="Customer" placeHolder="Enter the customer">')
		this.customerBox.append('<datalist id="CustomerList"></datalist>')
		this.customerBox.append('<div id="suncBtn">Sync</div>')
		this.customerBox.append('<div id="toggleButtonLabel">Offline Mode </div>')
		this.customerBox.append('<div id="toggleButton" class="rowBox align_center" > <div id="toggleButtonBall" ></div>  </div>')

	}


	setCustomersInList(){

		const customerList_html = document.getElementById("CustomerList");
		customerList_html.innerHTML = "" ;

		this.customers_list.forEach(customer =>{
			const option = document.createElement("option");
			option.value = customer.name;
			option.textContent = customer.customer_name;
			customerList_html.appendChild(option);
		})
	}

	setListeners(){

		this.customerBox.find('#toggleButton').on('click' , (event)=>{
			this.online = !this.online



			if(this.online){
				console.log(this.online)
				this.customerBox.find('#toggleButtonBall').css('left' , '0px')
				this.customerBox.find('#toggleButtonBall').css('background' , '#d0d0d0')
				this.customerBox.find('#toggleButton').css('border' , '2px solid #cccccc')
			}
			else{
				console.log(this.online)

				this.customerBox.find('#toggleButtonBall').css('left' , '15px')
				this.customerBox.find('#toggleButtonBall').css('background' , '#ac6500')
				this.customerBox.find('#toggleButton').css('border' , '2px solid  #6a3e00')

			}
		})

		this.customerBox.find('#suncBtn').on('click' , (event)=>{
			this.on_sync();
		})

	}

}
