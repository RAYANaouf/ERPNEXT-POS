pos_ar.PointOfSale.pos_check_in_out = class {

	constructor(
		wrapper,
		db
	){
		this.wrapper   = wrapper;
		this.db        = db;

		//local
		this.checkList = [];
		this.filter    = 'All';

		this.start_work();
	}

	start_work(){
		this.prepare_checkInOut_cart();
		this.getAllCheckInOut();
		this.setListeners();
	}

	/****************************************    UI    *******************************************************/

	prepare_checkInOut_cart(){
		this.wrapper.find('#LeftSection').append('<div id="checkInOutLeftContainer" class="columnBox"></div>')
		this.wrapper.find('#RightSection').append('<div id="checkInOutRightContainer" class="columnBox"></div>')

		this.left_container  = this.wrapper.find('#checkInOutLeftContainer')
		this.right_container = this.wrapper.find('#checkInOutRightContainer')

		///////////////////right section
		//checkInOut tab
		this.right_container.append('<div id="checkInOutTabContainer" class="rowBox">  <div id="tabAll" class="tab selected">All</div> <div id="tabCheckIn" class="tab">Check In</div> <div id="tabCheckOut" class="tab">Check Out</div>  </div>')
		this.tab_container = this.right_container.find('#checkInOutTabContainer')
		this.tab_all = this.tab_container.find('#tabAll')
		this.tab_in  = this.tab_container.find('#tabCheckIn')
		this.tab_out = this.tab_container.find('#tabCheckOut')
		//checkInOut list
		this.right_container.append('<div id="checkInOutList" class="columnBox"></div>')
		this.check_in_out_list = this.right_container.find('#checkInOutList')

		//////////////////now left section
		const header =
			'<div id="detailsCheckInOutHeader" class="rowBox" >'+
				'<div class="checkInAmount columnBox" >'+
					'<div class="rowBox centerItem" style="width:100%;height:50%;">'+
						'<div style="font-size:25px; font-weight:700;">Check In</div>'+
					'</div>'+
					'<div id="TotalCheckInValue" class="rowBox centerItem" style="height:50%; width:100%;">...DA</div>'+
				'</div>'+
				'<div class="checkOutAmount columnBox" >'+
					'<div class="rowBox centerItem" style="width:100%;height:50%;" >'+
						'<div style="font-size:25px; font-weight:700;">Check Out</div>'+
					'</div>'+
					'<div id="TotalCheckOutValue" class="rowBox centerItem" style="width:100%;height:50%;"> ...DA </div>'+
				'</div>'+
				'<div class="totalCheckInOutAmount columnBox centerItem">'+
					'<div class="rowBox centerItem" style="width:100%;height:50%;">'+
						'<div style="font-size:25px; font-weight:700;">Total</div>'+
					'</div>'+
					'<div id="TotalCheckInOutValue" class="rowBox centerItem" style="height:50%; width:100%;">...DA</div>'+
				'</div>'+
			'</div>'
		this.left_container.append(header)
		this.details_checkInOut_header = this.left_container.find('#detailsCheckInOutHeader')

		//Amounts
		this.check_in_amount           = this.details_checkInOut_header.find('#TotalCheckInValue')
		this.check_out_amount          = this.details_checkInOut_header.find('#TotalCheckOutValue')
		this.check_total_in_out_amount = this.details_checkInOut_header.find('#TotalCheckInOutValue')


		// one checkInOut details content
		this.left_container.append('<div id="detailsCheckInOutContent" class="columnBox"></div>')
		this.detailsCheckInOutContent = this.left_container.find('#detailsCheckInOutContent')
		const details =
			'<div class="l1 rowBox">'+
				'<div>Check Type : <span id="selectedCheckInOutType"> THE_TYPE </span></div>'+
				'<div> THE_DATE</div>'+
			'</div>'+
			'<div class="l2">'+
				'<div>Owner : <span>THE OWNER</span></div>'+
			'</div>'+
			'<div class="l3">'+
				'<div> THE REASON</div>'+
				'<textarea id="selectedCheckInOutReason"></textarea>'+
			'</div>'
		this.detailsCheckInOutContent.append(details)
	}

	refreshCheckInOutList(){
		this.check_in_out_list.empty();

		const filteredList = this.checkList.filter( item => item.check_type == this.filter || this.filter == 'All')

		filteredList.forEach(checkInOut =>{
			//retate the arrow up image if the type is In
			const rotationStyle = checkInOut.check_type === 'In' ? 'transform:rotate(180deg);' : '' ;
			const checkInOutObject =
				'<div class="checkInOutItem rowBox" >'+
					`<div class="type">         <img src="/assets/pos_ar/images/arrow.png" style="width:35px;height:35px;${rotationStyle}"><div>${checkInOut.check_type}</div> </div>`+
					`<div class="creationTime"> ${checkInOut.creation_time} </div>`+
					`<div class="amount">       ${checkInOut.amount} DA</div>`+
				'</div>'

			this.check_in_out_list.append(checkInOutObject)
		})

	}

	refreshCheckInOutDetails(){
		this.check_total_in_out_amount.html('');
		this.check_in_amount.html('');
		this.check_out_amount.html('');

		let inAmount  = 0.00 ;
		let outAmount = 0.00 ;
		let allAmount = 0.00 ;

		this.checkList.forEach(item =>{
			allAmount += parseFloat(item.amount) || 0.00;
			if(item.check_type == 'In')
				inAmount += parseFloat(item.amount) || 0.00;
			else if(item.check_type == 'Out')
				outAmount += parseFloat(item.amount) || 0.00;
		})
		this.check_in_amount.append(`${inAmount.toFixed(2)} DA`)
		this.check_out_amount.append(`${outAmount.toFixed(2)} DA`)
		this.check_total_in_out_amount.append(`${allAmount.toFixed(2)} DA`)
	}

	//show && hide functions
	showCart(){
		this.left_container.css('display','flex')
		this.right_container.css('display','flex')
	}
	hideCart(){
		this.left_container.css('display','none')
		this.right_container.css('display','none')
	}

	/*****************************************  listener  **************************************************/
	/********************************************************************************************************/

	setListeners(){
		this.tab_all.on('click' , (event)=>{
			this.filter = 'All'
			this.tab_all.addClass('selected')
			this.tab_out.removeClass('selected')
			this.tab_in.removeClass('selected')
			this.refreshCheckInOutList();
		})
		this.tab_in.on('click' , (event)=>{
			this.filter = 'In'
			this.tab_in.addClass('selected')
			this.tab_out.removeClass('selected')
			this.tab_all.removeClass('selected')
			this.refreshCheckInOutList();
		})
		this.tab_out.on('click' , (event)=>{
			this.filter = 'Out'
			this.tab_out.addClass('selected')
			this.tab_all.removeClass('selected')
			this.tab_in.removeClass('selected')
			this.refreshCheckInOutList();
		})
	}

	/*****************************************  functions  **************************************************/
	/********************************************************************************************************/

	getAllCheckInOut(){
		this.db.getAllCheckInOut(
			(res)=>{
				this.checkList = res ;
				this.refreshCheckInOutList();
				this.refreshCheckInOutDetails();
				console.log("res : " , res)
			},(err)=>{
				console.log("err : " , err)
			}
		)
	}

}
