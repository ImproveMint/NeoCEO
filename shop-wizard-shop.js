// Stores Shop Wizard Search Result Shop
class ShopWizardShop {
    constructor(html) {
      this.owner = ShopWizardShop.extractShopOwner(html);
      this.price = ShopWizardShop.extractPrice(html);
      this.stock = ShopWizardShop.extractQuantity(html);
      this.shopLink = ShopWizardShop.extractShopLink(html);
      this.html = this.createHTMLListItem();
    }
  
    static extractShopLink(html) {
      return html.querySelector('a')?.getAttribute('href') || '';
    }
  
    static extractPrice(html) {
      const priceText = html.querySelector('.wizard-results-price')?.textContent || '0';
      return Number(priceText.replace(/[^\d]/g, ''));
    }
  
    static extractQuantity(html) {
      return Number(html.querySelector('p')?.textContent || '0');
    }
  
    static extractShopOwner(html) {
      return html.querySelector('a')?.textContent || '';
    }
  
    createshopLink() {
      return `/browseshop.phtml?owner=${this.owner}&buy_obj_info_id=${this.objectId}&buy_cost_neopoints=${this.price}`;
    }
  
    createHTMLListItem() {
      const imgSrc = chrome.runtime.getURL('images/neoceo16.png'); // Get the full URL to the image in the extension
      const priceFormatted = this.price.toLocaleString(); // Formats price with commas
      const logoHTML = this.isOriginal ? `<img src="${imgSrc}" alt="Extension Logo">` : ''; // Add your extension logo URL
  
      const listItemHTML = `
      <li>
        <a href="${this.shopLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; vertical-align: top;">${logoHTML} ${this.owner}</a>
        <p>${this.stock}</p>
        <div class="wizard-results-price">${priceFormatted} NP</div>
      </li>
    `;
  
      // Create a template element to parse the HTML string
      const template = document.createElement('template');
      template.innerHTML = listItemHTML.trim(); // Trim to ensure no surrounding whitespace
      return template.content.firstChild;
    }
  
    isEqual(otherShop) {
      return this.owner === otherShop.owner && this.price === otherShop.price && this.stock === otherShop.stock;
    }
}
  