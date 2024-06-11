class NeoDataExtractor {
    static SELECTORS = {
      SHOP_WIZARD: {
        RESULTS_FORM: '#shopWizardFormResults',
        QUERY_FORM: '#wresultform', // This form contains the query params for the search
        RESULTS_GRID: '.wizard-results-grid',
        RESULTS_TEXT: '.wizard-results-text',
        RESULTS_2020: '.wizard-results__2020',
        RESULTS_HEADER: '.wizard-results-header',
        WIZARD_BAN_DIV: '.wizard-char.wizard-char-single.wizard-char-old',
        PAGE_TITLE: '.page-title__2020',
        PAGE_DESC: '#pageDesc'
      },
      PROFILE: {
        PROFILE_DROPDOWN: '.nav-profile-dropdown-text a'
      },
      INVENTORY: {
        ITEM_TABLE: '#inventoryTable',
        ITEM_ROW: '.inventoryItemRow'
      },
      SDB: {
        SDB_FORM: "td.content form",
        SDB_ITEM_TABLE: "td.content form table:nth-child(3)",
        SDB_ITEM_ROWS: 'tr[bgcolor="#F6F6F6"], tr[bgcolor="#FFFFFF"]'
      }
    };
  
    // Shop Wizard related methods
    static ShopWizard = class {
      static getShops() {

        const resultsGrid = NeoDataExtractor.getElementsBySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_GRID, 'li')

        if (!resultsGrid){
          console.log("Invalid or empty search results.");
          return null;
        }

        const results = Array.from(resultsGrid);

        if (results.length > 0) {
          results.shift(); // Remove the first element (header)
        }
    
        if (results.length > 20) {
          throw new Error(`NeoDataExtractor found ${results.length} shops. Only 20 or fewer results should ever be returned.`);
        }
    
        return results.map(result => new ShopWizardShop(result));
      }
  
      static getSearchResultsForm() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_FORM); // I'm not sure when the form is and is not present
      }
  
      static getQueryForm() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.QUERY_FORM);
      }
  
      static getResults2020() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_2020);
      }
  
      static getResultsGrid() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_GRID);
      }
  
      static getResultsHeader() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_HEADER);
      }
  
      static getWizardBan() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.WIZARD_BAN_DIV);
      }
  
      static getPageTitle() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.PAGE_TITLE);
      }
  
      static getPageDesc() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.PAGE_DESC);
      }
  
      static getSearchItemName() {
        const resultsText = document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_TEXT);
        return resultsText ? resultsText.getElementsByTagName('h3')[0]?.textContent : null;
      }
  
      static getFailedSearchText() {
          const failedSearchTextElement = NeoDataExtractor.ShopWizard.getFailedSearchTextElement();
          return failedSearchTextElement ? failedSearchTextElement.textContent.trim() : null;
      }
  
      static getFailedSearchTextElement() {
        const resultsContainer = document.querySelector(NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_2020);
        if (resultsContainer) {
          const paragraphs = resultsContainer.querySelectorAll(':scope > p'); // Only select direct children p elements
          if (paragraphs.length > 0) {
            return paragraphs[paragraphs.length - 1]; // Return the last direct child paragraph element
          }
        }
        return null;
      }
  
      // Extract the object's ID from the search results
      static getObjectId() {
        const itemLink = document.querySelector(`${NeoDataExtractor.SELECTORS.SHOP_WIZARD.RESULTS_GRID} a`);
        if (itemLink) {
          const urlParams = new URLSearchParams(itemLink.href.split('?')[1]);
          return urlParams.get('buy_obj_info_id');
        }
        return null;
      }
    };
  
    // Inventory related methods
    static Inventory = class {
      static getItems() {
        return NeoDataExtractor.getElementsBySelector(NeoDataExtractor.SELECTORS.INVENTORY.ITEM_TABLE, 'tr');
      }
  
      // Add more Inventory related methods here
    };
  
    // SDB related methods
    static SDB = class {
      static getForm() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SDB.SDB_FORM);
      }
  
      static getItemTable() {
        return document.querySelector(NeoDataExtractor.SELECTORS.SDB.SDB_ITEM_TABLE);
      }
  
      static getItemRows() {
        return document.querySelectorAll(NeoDataExtractor.SELECTORS.SDB.SDB_ITEM_ROWS);
      }
    };
  
    // General utility methods
    static getElementsBySelector(parentSelector, childTag) {
      const parentElement = document.querySelector(parentSelector);
      return parentElement ? parentElement.getElementsByTagName(childTag) : null;
    }
  
    // Inventory related methods
    static General = class {
      static getUsername() {
        return document.querySelector(NeoDataExtractor.SELECTORS.PROFILE.PROFILE_DROPDOWN)?.textContent;
      }
    };
}