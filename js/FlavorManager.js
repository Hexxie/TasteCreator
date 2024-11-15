const flavorNames = {
    bitter: "Гіркий",
    salty: "Солоний",
    sour: "Кислий",
    sweet: "Солодкий",
    umami: "Пряний"
};

class FlavorsManager {
    constructor(tasteProfilesUrl) {
        // Load taste Profiles from tasteprofiles.json, should be refactored to DB with tastes
        this.tasteProfilesUrl = tasteProfilesUrl;
        this.tasteProfiles = null;
        this.activeFlavors = {};
    }

    async loadTasteProfiles() {
        try {
            this.tasteProfiles = await d3.json(this.tasteProfilesUrl);
            console.log("Taste profiles loaded successfully");
        } catch (error) {
            console.error("Error loading taste profiles:", error);
        }
    }

    getFlavorProfile(productName) {
        if(!this.tasteProfiles) {
            console.warn("Taste profiles are not loaded yet.");
            return { bitter: 0, salty: 0, sour: 0, sweet: 0, umami: 0 };
        }

        //Find a taste profile for product name
        // The example form:
        //  { "product": "Баклажан", 
        //    "taste": {"bitter": 13, "salty": 0, "sour": 7, "sweet": 7, "umami": 0}},
        const product = this.tasteProfiles.find(item => item.product === productName);

        // Check that product and it's taste exists
        if (product && product.taste) {
            console.log(product.taste)
          //  this.nodeFlavors[productName] = product.taste;

            return product.taste;
        } else {
            console.error(`No taste data found for: ${productName}`);

            return 0;
        }
    }

    // ProductWeights are with the next structure
    // {Кабачок: 100}
    applyTastes(productWeights) {
        // reset flavors
        this.activeFlavors = { bitter: 0, salty: 0, sour: 0, sweet: 0, umami: 0 };

        // get total weight of all products
        let totalWeight = Object.values(productWeights).reduce((a, b) => a + Number(b), 0);

        // For each product in productWeights
        for (let product in productWeights) {

            // Get it's current weight
            let weight = productWeights[product];

            // Load it's flavour from tasteprofiles
            let flavor = this.getFlavorProfile(product);
            console.log(flavor)
            console.log(this.activeFlavors)

            if(flavor) {
                Object.keys(flavor).forEach(key => {
                    this.activeFlavors[key] += (flavor[key] * weight) / totalWeight;
                });
            }
        }
        this.refreshTasteList();
    }

    refreshTasteList() {
        console.log('Total Flavors:', this.activeFlavors);
    
        d3.select("#taste-list").selectAll("li").remove();
    
        const data = Object.entries(this.activeFlavors)
            .filter(([key, value]) => value > 0)
            .sort((a, b) => b[1] - a[1]);
    
        console.log('Data for taste list:', data);
    
        d3.select("#taste-list")
            .selectAll("li")
            .data(data)
            .enter()
            .append("li")
            .text(([key, value]) => `${flavorNames[key]}`)
            .style("font-size", ([, value]) => `${Math.min(10 + value * 2, 40)}px`);
    }

}

export default FlavorsManager;