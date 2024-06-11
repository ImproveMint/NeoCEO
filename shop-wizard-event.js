/**
 * Enum representing different types of shopwizard search events
 */
const SearchEventType = {
    VALID: "VALID", // SW returned results
    EMPTY: "EMPTY", // SW returned no results
    SW_BAN: "SW_BAN", // SW ban
    INVALID_SEARCH: "INVALID_SEARCH", // item name doesn't exist
    UNKNOWN: "UNKNOWN"
  };
  
  class ShopWizardEventHandler {
    static EMPTY_SUBMARKET_TEXT = 'I did not find anything.  :(  Please try again and I will search elsewhere!';
    static SHOP_WIZARD_BAN_TEXT = 'I am too busy right now,';
    static INVALID_ITEM_NAME_TEXT = "...";
  
    constructor() {
      this.searchItem = null;
      this.searchEventType = null;
      this.valid = false;
      this.isNewSearch = false;
    }
  
    processSearchEvent() {
      // Call this every time there's a mutation in the shop wizard search page
      const shopWizard = NeoDataExtractor.ShopWizard;
      const shops = shopWizard.getShops();
      const queryForm = shopWizard.getQueryForm();
      const newSearchItem = shopWizard.getSearchItemName();
  
      this.getSearchEventType(shops, newSearchItem);
      this.isValidQuery(queryForm);
      this.hasSearchItemChanged(newSearchItem);
    }
  
    getSearchEventType(shops, itemName) {
      if (shops) {
        this.searchEventType = SearchEventType.VALID;
      } 
      else {
        const failedSearchText = NeoDataExtractor.ShopWizard.getFailedSearchText();
        if (ShopWizardEventHandler.INVALID_ITEM_NAME_TEXT === itemName) {
          this.searchEventType = SearchEventType.INVALID_SEARCH;
        } else if (failedSearchText === ShopWizardEventHandler.EMPTY_SUBMARKET_TEXT) {
          this.searchEventType = SearchEventType.EMPTY;
        } else if (failedSearchText?.includes(ShopWizardEventHandler.SHOP_WIZARD_BAN_TEXT)) {
          this.searchEventType = SearchEventType.SW_BAN;
        } else {
          this.searchEventType = SearchEventType.UNKNOWN;
        }
      }
    }
  
    hasSearchItemChanged(newSearchItem) {
      if (this.searchEventType == SearchEventType.SW_BAN){
        this.isNewSearch = false;
      }
      else if (this.searchItem === null) {
        this.isNewSearch = newSearchItem != null;
      } else {
        this.isNewSearch = this.searchItem !== newSearchItem && newSearchItem != null;
      }
  
      if (this.isNewSearch){
        this.searchItem = newSearchItem;
      }
    }
  
    isValidQuery(query) {
      // A query is valid if it doesn't limit price range and item name query matches exactly
      if (query) {
        const rsMaxPrice = query.querySelector('[name="rs_max_price"]').value;
        const rsMinPrice = query.querySelector('[name="rs_min_price"]').value;
        const rsPartial = query.querySelector('[name="rs_partial"]').value;
  
        this.valid = rsMaxPrice == 999999 && rsMinPrice == 1 && rsPartial == "exact";
      } else {
        this.valid = false;
      }
    }
  }
  