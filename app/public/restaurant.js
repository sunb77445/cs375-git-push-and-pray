let zipInput = document.getElementById("zip");
let button = document.getElementById("send");

button.addEventListener("click", () => {
    let zip = zipInput.value.trim();
    
    let error = document.getElementById("error");
    let resultDiv = document.getElementById("result");

    
    error.textContent = "";

    while (resultDiv.firstChild) {
        resultDiv.removeChild(resultDiv.firstChild);
    }

    if (!zip) {
        error.textContent = "Please enter a ZIP code.";
        return;
    }

    //loadinging
    button.disabled = true;
    button.textContent = "Searching...";
    
    let loadingText = document.createElement("p");
    loadingText.textContent = "Getting the best restaurants in the area... Please wait.";
    
    loadingText.classList.add("loading-message"); 
    
    resultDiv.appendChild(loadingText);

    let requestUrl = `/restaurant?zip=${encodeURIComponent(zip)}`;

    fetch(requestUrl)
        .then((response) => response.json())
        .then((data) => {
            while (resultDiv.firstChild) {
                resultDiv.removeChild(resultDiv.firstChild);
            }
            
            // enable the button
            button.disabled = false;
            button.textContent = "Find Restaurants";

            // error message
            if (data.error) {
                error.textContent = data.error;
                return;
            }

            if (data.length === 0) {
                error.textContent = "No restaurants found in this location.";
                return;
            }

            // get top 10 restaurants
            data.forEach((restaurant, index) => {
                let name = restaurant.name || "Unknown Restaurant Name";
                let address = restaurant.formatted || "Address not available";

                let restaurantContainer = document.createElement("div");
                restaurantContainer.classList.add("restaurant-card");

                // Create <h2> for the restaurant name
                let heading = document.createElement("h2");
                heading.textContent = `${index + 1}. ${name}`;
                restaurantContainer.appendChild(heading);

                // Create <p> for the address
                let addressPara = document.createElement("p");
                let addressLabel = document.createElement("strong");
                addressLabel.textContent = "Address: ";
                
                addressPara.appendChild(addressLabel);
                addressPara.appendChild(document.createTextNode(address));
                restaurantContainer.appendChild(addressPara);

                // Create <p> for the website link if available
                if (restaurant.website) {
                    let websitePara = document.createElement("p");
                    let websiteLink = document.createElement("a");
                    
                    websiteLink.href = restaurant.website;
                    websiteLink.target = "_blank";
                    websiteLink.textContent = "Visit Website";
                    
                    websitePara.appendChild(websiteLink);
                    restaurantContainer.appendChild(websitePara);
                }

                let divider = document.createElement("hr");
                restaurantContainer.appendChild(divider);

                resultDiv.appendChild(restaurantContainer);
            });
        })
        .catch((err) => {
            // Reset UI 
            while (resultDiv.firstChild) {
                resultDiv.removeChild(resultDiv.firstChild);
            }
            button.disabled = false;
            button.textContent = "Find Restaurants";
            
            error.textContent = "Could not fetch restaurant data.";
            console.error(err);
        });
});