

pos_ar.PointOfSale.pos_item_selector = class {

	constructor(
		wrapper ,
		item_list ,
		item_group_list ,
		item_prices,
		onItemClick
	){
		this.wrapper     = wrapper;
		this.item_list   = item_list;
		this.item_group_list = item_group_list;
		this.item_prices = item_prices;
		this.on_item_click = onItemClick;


		//class functions invocation
		this.start_item_selector();
        }


	start_item_selector(){
		this.prepare_select_box();
		this.setItemGroupsInList();
		this.setItemInFlow(this.getItemByItemGroup(""))
		this.setListeners();
	}



	/***********************  ui  functions  ***************************************/
	prepare_select_box(){
		this.wrapper.append('<div id="SelectorBox" class="columnBox"></div>')

		this.selectorBox  = this.wrapper.find("#SelectorBox");
		this.selectorBox.append('<div id="selectorBoxHeader" class="rowBox header"></div>')

		this.header       = this.selectorBox.find("#selectorBoxHeader");
		this.header.append('<h4 class="CartTitle">Items</h4>')
		this.header.append('<div id="inputsBox" class="rowBox align_center"></div>')

		this.inputBox     = this.header.find("#inputsBox");
		this.inputBox.append('<input type="text" autocomplete="off"  maxlength="140" placeholder="Search by item code, serial number or barcode" id="ItemInput" name="item" placeHolder="Enter the customer">')
		this.inputBox.append('<input list="ItemGroupList"  id="ItemGroupInput" name="ItemGroup" placeHolder="Item Group">')
		this.inputBox.append('<datalist id="ItemGroupList"></datalist>')

		this.itemGroupList = this.inputBox.find("#ItemGroupList");
		this.itemGroupList.append('<option>fetching Item Groups ...</option>')

		this.selectorBox.append('<div id="itemsContainer" class="rowBox row_wrap"></div>')
		this.itemsContainer = this.selectorBox.find('#itemsContainer')
	}


	setItemGroupsInList(){
		const groupItemList_html = document.getElementById("ItemGroupList");
		groupItemList_html.innerHTML = "" ;
		this.item_group_list.forEach(group_item =>{
			const option = document.createElement("option");
			option.value = group_item.name;
			option.textContent = group_item.customer_name;
			groupItemList_html.appendChild(option);
		})
	}

	setItemInFlow(filtered_item_list){
        	const itemsContainer_html = document.getElementById("itemsContainer");
        	itemsContainer_html.innerHTML = "";
        	filtered_item_list.forEach(item =>{
                	const itemBox = document.createElement("div");
                	itemBox.classList.add("itemBox");
                	itemBox.classList.add("columnBox");
                	itemBox.classList.add("C_A_Center");

                	itemBox.addEventListener('click' , event => {
				this.on_item_click(item);
                	});


                	if(item.image){
                        	const itemImage = document.createElement("img");
                        	itemImage.classList.add("itemImage");
                        	itemImage.src = item.image
                        	itemBox.appendChild(itemImage);
                	}
                	else{
                        	const itemImageHolder = document.createElement("div");
                        	itemImageHolder.classList.add("itemImage");
                        	itemImageHolder.classList.add("rowBox");
                        	itemImageHolder.classList.add("centerItem");
                        	const firstLatter = document.createElement("h1");
                        	firstLatter.textContent = item.item_name[0];
                        	firstLatter.style.color = "#707070";
                        	itemImageHolder.appendChild(firstLatter);
                        	itemBox.appendChild(itemImageHolder);
                	}
                	const itemName = document.createElement("div");
                	itemName.textContent = item.name ;
                	itemName.classList.add("itemTitle");
                	itemBox.appendChild(itemName);


                	const price = document.createElement("div");
                	price.classList.add("itemPrice");
                	price.textContent = this.getItemPrice(item.name) + " DA";
                	itemBox.appendChild(price);


                	itemsContainer_html.appendChild(itemBox);
        	});

	}

	//show and hide
	showCart(){
		this.selectorBox.css("display" , "flex")
	}

	hideCart(){
		this.selectorBox.css("display" , "none")
	}

	//**************** set listeners method ****************************//
	setListeners(){
		const groupItemListInput = document.getElementById("ItemGroupInput");
                groupItemListInput.addEventListener('input' , (even)=>{
			this.setItemInFlow(this.getItemByItemGroup(event.target.value))
		})
	}

	//**************** tools method ****************************//
	getItemByItemGroup(item_group){


		let groups = [];

		let getChild = (grp)=>{
			groups.push(grp);
			this.item_group_list.forEach(g=>{
				if(g.parent_item_group == grp){
					groups.push(g.name)
					if(g.is_group){
						getChild(g.name)
					}
				}
			})
		};


		getChild(item_group);


		let filtredItemList = [];

		let getFiltredItems = (group)=>{
			this.item_list.forEach(item =>{
				if(item.item_group == group){
					filtredItemList.push(item);
				}
			})
		}


		groups.forEach(group =>{
			getFiltredItems(group);
		})


		return filtredItemList;
	}


	getItemPrice(itemId){
		const price = this.item_prices.find(itemPrice => itemPrice.item_code == itemId)
		return price ? price.price_list_rate  : 0
	}

}
