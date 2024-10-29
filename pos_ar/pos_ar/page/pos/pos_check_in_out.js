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

		//checkInOut tab
		this.right_container.append('<div id="checkInOutTabContainer" class="rowBox">  <div id="tabAll" class="tab selected">All</div> <div id="tabCheckIn" class="tab">Check In</div> <div id="tabCheckOut" class="tab">Check Out</div>  </div>')
		this.tab_container = this.right_container.find('#checkInOutTabContainer')
		this.tab_all = this.tab_container.find('#tabAll')
		this.tab_in  = this.tab_container.find('#tabCheckIn')
		this.tab_out = this.tab_container.find('#tabCheckOut')
		//checkInOut list
		this.right_container.append('<div id="checkInOutList" class="columnBox"></div>')
		this.check_in_out_list = this.right_container.find('#checkInOutList')
		console.log("debuging ==> " , this.check_in_out_list)
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

			console.log("checkInOut ==> " , checkInOutObject)
			this.check_in_out_list.append(checkInOutObject)
		})

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
				console.log("res : " , res)
			},(err)=>{
				console.log("err : " , err)
			}
		)
	}

}
