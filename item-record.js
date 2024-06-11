// Class representing item information stored on database
class ItemRecord {
    constructor(objectId, document = {}) {
      this.objectId = objectId;
      this.submarkets = document.submarkets || {};
      this.img = document.img || null;
      this.desc = document.desc || null;
      this.name = document.name || null;
      this.type = document.type || null;
      this.value = document.value || null;
      this.weight = document.weight || null;
      this.rarity = document.rarity || null;
      this.price_history = document.price_history || [];
    }
  
    // Method to create an ItemRecord from a document
    static fromDocument(objectId, document) {
      return new ItemRecord(objectId, document);
    }
  
    // Method to convert the ItemRecord to a database format
    toDatabaseFormat() {
      return {
        submarkets: this.submarkets,
        obj_id: this.objectId,
        img: this.img,
        desc: this.desc,
        name: this.name,
        type: this.type,
        value: this.value,
        weight: this.weight,
        rarity: this.rarity,
        price_history: this.price_history,
      };
    }
  
    // Example method to add a new price history entry
    addPriceHistoryEntry(price, timestamp) {
      this.price_history.push({ p: price, ts: timestamp });
    }
  
    // Method to update submarket data
    updateSubmarket(submarketData) {
      this.submarkets[`sub_${submarketData.index}`] = submarketData;
    }
  
    // Method to get the current supply
    getSupply() {
      return this.submarkets ? this.submarkets.supply : null;
    }
  
    // In the future change this to use price history
    getLatestPrice() {
      const extractShops = (submarkets) => {
        return Object.values(submarkets).flatMap(submarket =>
          submarket.o.map((owner, i) => ({
            owner,
            stock: submarket.s[i],
            price: submarket.p[i]
          }))
        );
      };
  
      const calculateVWAP = (shops, numShopsToConsider = 3) => {
        const sortedShops = shops.sort((a, b) => a.price - b.price).slice(0, numShopsToConsider);
        const totalVolume = sortedShops.reduce((sum, shop) => sum + shop.stock, 0);
        const totalPriceVolume = sortedShops.reduce((sum, shop) => sum + (shop.price * shop.stock), 0);
        return totalVolume ? Math.round(totalPriceVolume / totalVolume) : 0;
      };
  
      const allShops = extractShops(this.submarkets);
      if (!allShops.length) return 0;
  
      const vwapPrice = calculateVWAP(allShops);
  
      return vwapPrice;
    }
  
    getSortedShops() {
      const shops = [];
      for (const submarketKey in this.submarkets) {
        const submarket = this.submarkets[submarketKey];
        if (submarket && submarket.o && submarket.p) {
          for (let i = 0; i < submarket.o.length; i++) {
            shops.push(ShopWizardShop.fromItemRecord(submarket.o[i], submarket.p[i], submarket.s[i], this.objectId));
          }
        }
      }
      // Sort shops by price
      shops.sort((a, b) => a.price - b.price);
      return shops;
    }
  
    getMostRecentUpdate() {
      let mostRecentTimestamp = null;
      for (const submarket of Object.values(this.submarkets)) {
        if (submarket.ts) {
          if (!mostRecentTimestamp || new Date(submarket.ts) > new Date(mostRecentTimestamp)) {
            mostRecentTimestamp = submarket.ts;
          }
        }
      }
      return mostRecentTimestamp;
    }
  
    getOldestUpdate() {
      let oldestTimestamp = null;
      for (const submarket of Object.values(this.submarkets)) {
        if (submarket.ts) {
          if (!oldestTimestamp || new Date(submarket.ts) < new Date(oldestTimestamp)) {
            oldestTimestamp = submarket.ts;
          }
        }
      }
      return oldestTimestamp;
    }
  }