let locationInput = document.getElementById("location");
let suggestions = document.getElementById("suggestions");
let distanceInput = document.getElementById("distance");
let sendButton = document.getElementById("send");
let error = document.getElementById("error");
let result = document.getElementById("result");

let selectedLat = null;
let selectedLon = null;


// DISTANCE CALCULATOR (Haversine Formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad = Math.PI / 180;
    
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; 
}

// AUTOCOMPLETE
locationInput.addEventListener("input", () => {

    let text = locationInput.value;

    selectedLat = null;
    selectedLon = null;

    suggestions.replaceChildren();

    if (text.length < 2) {
        return;
    }

    fetch(`/autocomplete?text=${encodeURIComponent(text)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Autocomplete failed");
            }
            return response.json();
        })
        .then(data => {
            const places = Array.isArray(data.results)
                ? data.results
                : Array.isArray(data.features)
                    ? data.features.map(feature => feature.properties || feature)
                    : [];

            if (places.length === 0) {
                return;
            }

            places.forEach(place => {
                let option = document.createElement("div");

                const formatted = place.formatted || place.name || "Unknown location";
                const lat = place.lat ?? place.geometry?.coordinates?.[1];
                const lon = place.lon ?? place.geometry?.coordinates?.[0];

                option.textContent = formatted;

                option.addEventListener("click", () => {
                    locationInput.value = formatted;

                    selectedLat = lat;
                    selectedLon = lon;

                    suggestions.replaceChildren();
                });

                suggestions.appendChild(option);
            });
        })
        .catch(err => {
            console.log(err);
        });
});

// FIND RESTAURANTS
sendButton.addEventListener("click", () => {

    error.textContent = "";
    result.replaceChildren();

    if (selectedLat === null || selectedLon === null) {
        error.textContent = "Please select a location from the suggestions.";
        return;
    }

    let distance = distanceInput.value;

    fetch(`/restaurant?lat=${selectedLat}&lon=${selectedLon}&distance=${distance}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not get restaurants");
            }
            return response.json();
        })
        .then(data => {

            let restaurants = data.features;

            if (restaurants.length === 0) {
                result.textContent = "No restaurants found.";
                return;
            }

            restaurants.forEach(place => {

                let restaurant = document.createElement("div");

                //Name
                let name = document.createElement("h2");
                let restaurantName = place.properties.name || "Unknown Restaurant";
                name.textContent = restaurantName;

                //Address 
                let address = document.createElement("p");
                let fullAddress = place.properties.formatted || 
                                  `${place.properties.address_line1 || ""} ${place.properties.address_line2 || ""}`.trim();
                address.textContent = fullAddress ? `Address: ${fullAddress}` : "Address: No address available";

                //Website
                let websiteContainer = document.createElement("p");
                if (place.properties.website) {
                    let websiteLink = document.createElement("a");
                    websiteLink.href = place.properties.website;
                    websiteLink.textContent = "Visit Website";
                    websiteLink.target = "_blank"
                    websiteContainer.appendChild(websiteLink);
                } 
                else {
                    websiteContainer.textContent = "Website: Not available";
                }

                //Distance Calculation
                let distanceDisplay = document.createElement("p");
                let restLat = place.properties.lat;
                let restLon = place.properties.lon;

                if (restLat && restLon && selectedLat && selectedLon) {
                    let distInMeters = calculateDistance(selectedLat, selectedLon, restLat, restLon);
                    let distInMiles = (distInMeters * 0.000621371).toFixed(2); 
                    distanceDisplay.textContent = `Distance: ${Math.round(distInMeters)} meters (${distInMiles} miles)`;
                } else {
                    distanceDisplay.textContent = "Distance: Coordinates unavailable";
                }

                //Select Button
                let selectBtn = document.createElement("button");
                selectBtn.textContent = "Select";
                selectBtn.style.marginTop = "10px";
                
                selectBtn.addEventListener("click", () => {
                    selectBtn.textContent = "Added!";
                    selectBtn.style.backgroundColor = "green";
                    selectBtn.disabled = true; 
                });

                restaurant.appendChild(name);
                restaurant.appendChild(address);
                restaurant.appendChild(websiteContainer);
                restaurant.appendChild(distanceDisplay);
                restaurant.appendChild(selectBtn);

                result.appendChild(restaurant);
            });
        })
        .catch(err => {
            console.log(err);
            error.textContent = "There was an error finding restaurants.";
        });
});