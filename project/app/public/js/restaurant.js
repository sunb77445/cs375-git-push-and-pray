let locationInput = document.getElementById("location");
let suggestions = document.getElementById("suggestions");
let distanceInput = document.getElementById("distance");
let sendButton = document.getElementById("send");
let error2 = document.getElementById("error");
let result = document.getElementById("result");


let selectedLat = null;
let selectedLon = null;

// Tracks the restaurant currently selected on the results page
let selectedRestaurant = null;

// Hardcoded for now. In the future, this can come from localStorage or URL query parameters.
let currentTripId = 1;


function loadAndRenderRestaurants(places, element) {
    if (!currentTripId) {
        renderRestaurants(places, element, []);
        return;
    }


    fetch("/saved-restaurants/" + currentTripId)
        .then(res => res.json())
        .then(data => {
            let savedList = [];
            if (data.success) {
                savedList = data.restaurants;
            }
            renderRestaurants(places, element, savedList);
        })
        .catch(err => {
            console.error("Error fetching saved restaurants:", err);
            renderRestaurants(places, element, []);
        });
}


// Displaying restaurants with Select/Deselect functionality
function renderRestaurants(data, element, savedList) {
    element.replaceChildren();


    data.forEach(place => {
        let restaurant = document.createElement("div");


        // Name
        let name = document.createElement("h2");
        let restaurantName = place.properties.name || "Unknown Restaurant";
        name.textContent = restaurantName;


        // Address
        let address = document.createElement("p");
        let fullAddress = place.properties.formatted ||
            `${place.properties.address_line1 || ""} ${place.properties.address_line2 || ""}`.trim();
        address.textContent = fullAddress ? `Address: ${fullAddress}` : "Address: No address available";


        // Website
        let websiteContainer = document.createElement("p");
        let websiteUrl = place.properties.website || null;
        if (websiteUrl) {
            let websiteLink = document.createElement("a");
            websiteLink.href = websiteUrl;
            websiteLink.textContent = "Visit Website";
            websiteContainer.appendChild(websiteLink);
        } else {
            websiteContainer.textContent = "Website: Not available";
        }


        // Distance Calculation
        let distanceDisplay = document.createElement("p");
        let restLat = place.properties.lat;
        let restLon = place.properties.lon;
        let calculatedMiles = null;


        if (restLat && restLon && selectedLat && selectedLon) {
            let distInMeters = calculateDistance(selectedLat, selectedLon, restLat, restLon);
            calculatedMiles = parseFloat((distInMeters * 0.000621371).toFixed(2));
            distanceDisplay.textContent = `Distance: ${calculatedMiles} miles`;
        } else {
            distanceDisplay.textContent = "Distance: Coordinates unavailable";
        }


        // Check if already saved in Supabase
        let existingRecord = null;
        if (savedList) {
            for (let i = 0; i < savedList.length; i++) {
                if (savedList[i].name === restaurantName && savedList[i].address === fullAddress) {
                    existingRecord = savedList[i];
                    break;
                }
            }
        }


        // Select Button & State
        let selectBtn = document.createElement("button");
        let savedDatabaseId = existingRecord ? existingRecord.id : null;


        if (savedDatabaseId) {
            selectBtn.textContent = "Deselect";
            selectBtn.style.backgroundColor = "orange";
        } else {
            selectBtn.textContent = "Select";
            selectBtn.style.backgroundColor = "";
        }


        selectBtn.addEventListener("click", () => {
            if (selectBtn.textContent === "Select") {
                // SAVE TO SUPABASE
                fetch("/save-restaurant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tripId: currentTripId,
                        name: restaurantName,
                        address: fullAddress,
                        website: websiteUrl,
                        distance: calculatedMiles
                    })
                })
                .then(res => res.json())
                .then(response => {
                    if (response.success) {
                        savedDatabaseId = null;
                        selectBtn.textContent = "Select";
                        selectBtn.style.backgroundColor = "";
                        if (selectedRestaurant && selectedRestaurant.name === restaurantName) {
                            selectedRestaurant = null;
                        }
                    } else {
                        alert(response.message);
                    }
                })
                .catch(err => console.error("Error removing:", err));


            } else {
                // REMOVE FROM SUPABASE
                fetch("/remove-restaurant/" + savedDatabaseId, {
                    method: "DELETE"
                })
                .then(res => res.json())
                .then(response => {
                    if (response.success) {
                        savedDatabaseId = null;
                        selectBtn.textContent = "Select";
                        selectBtn.style.backgroundColor = "";
                    } else {
                        alert(response.message);
                    }
                })
                .catch(err => console.error("Error removing:", err));
            }
        });


        restaurant.appendChild(name);
        restaurant.appendChild(address);
        restaurant.appendChild(websiteContainer);
        restaurant.appendChild(distanceDisplay);
        restaurant.appendChild(selectBtn);


        element.appendChild(restaurant);
    });
}


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


    fetch(`/autocomplete?text=${text}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Autocomplete failed");
            }
            return response.json();
        })
        .then(data => {
            const places = data.features || [];


            if (places.length === 0) {
                return;
            }


            places.forEach(place => {
                let option = document.createElement("div");


                const formatted = place.properties.formatted || "Unknown location";
                const lat = place.geometry.coordinates[1];
                const lon = place.geometry.coordinates[0];


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
    error2.textContent = "";
    result.replaceChildren();


    if (selectedLat === null || selectedLon === null) {
        error2.textContent = "Please select a location from the suggestions.";
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
            console.log(data);
            let restaurants = data.features;


            if (restaurants.length === 0) {
                result.textContent = "No restaurants found.";
                return;
            }


            loadAndRenderRestaurants(restaurants, result);
        })
        .catch(err => {
            console.log(err);
            error2.textContent = "There was an error finding restaurants.";
        });
});