class SDBItem {
    constructor(name, objectId, description, type, quantity, img, html) {
      this.name = name;
      this.desc = description;
      this.objectId = objectId;
      this.type = type;
      this.quantity = quantity;
      this.img = img;
      this.html = html;
      this.price = 0;
      this.totalValue = 0;
      this.timestamp = null;
    }
  
    static createItemFromSDBHTML(html) {
        let name, description, type, quantity, imgSrc;
  
        // Extract the name
        const nameElement = html.querySelector('td:nth-child(2) b');
        name = nameElement.innerHTML.split('<br>')[0].trim(); // name includes the rarity text. This accounts for that
  
        // Extract the description
        const descriptionElement = html.querySelector('td:nth-child(3) i');
        if (descriptionElement) {description = descriptionElement.textContent.trim();}
    
        // Extract the type
        const typeElement = html.querySelector('td:nth-child(4) b');
        if (typeElement) {type = typeElement.textContent.trim();}
    
        // Extract the quantity
        const quantityElement = html.querySelector('td:nth-child(5) b');
        if (quantityElement) {quantity = parseInt(quantityElement.textContent.trim(), 10);}
  
        // Extract the image source
        const imgElement = html.querySelector('img');
        if (imgElement) {imgSrc = imgElement.src;}
  
        // Extract the objectId
        const objectId = SDBItem.extractObjectId(html);
  
        return new SDBItem(name, objectId, description, type, quantity, imgSrc, html);
    }
  
    // Very import that this is extracted as a string and not an int so it can be written to database.
    static extractObjectId(trElement) {
      // Find the input element with the name attribute that starts with "back_to_inv"
      const inputElement = trElement.querySelector('input[name^="back_to_inv"]');
      
      if (!inputElement) {
        console.error('No input element with name "back_to_inv*" found.');
        return null;
      }
    
      // Extract the name attribute value
      const nameAttr = inputElement.getAttribute('name');
    
      // Use a regular expression to extract the integer between the brackets
      const match = nameAttr.match(/\[(\d+)\]/);
    
      if (match && match[1]) {
        return match[1];  // Return as string
      } else {
        console.error('No integer found between brackets in the name attribute.');
        return null;
      }
    }  
  
    addPrice(price, timestamp){
        this.price = price;
        this.totalValue = price * this.quantity;
        this.timestamp = timestamp;
    }
  
    printParameters() {
      return `Item: ${this.name}, Type: ${this.type}, Quantity: ${this.quantity}`;
    }
  }
  
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
  
    static getSDBItems(){
      const itemRows = document.querySelectorAll('tr[bgcolor="#F6F6F6"], tr[bgcolor="#FFFFFF"]');
      const items = Array.from(itemRows).map(SDBItem.createItemFromSDBHTML);
      return items;
    }
  }
  