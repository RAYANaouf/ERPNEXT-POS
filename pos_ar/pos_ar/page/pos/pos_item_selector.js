pos_ar.PointOfSale.pos_item_selector = class {

	constructor(
		wrapper           ,
		item_list         ,
		itemBarcodes      ,
		item_group_list   ,
		item_prices       ,
		settingsData      ,
		selectedPriceList ,
		getItemPrice      ,
		autoSelect        ,
		onItemClick
	){
		this.wrapper             = wrapper           ;
		this.item_list           = item_list         ;
		this.item_barcodes       = itemBarcodes      ;
		this.item_group_list     = item_group_list   ;
		this.item_prices         = item_prices       ;
		this.settings_data       = settingsData      ;
		this.selected_price_list = selectedPriceList ;
		this.get_item_price      = getItemPrice      ;
		this.auto_select         = autoSelect        ;
		this.on_item_click       = onItemClick       ;

		//class functions invocation
		this.start_item_selector();
    }


	start_item_selector(){
		this.prepare_select_box();
		this.setItemGroupsInList();
		this.setItemInFlow(this.getItemByItemGroup(""))
		this.setListeners();
	}

	refresh(){
		this.setItemInFlow(this.getItemByItemGroup(""))
	}

	/***********************  ui  functions  ***************************************/
	prepare_select_box(){
		this.wrapper.append('<div id="SelectorBox" class="columnBox" ></div>')

		this.selectorBox  = this.wrapper.find("#SelectorBox");
		this.selectorBox.append('<div id="selectorBoxHeader" class="rowBox header"></div>')

		this.header       = this.selectorBox.find("#selectorBoxHeader");
		this.header.append('<h4 class="CartTitle">Items</h4>')
		this.header.append('<div id="inputsBox" class="rowBox align_center"></div>')

		this.inputBox     = this.header.find("#inputsBox");
		this.inputBox.append('<input type="text" autocomplete="off"  maxlength="140" placeholder="Search by item code, item name or barcode" id="ItemInput" name="item" placeHolder="Enter the customer">')
		this.inputBox.append('<input list="ItemGroupList"  id="ItemGroupInput" name="ItemGroup" placeHolder="Item Group">')
		this.inputBox.append('<datalist id="ItemGroupList"></datalist>')

		this.itemGroupList = this.inputBox.find("#ItemGroupList");
		this.itemGroupList.append('<option>fetching Item Groups ...</option>')

		if(!this.settings_data.search_by_group){
			console.log(" see settings " , this.settings_data)
			this.inputBox.find("#ItemGroupInput").hide();
		}

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

	refreshItemSelector(){
		const seachField = document.getElementById("ItemInput");
		seachField.value = "";

		const groupItemListInput = document.getElementById("ItemGroupInput");
		this.setItemInFlow(this.getItemByItemGroup(groupItemListInput.value));
	}
	setItemInFlow(filtered_item_list){
        const itemsContainer_html = document.getElementById("itemsContainer");
        itemsContainer_html.innerHTML = "";
		const itemInput = document.getElementById("ItemInput");

		if (filtered_item_list.length === 0) {
			itemsContainer_html.innerHTML = `
				<div class="no-items-found">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M15.5 15.5L19 19" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M5 11C5 14.3137 7.68629 17 11 17C12.6597 17 14.1621 16.3261 15.2483 15.2483C16.3261 14.1621 17 12.6597 17 11C17 7.68629 14.3137 5 11 5C7.68629 5 5 7.68629 5 11Z" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<p>No items found</p>
				</div>
			`;
			return;
		}

		for(let i=0 ; i<filtered_item_list.length && i<700 ; i++){
			let item = filtered_item_list[i];
                	const itemBox = document.createElement("div");
                	itemBox.classList.add("itemBox");
                	itemBox.classList.add("columnBox");
                	itemBox.classList.add("C_A_Center");

                	itemBox.addEventListener('click' , event => {
				const isNotImpty = itemInput.value.length > 0;
				this.on_item_click(item, isNotImpty);
			});

			const imageUrl = item.image || '/assets/pos_ar/images/no_image.png';
			const price = this.get_item_price(item, this.selected_price_list.name);

                	itemBox.innerHTML = `
				<img class="itemImage" src="${imageUrl}" alt="${item.item_name}" onerror="this.src='/assets/pos_ar/images/no_image.png'">
				<div class="itemTitle">${item.item_name}</div>
				<div class="itemPrice">${price} DA</div>
			`;

                	itemsContainer_html.appendChild(itemBox);
		}

		if (filtered_item_list.length >= 700) {
			itemsContainer_html.insertAdjacentHTML('beforeend', `
				<div class="more-items-notice">
					<p>Showing first 700 items. Please refine your search to see more specific results.</p>
				</div>
			`);
		}
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

		const itemInput = document.getElementById("ItemInput");
		itemInput.addEventListener('input' , (event)=>{
			this.setItemInFlow(this.filterListByItemData(event.target.value))
		})
	}

	//**************** tools method ****************************//

	//filter list by item code or barcode
	filterListByItemData( value ){

		// Filter barcodes that match the value
		const filteredBarcodes = this.item_barcodes.filter(BarCode=> BarCode.barcode == value)

		// Extract the parent item IDs from the filtered barcodes
		const barcodeItemIds   = filteredBarcodes.map(cod => cod.parent)
		if(barcodeItemIds.length == 1){
			//auto fill
			this.auto_select(this.item_list.find(item => item.name==barcodeItemIds[0] ) )
			const itemInput = document.getElementById("ItemInput");
			itemInput.value = ''
			return this.item_list
		}

		return this.item_list.filter(item =>  barcodeItemIds.includes(item.name)  || item.item_name.toLowerCase().includes(value.toLowerCase()))
	}


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


		return filtredItemList ;
	}
}
