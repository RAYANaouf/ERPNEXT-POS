
pos_ar.PointOfSale.pos_customer_box = class{

	constructor(wrapper){
		this.wrapper = wrapper ;
		this.prepare_customer_box();
	}


	prepare_customer_box(){
		this.wrapper.append('<div id="CustomerBox" class="rowBox align_center">');


		this.customerBox = this.wrapper.find('#CustomerBox');
		this.customerBox.append('<input list="CustomerList"  id="CustomerInput" name="Customer" placeHolder="Enter the customer">')
		this.customerBox.append('<datalist id="CustomerList"></datalist>')


	}

}
