let locationInput = document.getElementById("location");
let suggestions = document.getElementById("suggestions");
let distanceInput = document.getElementById("distance");
let sendButton = document.getElementById("send");
let error = document.getElementById("error");
let result = document.getElementById("result");

let selectedLat = null;
let selectedLon = null;


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

                    console.log("Latitude:", selectedLat);
                    console.log("Longitude:", selectedLon);
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

                let name = document.createElement("h2");
                name.textContent = place.properties.name || "Unknown Restaurant";

                let address = document.createElement("p");
                address.textContent =
                    place.properties.address_line1 || "No address available";

                restaurant.appendChild(name);
                restaurant.appendChild(address);

                result.appendChild(restaurant);
            });
        })
        .catch(err => {
            console.log(err);
            error.textContent = "There was an error finding restaurants.";
        });
});