frappe.pages['pos'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'POS',
		single_column: true
	});

	$(frappe.render_template("pos" , {} )).appendTo(page.body);

	main()
}


let customersList    = []
let itemGroupList    = []
let itemList         = []
let itemPrices       = []
let priceLists       = []
let selectedItemMap  = new Map();
let warehouseList    = []
let PosProfileList   = []

let selectedItem     = null
let selectedField    = null

/* to prevent multy listener set */
let detailsItemFieldsListeners = false
let detailsItemKeysListeners   = false


async function main(){

	customersList  = await fetchCustomers()
	itemGroupList  = await fetchItemGroups()
	itemList       = await fetchItems()
	itemPrices     = await fetchItemPrice()
	priceLists     = await fetchPriceList()
	warehouseList  = await fetchWarehouseList()
	PosProfileList = await fetchPosProfileList()

	console.log("customersList : " , customersList )
	console.log("itemGroupList : " , itemGroupList )
	console.log("itemList : "      , itemList      )
	console.log("itemPrices : "    , itemPrices    )
	console.log("priceLists : "    , priceLists    )
	console.log("warehouseList : " , warehouseList )
	console.log("POSProfileList : ", PosProfileList )


	setCustomersInList();
	setItemGroupsInList();
	setPriceListInItemDetailsList();

	//set listener
	document.getElementById("ItemGroupInput").addEventListener('input' , function(event){
		setItemInFlow(getItemByItemGroup(event.target.value));
	});


}










/******************************  update the UI ***********************************/

function setCustomersInList(){

	const customerList_html = document.getElementById("CustomerList");
	customerList_html.innerHTML = "" ;

	customersList.forEach(customer =>{
		const option = document.createElement("option");
		option.value = customer.name;
		option.textContent = customer.customer_name;
		customerList_html.appendChild(option);
	})
}

function setItemGroupsInList(){

	const groupItemList_html = document.getElementById("ItemGroupList");
	groupItemList_html.innerHTML = "" ;

	itemGroupList.forEach(group_item =>{
		const option = document.createElement("option");
		option.value = group_item.name;
		option.textContent = group_item.customer_name;
		groupItemList_html.appendChild(option);
	})

}



function setPriceListInItemDetailsList(){
	const itemDetailsPriceList_html = document.getElementById("detailsPriceList");
	itemDetailsPriceList_html.innerHTML = "" ;

	priceLists.forEach(priceList => {
		const option = document.createElement("option");
		option.value = priceList.name
		option.textContent = priceList.price_list_name
		itemDetailsPriceList_html.appendChild(option);
	})
}



