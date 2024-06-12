class ShopWizardInjector {

    constructor() {
      this.maxShopsToDisplay = 20;
      this.templates = {};
      this.headerElement = null;
    }
  
    async injectResults(swresults){
      this.removeUnwantedElements();
      //this.injectHeader(swresults);
      await this.injectResultsTable(swresults); // added await wondering if this helps the SW ban double injection thing.
    }
  
    removeUnwantedElements() {
      const pageTitleDiv = NeoDataExtractor.ShopWizard.getPageTitle();
      if (pageTitleDiv) {
          pageTitleDiv.remove();
      }
  
      const pageDescP = NeoDataExtractor.ShopWizard.getPageDesc();
      if (pageDescP) {
          pageDescP.remove();
      }
  
      // Add a dummy tag with the neoceo-inject attribute to prevent the mutation observer from reacting to this change
      const dummyElement = document.createElement('div');
      dummyElement.setAttribute('neoceo-inject', 'true');
      dummyElement.style.display = 'none'; // Hide the dummy element
      document.body.appendChild(dummyElement);
    }
  
    async loadTemplate(templatePath){
      if (!this.templates[templatePath]) {
        var templateURL = chrome.runtime.getURL(templatePath);
        var response = await fetch(templateURL);
        var template = await response.text();
  
        // Parse the HTML string into a new document object
        var parser = new DOMParser();
        this.templates[templatePath] = parser.parseFromString(template, 'text/html');
      }
      return this.templates[templatePath];
    }
  
    async createHeader(swresults) {
      // Retrieves the appropriate header template depending on what item data we have
      var doc;
      if (swresults.itemRecord && swresults.itemRecord.img) {
        doc = await this.loadTemplate('html/SWHeaderNeoCeoTemplate.html');
        const itemImageElement = doc.querySelector('.neoceo-item-image');
        const rarityElement = NeoUtils.createRaritySpan(swresults.itemRecord.rarity, `(r${swresults.itemRecord.rarity})`);
        itemImageElement.src = swresults.itemRecord.img;
        itemImageElement.insertAdjacentElement('afterend', rarityElement);
      } else {
        doc = await this.loadTemplate('html/SWHeaderTemplate.html');
      }
  
      const searchItemElement = doc.querySelector('.neoceo-item');
      const priceElement = doc.querySelector('.neoceo-price');
      const updateTimeElement = doc.querySelector('.neoceo-update');
  
      searchItemElement.textContent = swresults.itemRecord.name;
      this.showMarketValue(priceElement, updateTimeElement, swresults);
  
      this.headerElement = doc.querySelector('.wizard-results-header').cloneNode(true);
    }
  
    showMarketValue(priceElement, updateTimeElement, swresults){
      // This displays pricing information if available
      if (swresults.itemRecord && swresults.marketAgg.getPrice()){
        priceElement.textContent = `${swresults.marketAgg.getPrice().toLocaleString()} NP`;
        updateTimeElement.textContent = NeoUtils.getLatestPriceUpdateText(swresults.marketAgg.lastUpdate);
      }
    }
  
    updateMarketValue(swresults){
      // Update header price if there's a change
      const currentPriceElement = this.headerElement.querySelector('.neoceo-price');
      const newPrice = `${swresults.marketAgg.getPrice().toLocaleString()} NP`;
      if (currentPriceElement && currentPriceElement.textContent !== newPrice) {
        currentPriceElement.textContent = newPrice;
      }
    }
  
    async injectHeader(swresults) {
      if (swresults.itemRecord instanceof Promise) { return; } // Haven't received information from database yet.
      if (!this.headerElement) {await this.createHeader(swresults);}
  
      // remove default header and replace with our own
      var swResultsTable = NeoDataExtractor.ShopWizard.getResults2020();
      var swHeader = NeoDataExtractor.ShopWizard.getResultsHeader();
      var wizardCharDiv = NeoDataExtractor.ShopWizard.getWizardBan();
      
      // Case where there's SW ban
      if (wizardCharDiv) {
        wizardCharDiv.remove();
        const whoaParagraph = swResultsTable.querySelector('p');
        if (whoaParagraph) {
          swResultsTable.insertBefore(this.headerElement, whoaParagraph);
        }
      } else if (swHeader) {
        swResultsTable.insertBefore(this.headerElement, swHeader.nextSibling);
        swResultsTable.removeChild(swHeader);
      } else {
        swResultsTable.appendChild(this.headerElement);
      }
  
      this.updateMarketValue(swresults);
    }
  
    async injectResultsTable(swresults) {
      if (swresults.itemRecord instanceof Promise) { return; } // Haven't received information from database yet.
  
      var doc = await this.loadTemplate('html/SWResultsGridTemplate.html');
      var progressBarElement = doc.querySelector('.progress-bar');
      var progressBarText = doc.querySelector('.progress-text');
      var shopList = doc.querySelector('ul');
  
      var listItems = shopList.querySelectorAll('li');
  
      // Start all shops from the second 'li' element
      for (let i = 1; i < listItems.length; i++) {
        shopList.removeChild(listItems[i]);
      }
  
      // Add shops
      const allShops = swresults.marketAgg.allSortedShops;
      for (let i = 0; i < Math.min(this.maxShopsToDisplay, allShops.length); i++) {
        const shop = allShops[i];
        shopList.appendChild(shop.html);
      }
  
      await this.updateProgressBar(progressBarElement, progressBarText, swresults);
  
      // Create the search count element
      const searchCountElement = document.createElement('div');
      searchCountElement.style.textAlign = 'center';
      searchCountElement.style.fontSize = '14px';
      searchCountElement.style.marginTop = '10px';
      searchCountElement.textContent = 'Searches this hour: ' + swresults.hourlySearches; // Replace 43 with the actual count
  
      // remove default results and replace with our own
      var swResultsTable = NeoDataExtractor.ShopWizard.getResults2020();
      var swResultsGrid = NeoDataExtractor.ShopWizard.getResultsGrid();
      var swHeader = NeoDataExtractor.ShopWizard.getResultsHeader();
      var newResultsGrid = doc.querySelector('.wizard-results-grid').cloneNode(true);
      var failedSearchTextElement = NeoDataExtractor.ShopWizard.getFailedSearchTextElement();
  
      if (failedSearchTextElement) {
        swResultsTable.insertBefore(newResultsGrid, failedSearchTextElement.nextSibling);
      } else if (swResultsGrid) {
        swResultsTable.insertBefore(newResultsGrid, swResultsGrid.nextSibling);
        swResultsTable.removeChild(swResultsGrid);
      } else if (swHeader) {
        swResultsTable.insertBefore(newResultsGrid, swHeader.nextSibling);
      } else {
        swResultsTable.appendChild(newResultsGrid);
      }
  
      // Insert the search count element before the buttons
      const buttonsContainer = swResultsTable.querySelector('.wizard-results-buttons');
      swResultsTable.insertBefore(searchCountElement, buttonsContainer);
    }
  
    async updateProgressBar(progressBarElement, progressBarText, swresults) {
      var theoreticalPercentage = Math.floor(NeoUtils.statisticalShopWizardProgress(swresults.searchAttempts));
      var actualPercentage = Math.floor((100.0 / 13) * swresults.marketAgg.distinctSubmarketsFound());
      var displayPercentage = Math.max(actualPercentage, theoreticalPercentage);
  
      progressBarElement.style.width = displayPercentage.toString() + "%";
      progressBarText.textContent = displayPercentage + "% of market searched. ";
    }
  }
  