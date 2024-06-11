class ShopWizardAnalyzer {
    constructor() {
    }

    // Calculate Fair Value using the VWAP of 3 lowest priced shops
    calculateFairValue() {
        if (this.allSortedShops.length === 0) {return 0;}

        // Get lowest priced shops
        const lowestPricedShops = this.allSortedShops.slice(0, numShopsToConsider);
        const numShopsToConsider = 3;

        // Calculate VWAP
        let totalVolume = 0;
        let totalPriceVolume = 0;

        lowestPricedShops.forEach(shop => {
            totalVolume += shop.stock;
            totalPriceVolume += shop.price * shop.stock;
        });

        return totalVolume > 0 ? Math.round(totalPriceVolume / totalVolume) : 0;
    }
}
