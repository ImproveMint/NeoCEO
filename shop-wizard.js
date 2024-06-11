class ShopWizard {
    constructor() {
      this.observer = this.observeWizardFormResults();
  
      this.shopWizardEvent = new ShopWizardEventHandler();
      this.injector = new ShopWizardInjector();
      this.marketAgg = null;
  
      this.shopWizardBanned = false;
      this.searchAttempts = 0;
      this.hourlySearches = this.updateHourlySearches();
    }
  
    async wizardFormResultsChange(mutationsList) {
      for (let mutation of mutationsList) {
        if (this.shouldIgnoreMutation(mutation)) {
          return;
        }
  
        this.shopWizardEvent.processSearchEvent(); // will read the DOM and get all necessary information
  
        if (this.shopWizardEvent.isNewSearch) {
          // this.itemRecord = await this.getItemRecord(this.shopWizardEvent.searchItem);
        //   this.marketAgg = new SubmarketAggregator(this.itemRecord);
          this.marketAgg = new SubmarketAggregator(null);
        }
  
        this.newSearchAttempt();
        break; // Any further mutations have always been Extension injections
      }
    }

    newSearchAttempt() {
        if (!this.shopWizardBanned) {
          this.updateHourlySearches(true);
          this.searchAttempts++;
        }

        if (this.shopWizardEvent.searchEventType == SearchEventType.INVALID_SEARCH ||  this.shopWizardEvent.searchEventType == SearchEventType.UNKNOWN){
            console.log("Search result error:", this.shopWizardEvent.searchEventType);
            return;
        }
    
        switch (this.shopWizardEvent.searchEventType) {
          case SearchEventType.VALID:
            this.marketAgg.processSubmarket(NeoDataExtractor.ShopWizard.getShops());
            break;
    
          case SearchEventType.EMPTY:
            this.marketAgg.foundEmptySubmarket = true;
            break;
    
          case SearchEventType.SW_BAN:
            this.shopWizardBanned = true;
            break;
        }
        this.injector.injectResults(this);
    }
  
    observeWizardFormResults() {
      const targetElement = document.querySelector('#shopWizardFormResults');
      const observer = new MutationObserver(this.wizardFormResultsChange.bind(this));
      observer.observe(targetElement, { childList: true });
      return observer;
    }
  
    shouldIgnoreMutation(mutation) {
      // Check for added nodes with the specified attribute
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        if (this.hasAttributeInTree(mutation.addedNodes[i], "neoceo-inject", 'true')) {
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
  }
  
  const processor = new ShopWizard();
  