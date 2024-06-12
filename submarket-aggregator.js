class Submarket {
    constructor(shops) {
        this.shops = shops;
        this.index = NeoUtils.getSubmarketIndexFromUsername(shops[0].owner);
        this.supply = this.calculateSupply();
        this.timestamp = new Date().toISOString();
    }

    // Calculate the total supply of items in this submarket
    calculateSupply() {
        this.supply = this.shops.reduce((total, shop) => total + shop.stock, 0);
    }

    formatDataForStorage() {
        return {
            ts: this.timestamp,
            o: this.shops.map(shop => shop.owner),
            s: this.shops.map(shop => shop.stock),
            p: this.shops.map(shop => shop.price)
        };
    }

    isEqual(otherSubmarket) {
        if (!(otherSubmarket instanceof Submarket)) {
            return false;
        }

        if (this.supply !== otherSubmarket.supply || this.shops.length !== otherSubmarket.shops.length) {
            return false;
        }

        for (let i = 0; i < this.shops.length; i++) {
            if (!this.shops[i].isEqual(otherSubmarket.shops[i])) {
                return false;
            }
        }

        return true;
    }
}
  
class SubmarketAggregator {
    constructor() {
        // this.submarkets = this.initializeSubmarkets(itemRecord.submarkets || {}, itemRecord);
        this.submarkets = Array.from({ length: 13 }, () => null);
        this.allSortedShops = [];
        this.update = false; // flag to indicate if database should be updated.
        this.foundEmptySubmarket = false;
    }

    processSubmarket(shopWizardShops) {
        const newSubmarket = new Submarket(shopWizardShops);

        if (newSubmarket.isEqual(this.submarkets[newSubmarket.index])) {
            return false; // Submarkets are equal, no update needed
        }

        // Update the submarkets and found status
        this.submarkets[newSubmarket.index] = newSubmarket;
        this.sortAllShops();
        this.update = true;

        return true;
    }

    distinctSubmarketsFound() {
        let distinctSubmarketsCount = this.submarkets.filter(submarket => submarket !== null).length;
    
        if (this.foundEmptySubmarket) {
            distinctSubmarketsCount += 1;
        }
    
        return distinctSubmarketsCount;
    }

    sortAllShops() {
        // Flatten all shops from all submarkets into one list, ignoring null submarkets
        this.allSortedShops = this.submarkets.reduce((acc, submarket) => {
            if (submarket) {
                return acc.concat(submarket.shops);
            }
            return acc;
        }, []);
    
        // Sort the combined list of shops by price
        this.allSortedShops.sort((a, b) => {
            if (a.price < b.price) return -1;
            if (a.price > b.price) return 1;
            return 0;
        });
    }
}
