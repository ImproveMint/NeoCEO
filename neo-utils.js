class NeoUtils {
  // Function to create a styled rarity span
  static createRaritySpan(rarity, text) {
    if (rarity == null) {
      return document.createElement('span'); // return empty span if rarity is null or undefined
    }
  
    const colors = {
      rare: 'rgb(0, 128, 0)',
      special: 'rgb(170, 68, 85)',
      superRare: 'rgb(255, 0, 0)',
      retired: 'rgb(102, 102, 102)'
    };
  
    const fontStyle = 'padding-top: 4px; font-weight: bold; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 9pt;';
  
    // Create the rarity span
    const raritySpan = document.createElement('span');
    raritySpan.className = 'neoceo-rarity';
    raritySpan.textContent = `${text}`;
  
    // Apply color based on rarity
    let rarityColor = '';
  
    if (rarity >= 70 && rarity <= 100) {
      rarityColor = colors.rare;
    } else if (rarity == 101) {
      rarityColor = colors.special;
    } else if (rarity > 101 && rarity != 180) {
      rarityColor = colors.superRare;
    } else if (rarity == 180) {
      rarityColor = colors.retired;
    }
  
    // Apply styles to the raritySpan
    raritySpan.style.cssText = `${fontStyle} color: ${rarityColor};`;
  
    return raritySpan;
  }

  static getSubmarketIndexFromUsername(username) {
    let firstChar = username.charCodeAt(0);
    let submarket;

    if (firstChar === 95) {
      // usernames starting with underscores
      submarket = 10;
    } else if (firstChar < 60) { // Case when firstChar is a letter or digit
      submarket = firstChar % 48;
    } else {
      submarket = firstChar % 97;
      if (submarket >= 13) {
        submarket = submarket % 13;
      }
    }

    return submarket;
  }

  // Function to create user friendly text from timestamp
  static getLatestPriceUpdateText(timestamp) {
    const serverTimestamp = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - serverTimestamp.getTime();

    let lastUpdateText;
    if (diff < 60000) {
      lastUpdateText = "Just now";
    } else if (diff < 3600000) {
      const minutes = Math.round(diff / 60000);
      lastUpdateText = `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (diff < 86400000) {
      const hours = Math.round(diff / 3600000);
      lastUpdateText = `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      const days = Math.round(diff / 86400000);
      lastUpdateText = `${days} day${days !== 1 ? "s" : ""} ago`;

      if (days > 5000){
        lastUpdateText = "Never";
      }
    }

    return lastUpdateText;
  }

  // Function that returns statistical search depth after x searches
  static statisticalShopWizardProgress(searches){
    // Coefficients that approximate empiral data
    const searchLimit = 50;
    const coefficients = [1.50353780e+00, 7.27859745e+00, -2.26862893e-01, 3.36336597e-03, -1.92445809e-05];
    
    if (searches >= searchLimit) {
      return 100;
    }

    // This polynomial approximates the statistical percentage of submarkets found after x searches
    let searchDepthPct = 0;

    for (let i = 0; i < coefficients.length; i++) {
      searchDepthPct += coefficients[i] * Math.pow(searches, i);
    }

    return searchDepthPct;
  }
}
  