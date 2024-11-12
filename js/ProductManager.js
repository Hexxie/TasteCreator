class ProductManager {
    constructor(recipeListSelector, flavorManager) {
        this.recipeList = d3.select(recipeListSelector);
        this.flavorManager = flavorManager;
        this.productWeights = {};
        this.debounceTimer = null; 
    }

    addProduct(productName) {
        // Specify default product weight as 100gram
        this.productWeights[productName] = 100;
        
        // Create list item for product in recipeListSelector
        const productItem = this.recipeList
            .append("li")
            .attr("id", `product-${productName}`);

        // Print product name into the block
        productItem.append("span").text(`${productName}: `);

        // Add input field to manage weight of the product
        // Register an action to update weght when user change it
        productItem
            .append("input")
            .attr("type", "number")
            .attr("value", 100)
            .attr("min", 1)
            .on("input", (event) => this.updateProductWeight(event, productName));

        // Print product weight TODO: could be variable in future
        productItem
            .append("span")
            .text(" г");

        this.flavorManager.applyTastes(this.productWeights);
    }

    removeProduct(productName) {
        delete this.productWeights[productName];

        this.recipeList.select(`#product-${productName}`).remove();

        this.flavorManager.applyTastes(this.productWeights);
    }

    updateProductWeight(event, productName) {
        this.productWeights[productName] = event.target.value;
        console.log(`updateProductWeight: ${productName} weight new value: ${event.target.value}`);

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.flavorManager.applyTastes(this.productWeights), 500);
    }
}

export default ProductManager;