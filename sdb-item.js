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