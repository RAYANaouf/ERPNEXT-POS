pos_ar.PointOfSale.ScreenManager  = class {
    
    constructor(settings_data) {
		this.settings_data = settings_data;

        this.screens = new Map();
        this.activeScreen = null;
    }

    registerScreen(screenId, screenComponent) {
        this.screens.set(screenId, screenComponent);
    }

    navigate(screenId) {

        switch (screenId) {
            case 'history_cart':
                console.log("history_cart")
                //show
			    this.history_cart.show_cart()
			    this.customer_box.showHomeBar();
                //hide
			    this.payment_cart.hideCart();
			    this.item_details.hide_cart();
			    this.item_selector.hideCart();
			    this.selected_item_cart.hideCart();
			    this.customer_box.hideSyncBar();
			    this.settings_cart.hideCart();
			    this.check_in_out_cart.hideCart();
			    this.debt_cart.hideCart();
                break;
            case 'settings_cart':
                //show settings
			    this.settings_cart.showCart()
    			this.customer_box.showHomeBar();
	    		//hide
		    	this.item_selector.hideCart();
			    this.selected_item_cart.hideCart();
    			this.item_details.hide_cart() ;
	    		this.payment_cart.hideCart()  ;
		    	this.history_cart.hide_cart() ;
			    this.check_in_out_cart.hideCart();
    			this.debt_cart.hideCart();
	    		//hide section
		    	this.customer_box.hideSyncBar();
                break;
            case 'check_in_out_cart':
                //show
	    		this.check_in_out_cart.showCart();
    			this.customer_box.showHomeBar();

    			//hide
	    		this.item_selector.hideCart();
		    	this.selected_item_cart.hideCart();
    			this.item_details.hide_cart() ;
	    		this.payment_cart.hideCart()  ;
		    	this.history_cart.hide_cart() ;
			    this.settings_cart.hideCart() ;
    			this.debt_cart.hideCart();

	    		//hide section
		    	this.customer_box.hideSyncBar(); 
                break;
            case 'home':
                //show
		        this.item_selector.showCart()      ;
		        this.customer_box.showSyncBar()    ;
        		this.selected_item_cart.showCart() ;

	     	    //hide
    	    	this.payment_cart.hideCart()   ;
        		this.customer_box.hideHomeBar();
    	    	this.item_details.hide_cart()  ;
	    	    this.history_cart.hide_cart()  ;
    		    this.settings_cart.hideCart()  ;
    	    	this.debt_cart.hideCart();
	    	    this.check_in_out_cart.hideCart();
				if(this.settings_data.settings.showItemDetails){
					this.selected_item_cart.hideKeyboard();
				}

				//update ui
				this.selected_item_cart.setKeyboardOrientation("portrait");
				this.selected_item_cart.cleanHeighlight();
                break;
			case 'debt_cart':
				//show
				this.debt_cart.showCart();
				this.customer_box.showHomeBar();

				//hide
				this.item_selector.hideCart();
				this.selected_item_cart.hideCart();
				this.item_details.hide_cart();
				this.settings_cart.hideCart();
				this.payment_cart.hideCart();
				this.check_in_out_cart.hideCart();
				break;
            default:
                break; 
        }

        // Hide all screens first
        //this.screens.forEach(screen => screen.hideCart());
        
        // Show the requested screen
        //const targetScreen = this.screens.get(screenId);
        //if (targetScreen) {
        //    targetScreen.showCart();
        //    this.activeScreen = screenId;
        //}
    }
}