function setItemInFlow(filtered_item_list){
	const itemsContainer_html = document.getElementById("itemsContainer");
	itemsContainer_html.innerHTML = "";

	filtered_item_list.forEach(item =>{
		const itemBox = document.createElement("div");
		itemBox.classList.add("itemBox");
		itemBox.classList.add("columnBox");
		itemBox.classList.add("C_A_Center");

		itemBox.addEventListener('click' , function(event){
			itemClick(item);
			setSelectedItem();
			calculateNetTotal();
			calculateQnatity();
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
			firstLatter.textContent = item.name[0];
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
		price.textContent = getItemPrice(item.name) + " DA";
		itemBox.appendChild(price);


		itemsContainer_html.appendChild(itemBox);
	});

}

function setSelectedItem(){


	const selectedItemsContainer = document.getElementById("selectedItemsContainer");
	selectedItemsContainer.innerHTML = "";

	selectedItemMap.forEach((item,itemId) =>{
		const itemElement   = document.createElement("div");
		const leftGroup     = document.createElement("div");
		const rightGroup    = document.createElement("div");
		const itemName      = document.createElement("h5") ;
		const itemQuantity  = document.createElement("div") ;
		const itemPrice     = document.createElement("div") ;

		//image
		//check if there is an image or not
		if(item.image){
			const itemImage   = document.createElement("img");
			itemImage.src = item.image ;
			itemImage.classList.add("selectedItemImage");
			leftGroup.appendChild(itemImage);
		}else{
			const itemImageHolder = document.createElement("div");
			const itemImageLatter = document.createElement("div");

			itemImageHolder.classList.add("selectedItemImage" , "rowBox" , "centerItem");

			itemImageLatter.textContent = item.name[0]
			itemImageHolder.appendChild(itemImageLatter);
			leftGroup.appendChild(itemImageHolder);
		}

		//name
		itemName.textContent = item.name;
		itemName.classList.add("selectedItemName");
		leftGroup.appendChild(itemName);

		//quantity
		itemQuantity.textContent = item.quantity
		itemQuantity.classList.add("itemQuantity");
		rightGroup.appendChild(itemQuantity);
		//price
		itemPrice.textContent = getItemPrice(item.name) + " DA"
		itemPrice.classList.add("itemPrice");
		rightGroup.appendChild(itemPrice);

		//leftGroup
		leftGroup.classList.add("rowBox" , "align_center" , "leftGroup")
		itemElement.appendChild(leftGroup);

		//rightGroup
		rightGroup.classList.add("rowBox" , "align_center" , "rightGroup")
		itemElement.appendChild(rightGroup);


		//item
		itemElement.classList.add("rowBox" , "align_center" , "row_sbtw" , "ItemElement" , "pointerCursor");
		itemElement.addEventListener("click" , function(event){
			//expose the item as selected one
			selectedItem = item

			hideSelectorCart();
			renderItemDetailsCart(item);
		})

		selectedItemsContainer.appendChild(itemElement);
	})


}


function renderItemDetailsCart(item){
	showItemDetails()

	//creation
	const imageContainer    = document.getElementById("detailsItemImage") ;

	const name  = document.getElementById("detailsItemName");
	const warehouse     = document.getElementById("detailsItemWarehouse");
	const itemGroup     = document.getElementById("detailsItemGroup");


	const quantity  = document.getElementById("itemDetailsQuantityInput");
	const rate      = document.getElementById("itemDetailsRateInput");
	const discount  = document.getElementById("itemDetailsDiscountInput");
	const available = document.getElementById("itemDetailsAvailableInput");


	const uom           = document.getElementById("itemDetailsUomInput");
	const priceList     = document.getElementById("detailsItemPriceListInput");
	const priceListRate = document.getElementById("itemDetailsPriceListRateInput");

	//populate

	if(item.image){
		const image = document.createElement("img");
		image.src = item.image;
		imageContainer.innerHTML = "";
		imageContainer.appendChild(image);
	}
	else{
		const image = document.createElement("div");
		image.textContent = item.item_name[0];
		image.style.fontSize = "xx-large";
		image.style.fontWeight = "700";
		imageContainer.innerHTML = "";
		imageContainer.appendChild(image);
	}

	//name
	name.textContent  = item.item_name;



	//name
	name.classList.add("rowBox" , "align_center");





	//quantity
	quantity.value = item.quantity

	//rate
	rate.value = 250.00

	//discount
	discount.value = 0.00

	//available
	available.value = 1


	//uom
	uom.value = item.stock_uom


	//priceList
	priceList.value = priceLists[0].price_list_name

	//warehouse
	warehouse.textContent = "Warehouse : " + PosProfileList[0].warehouse
	//item group
	itemGroup.textContent = "Item Group : " + item.item_group

	//priceListRate
	priceListRate.value = getItemPrice(item.name) + "DA"




	//listeners
	setItemDetailsFieldsListener()
}


/********************* setListener functions      *****************************/

function setItemDetailsFieldsListener(){

	const quantityInput = document.getElementById("itemDetailsQuantityInput");

        if(!detailsItemFieldsListeners){
		//make sure to set the listener variable to true indecate that it has been alread set
		detailsItemFieldsListeners = true

		quantityInput.addEventListener('input' , function(event){
			const value = this.value ;

			console.log("before if : " , value , "|| value.includes('.') " , !value.slice(0,-1).includes(".") , "|| is number ==> " , !isNaN(value[value.length-1]) );

			if(value.length == 0){
				this.value = 0
			}
			else if (!value.slice(0,-1).includes(".")  && value[value.length-1] == "."){
				this.value = value
			}
			else if(value[value.length-1] == "."){
				this.value = value.slice(0,-1);
			}
			else if(isNaN(value[value.length-1])){
				this.value = value.slice(0,-1);
			}
			else{
				this.value = value;
			}

			let newQuantity = parseFloat(quantityInput.value);

			if(isNaN(newQuantity) || newQuantity <= 0){
				console.warn("Invaide Quantity value")
				return;
			}

			selectedItem.quantity = newQuantity;
			selectedItemMap.set(selectedItem.name , selectedItem);

			//function to redraw the selected item list
			setSelectedItem();
			calculateQnatity();
			calculateNetTotal();
		})
		quantityInput.addEventListener('focus' , function(event){
			selectedField = quantityInput
			selectedField.style.border = "border: 2.5px solid rgb(172, 101, 0) !important;"
		})
		quantityInput.addEventListener('blur' , function(event){
			selectedField = null
		})

	}


        if(!detailsItemKeysListeners){

                //make sure to set the listener variable to true indecate that it has been alread set
		detailsItemKeysListeners = true

		const key_0        = document.getElementById("key_0");
		const key_1        = document.getElementById("key_1");
		const key_2        = document.getElementById("key_2");
		const key_3        = document.getElementById("key_3");
		const key_4        = document.getElementById("key_4");
		const key_5        = document.getElementById("key_5");
		const key_6        = document.getElementById("key_6");
		const key_7        = document.getElementById("key_7");
		const key_8        = document.getElementById("key_8");
		const key_9        = document.getElementById("key_9");
		const key_quantity = document.getElementById("key_quantity");
		const key_discount = document.getElementById("key_discount");
		const key_rate     = document.getElementById("key_rate");
		const key_remove   = document.getElementById("key_remove");
		const key_delete   = document.getElementById("key_delete");
		const key_point    = document.getElementById("key_point");

		let keys = [key_0,key_1,key_2,key_3,key_4,key_5,key_6,key_7,key_8,key_9,key_quantity,key_discount,key_rate,key_remove,key_delete,key_point]

		keys.forEach(key=>{
			key.addEventListener('mousedown',function(event){
				event.preventDefault();
				//selectedField.focus();
				const keyContent = key.textContent;

				if(!isNaN(keyContent)){
					selectedField.value += keyContent
				}
				else if(keyContent == "." && !selectedField.value.includes(".")){
					selectedField.value += keyContent
				}
				else if(keyContent == "Rate"){
					
				}
				//update selectedItem map
				selectedItem.quantity = quantityInput.value;
				selectedItemMap.set(selectedItem.name , selectedItem);

		                //function to redraw the selected item list
				setSelectedItem();
				calculateQnatity();
				calculateNetTotal();
			})
		})

	}

}

/********************* show and hide  functions   *****************************/
//item detailscart
function showItemDetails(){
	const itemDetailsCart = document.getElementById("itemDetailsCart");
	itemDetailsCart.style.display = "block";


	const editSelectedItemCart = document.getElementById("editSelectedItemCart");
	editSelectedItemCart.style.display = "block";

	setCartDetailsOrientation("landscape")

	document.getElementById("itemDetailsCartXBtn").addEventListener('click', function(event){
		hideItemDetails();
		showSelectorCart();
	})
}

function hideItemDetails(){
	const itemDetailsCart = document.getElementById("itemDetailsCart");
	itemDetailsCart.style.display = "none";

	const editSelectedItemCart = document.getElementById("editSelectedItemCart");
	editSelectedItemCart.style.display = "none";

        setCartDetailsOrientation("portrait");

}

//selectors cart
function showSelectorCart(){
	const selectorBox = document.getElementById("SelectorBox");
	selectorBox.style.display = "block";

	const cartDetails = document.getElementById("cartDetails");
	cartDetails.style.display = "flex";
}

function hideSelectorCart(){
	const selectorBox = document.getElementById("SelectorBox");
	selectorBox.style.display = "none";

	const cartDetails = document.getElementById("cartDetails");
	cartDetails.style.display = "none";

}

function setCartDetailsOrientation(orientation){
	const container = document.getElementById("cartDetails");

	//to hide or show
	const discount   = document.getElementById("discount");
	const quantity   = document.getElementById("totalQuantity");
	const netTotal   = document.getElementById("netTotal");
	const GrandTotal = document.getElementById("grandTotal");

	if(orientation == "landscape"){
		container.style.display = "flex"
		container.classList.add("rowBox","align_center")
		container.classList.remove("columnBox")
		discount.style.display = "none"

		//make the text smaller
		quantity.style.fontSize = "smaller"
		netTotal.style.fontSize = "smaller"
		GrandTotal.style.fontSize = "small"
		GrandTotal.style.fontWeight = "500"
	}
	else{
		container.classList.remove("rowBox")
		container.classList.add("columnBox")
		discount.style.display = "flex"

		//reset
		quantity.style.fontSize = "small"
		netTotal.style.fontSize = "small"
		GrandTotal.style.fontSize = "larger"
		GrandTotal.style.fontWeight = "700"

	}
}



/******************************* Tools  *************************************/


function getItemByItemGroup(item_group){

	let filtredItemList = [];


	itemList.forEach(item =>{
		if(item.item_group == item_group){
			filtredItemList.push(item);
		}
	})

	return filtredItemList;
}

function getItemPrice(itemId){

	const price = itemPrices.find(itemPrice => itemPrice.item_code == itemId)

	return price ? price.price_list_rate  : 0
}


function itemClick(item){


	const cart = document.getElementById("CartBox");

	if(!selectedItemMap.has(item.name)){
		item.quantity = 1 ;
		selectedItemMap.set( item.name  , item);
	}
	else{
		const existingItem = selectedItemMap.get(item.name);
		existingItem.quantity += 1 ;
		selectedItemMap.set( item.name  , existingItem);
	}


}

function calculateNetTotal(){
	let netTotal = 0;
	selectedItemMap.forEach((value,key) =>{
		netTotal += value.quantity * getItemPrice(value.name)
	})

	const netTotal_HTML = document.getElementById("netTotalValue");
	netTotal_HTML.textContent = netTotal;
}

function calculateQnatity(){
	let quantity = 0;
	selectedItemMap.forEach((value,key) =>{
		quantity += value.quantity
	})

	const totalQuantity_HTML = document.getElementById("totalQuantityValue");
	totalQuantity_HTML.textContent = quantity;
}



/*********************  get data functions ******************************/

async function fetchCustomers() {
    try {
	return await frappe.db.get_list('Customer', {
			fields: ['name', 'customer_name' ],
    			filters: {}
		})

    } catch (error) {
        console.error('Error fetching customers:', error);
	return []
    }
}

async function fetchItemGroups() {
    try {
	return await frappe.db.get_list('Item Group', {
			fields: ['name', 'item_group_name' ],
    			filters: {}
		})

    } catch (error) {
        console.error('Error fetching Item Group :', error);
	return []
    }
}

async function fetchItems() {
    try {
	return await frappe.db.get_list('Item', {
			fields: ['name', 'item_name' , 'image' , 'item_group' , 'stock_uom'  ],
    			filters: {}
		})

    } catch (error) {
        console.error('Error fetching Item Group :', error);
	return []
    }
}

async function fetchItemPrice() {
    try {
	return await frappe.db.get_list('Item Price', {
			fields: ['name', 'item_code' , 'item_name' , 'price_list', 'price_list_rate' ],
    			filters: { price_list : "Standard Selling"}
		})

    } catch (error) {
        console.error('Error fetching Item Group :', error);
	return []
    }
}


async function fetchPriceList() {
    try {
	return await frappe.db.get_list('Price List', {
			fields: ['name', 'price_list_name' , 'currency' ],
    			filters: {selling : 1 }
		})

    } catch (error) {
        console.error('Error fetching Item Group :', error);
	return []
    }
}


async function fetchWarehouseList(){
	try{
		return await frappe.db.get_list('Warehouse' , {
			fields  : ['name' , 'warehouse_name'],
			filters : {}
		})
	}
	catch(error){
		console.error('Error fetching Warehouse list : ' , error)
		return [];
	}
}

async function fetchPosProfileList(){
        try{
                return await frappe.db.get_list('POS Profile' , {
                        fields  : ['name' , 'warehouse'],
                        filters : {}
                })
        }
        catch(error){
                console.error('Error fetching Warehouse list : ' , error)
                return [];
        }
}
