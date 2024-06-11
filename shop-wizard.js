class ShopWizard {
    constructor() {
      this.injectAttribute = "neoceo-inject"; // Shouldn't be here it's not unique to this class.
      this.observer = null;
      this.observeWizardFormResults();
  
      this.itemRecord = null;
  
      this.SWEvent = new ShopWizardEventHandler();
      this.marketAgg = null;
  
      this.banned = false;
      this.foundEmptySubmarket = false; // The first empty submarket is noted, but subsequent ones cannot be distinguished.
      this.searchAttempts = 0; // Number of search attempts made for this itemRecord
      this.hourlySearches = 0; // copy from local storage. Used because it's so much faster to use in memory
  
      this.injector = new ShopWizardResultsInjector();
      this.updateHourlySearches();
    }
  
    isNewHour(currentTime, searchStartTime) {
      return (
        currentTime.getDate() !== searchStartTime.getDate() || 
        currentTime.getHours() !== searchStartTime.getHours()
      );
    }
  
    async updateHourlySearches(increment = false) {
      this.hourlySearches++;
      chrome.storage.local.get(['sw_searches', 'search_start_time'], (result) => {
        const currentTime = new Date();
        const searchStartTime = new Date(result.search_start_time);
    
        if (this.isNewHour(currentTime, searchStartTime)) {
          // Reset the local storage value and the in-memory value independently
          chrome.storage.local.set({
            sw_searches: increment ? 1 : 0,
            search_start_time: currentTime.toISOString()
          }, () => {
            this.hourlySearches = increment ? 1 : 0; // Update the in-memory value separately
            console.log(`Hourly searches reset and start time updated`);
            this.updateSearchCountDisplay();
          });
        } else {
          const newSearchCount = (result.sw_searches || 0) + (increment ? 1 : 0);
          chrome.storage.local.set({ sw_searches: newSearchCount }, () => {
            this.hourlySearches = newSearchCount; // Update the in-memory value separately
            console.log(`Counter updated to ${newSearchCount}`);
            this.updateSearchCountDisplay();
          });
        }
      });
    }
  
    async getItemRecord(itemName) {
      const objectId = NeoDataExtractor.ShopWizard.getObjectId();
  
      if (itemName) {
        // try to get item record from database
        let itemRecord = await DatabaseClient.fetchItemRecordByName(itemName);
  
        if (!itemRecord && objectId) {
          itemRecord = new ItemRecord(objectId, { name: itemName });
          await DatabaseClient.writeNewItemRecord(itemRecord.toDatabaseFormat());
        } else {
          itemRecord = ItemRecord.fromDocument(objectId, itemRecord);
        }
  
        return itemRecord;
      } else {
        return null;
      }
    }
  
    newSearchAttempt() {
      if (!this.banned) {
        this.updateHourlySearches(true);
      }
  
      switch (this.SWEvent.searchEventType) {
        case SearchEventType.VALID:
          this.searchAttempts++;
          this.marketAgg.processSubmarket(NeoDataExtractor.ShopWizard.getSearchResults());
          this.injector.injectResults(this);
          break;
  
        case SearchEventType.EMPTY:
          this.searchAttempts++;
          this.emptySearch();
          break;
  
        case SearchEventType.SW_BAN:
          this.shopWizardBan();
          break;
  
        case SearchEventType.INVALID_SEARCH:
          console.log("Search result is invalid.");
          break;
  
        case SearchEventType.UNKNOWN:
          console.log("Search result type is unknown.");
          break;
      }
    }
  
    async wizardFormResultsChange(mutationsList) {
      for (let mutation of mutationsList) {
        if (this.shouldIgnoreMutation(mutation)) {
          return;
        }
  
        this.SWEvent.processSearchEvent(); // will read the DOM and get all necessary information
  
        if (this.SWEvent.isNewSearch) {
          this.itemRecord = await this.getItemRecord(this.SWEvent.searchItem);
          this.marketAgg = new MarketAggregator(this.itemRecord);
        }
  
        this.newSearchAttempt();
        break; // Any further mutations have always been Extension injections
      }
    }
  
    emptySearch() {
      // Call this when a search result is empty (no shops found)
      // This can only be called once because subsequent empty submarkets cannot be distinguished.
      if (!this.foundEmptySubmarket) {
        this.foundEmptySubmarket = true;
      }
      this.injector.injectResults(this);
    }
  
    shopWizardBan() {
      this.banned = true;
      console.log("Shop Wizard Ban Triggered");
      this.injector.injectResults(this);
    }
  
    observeWizardFormResults() {
      const targetElement = document.querySelector('#shopWizardFormResults');
      this.observer = new MutationObserver(this.wizardFormResultsChange.bind(this));
      this.observer.observe(targetElement, { childList: true });
    }
  
    shouldIgnoreMutation(mutation) {
      // Check for added nodes with the specified attribute
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        if (this.hasAttributeInTree(mutation.addedNodes[i], this.injectAttribute, 'true')) {
          return true; // Ignore extensions injection mutations
        }
      }
  
      // Check for removed nodes that match the specified criteria - this seems to happen during SW Ban
      const hasIgnoredRemovedNode = Array.from(mutation.removedNodes).some(node =>
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName === 'DIV' &&
        node.classList.contains('wizard-char') &&
        node.classList.contains('wizard-char-single') &&
        node.classList.contains('wizard-char-old')
      );
  
      if (hasIgnoredRemovedNode) {
        return true; // Ignore this mutation
      }
  
      return false; // Do not ignore this mutation
    }
  
    hasAttributeInTree(node, attributeName, attributeValue) {
      if (node.getAttribute && node.getAttribute(attributeName) === attributeValue) {
        return true;
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        if (this.hasAttributeInTree(node.childNodes[i], attributeName, attributeValue)) {
          return true;
        }
      }
      return false;
    }
  
    calculateDistinctSubmarkets() {
      if (!this.marketAgg) return 0;
  
      let distinctSubmarketsCount = this.marketAgg.searchedSubmarkets.filter(Boolean).length;
  
      if (this.foundEmptySubmarket) {
        distinctSubmarketsCount += 1;
      }
  
      return distinctSubmarketsCount;
    }
  }
  
  const processor = new ShopWizard();
  