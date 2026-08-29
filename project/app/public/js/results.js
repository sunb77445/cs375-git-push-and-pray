
// Page Components
let hotelPage = document.getElementById("hotels-results");
let flightPage = document.getElementById("flights-results");
let foodPage = document.getElementById("food-results");
let selections = document.getElementById("selected-results");
let message = document.getElementById("message");
const pages = Array.from(document.getElementsByClassName('results-page'));
const tabs = Array.from(document.getElementsByClassName('tab-button'));

let hotelSelectionElement = document.getElementById("selected-hotel");
let flightSelection = document.getElementById("selected-flight");
let foodSelection = document.getElementById("selected-restaurants");

let save = document.getElementById("save-trip");
let alloc = document.getElementById("calc");
let total = document.getElementById("total");

// API Params
const params = new URLSearchParams(window.location.search);
let destCity = params.get("destCity");
let destState = params.get("destState");
let destCountry = params.get("destCountry");
let destLat = params.get("destLat");
let destLon = params.get("destLon");
let fromCity = params.get("fromCity");
let fromState = params.get("fromState");
let fromDate = params.get("fromDate");
let toDate = params.get("toDate");
let numTravelers = params.get("numTravelers");
let totalBudget = params.get("totalBudget");
let foodBudget = params.get("foodBudget");
let hotelBudget = params.get("hotelBudget");
let flightBudget = params.get("flightBudget");
let attractionsBudget = params.get("attractionsBudget");
let tripName = params.get("tripName");


// response data
let hotelData, flightData, foodData;

let userId;
let tripId;

async function getHotels(){
    let hotelResponse = await fetch(`/api/hotels?q=hotels in ${destCity} ${destCountry}&check_in_date=${fromDate}&check_out_date=${toDate}&adults=${numTravelers}&max_price=${hotelBudget}`);
    let hotelBody = await hotelResponse.json();
    console.log(hotelBody);
    hotelData = hotelBody;
    formatHotels(hotelBody.properties, hotelPage);
    selectHotel(hotelPage);
}

async function getFlights(){
    let flightResponse = await fetch("/flights", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }, 
        body: JSON.stringify({
            passengers: numTravelers,
            from: fromCity,
            to: destCity,
            depart: fromDate,
            returnDate: toDate
        }),
    });
    let flightBody = await flightResponse.json();
    console.log(flightBody);
    renderResults(flightBody.flights, flightPage);

}

async function getFood(){
    let lat = destLat;
    let lon = destLon;

    if (lat === null || lon === null) {
        let geoResponse = await fetch(`/geocode?city=${destCity}`);
        let geoBody = await geoResponse.json();
        lat = geoBody.lat;
        lon = geoBody.lon;
    }

    selectedLat = Number(lat);
    selectedLon = Number(lon);
    let foodResponse = await fetch(`/restaurant?lat=${lat}&lon=${lon}&distance=1000`);
    let foodBody = await foodResponse.json();
    foodData = foodBody;

    console.log(foodBody); 
    loadAndRenderRestaurants(foodBody.features, foodPage);
}

function getHotelSelection(list){
    const selectedButtons = document.getElementsByClassName("selected");

    Array.from(selectedButtons).forEach(btn => {
        const hotelInfo = btn.parentElement;
        list.push(hotelData.properties[hotelInfo.id]);
    });

    return list;
}

function getFoodSelection(list){
    const selectedButtons = document.getElementsByClassName("selected-food");

    Array.from(selectedButtons).forEach(btn => {
        const foodInfo = btn.parentElement;
        list.push(foodData.features[foodInfo.id]);
    });

    return list;
}


async function saveTrip(userId){


    // Save trip to db
    try {
    const tripResponse = await fetch("/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId,
                    name: tripName,
                    depart: fromDate,
                    return: toDate,
                    destination: `${destCity}, ${destState} ${destCountry}`
                }),

            });
    
              if (!tripResponse.ok) {
                throw new Error("Error saving trip");
             }

             const data = await tripResponse.json();
             tripId = data.trip_id;
             console.log("Trip Saved!", tripId);
             
    } catch (error){
        console.log(error.message);
        return;
    }
   

    // Save hotel to db
    try {
        const selectedHotels = getHotelSelection([]);

        for (const selectedHotel of selectedHotels) {
            await fetch("/api/hotels/save",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            tripId: tripId,
                            hotel: selectedHotel.name,
                            price: selectedHotel.rate_per_night.extracted_lowest,
                            check_in: fromDate,
                            check_out: toDate,
                            guests: numTravelers
                        }),

                    });
        }
    } catch (error) {
        console.log("Error saving hotel:", error.message);
    }

    // Save selected restaurants to the newly created trip
    try {
        for (const restaurant of window.selectedRestaurants) {
            await fetch("/save-restaurant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tripId: tripId,
                    name: restaurant.name,
                    address: restaurant.address,
                    website: restaurant.website,
                    distance: restaurant.distance
                })
            });
        }
    } catch (error) {
        console.log("Error saving restaurant:", error.message);
    }

}

function renderSelectedRestaurants(restaurants, container) {
     container.innerHTML = "";

    if (!restaurants || restaurants.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.className = "empty-note";
        emptyNote.textContent = "No restaurants selected yet.";
        container.appendChild(emptyNote);
        return;
    }

    restaurants.forEach(restaurant => {
        const card = document.createElement("div");
        card.className = "saved-restaurant-card";

        const restaurantName = document.createElement("h3");
        restaurantName.className = "saved-restaurant-name";
        restaurantName.textContent = restaurant.properties.name;

        const address = document.createElement("p");
        address.className = "saved-restaurant-address";
        address.textContent = restaurant.properties.address_line2 || "Address unavailable";

        card.append(restaurantName, address);

        if (restaurant.properties.website) {
            const website = document.createElement("a");
            website.href = restaurant.properties.website;
            website.target = "_blank";
            website.rel = "noopener noreferrer";
            website.textContent = "Visit Website";
            card.appendChild(website);
        }

        container.appendChild(card);
    });
}


// Load hotels by default
window.addEventListener('load', async (event) => {
   await getHotels();
   await getFlights();
   await getFood();
   loadingScreen.style.display = 'none';
});


// Allow for tab switching/visibility 
tabs.forEach(tab => {
    tab.addEventListener("click", (event) =>{

        // When a tab is click, inactive all other tabs and pages
        tabs.forEach(tab => {
            tab.classList.remove("active");
        });

        pages.forEach(page => {
            page.classList.remove("active");
        });

        // Activate selected page/tab
        let page = document.getElementById(`${tab.id}-results`);
        page.classList.toggle("active");
        tab.classList.toggle("active");

        if(page.id == "selected-results"){
             message.textContent = "Here's what you've selected!";


             // Display selected hotels
             let hotelSelection = getHotelSelection([]);
             hotelSelectionElement.replaceChildren();
             formatHotel(hotelSelection, hotelSelectionElement);

             let hotelCost = 0;
             for (const hotel of hotelSelection) {
                 if (hotel.total_rate && hotel.total_rate.extracted_lowest) {
                     hotelCost += hotel.total_rate.extracted_lowest;
                 }
             }

             // Display selected restaurants
             renderSelectedRestaurants(getFoodSelection([]), foodSelection);


             // Display selected flights
             flightSelection.replaceChildren();
             let flightCost = 0;
             if (typeof selectedFlight !== "undefined" && selectedFlight) {
                 const flightEl = document.createElement("div");
                 flightEl.innerHTML = `
                    <h2>${selectedFlight.route}</h2>
                    <p>${selectedFlight.meta || ""}</p>
                    <p>Price: $${selectedFlight.price}</p>
                 `;
                 flightSelection.appendChild(flightEl);
                 flightCost = Number(selectedFlight.price) || 0;
             } else {
                 flightSelection.textContent = "No flight selected";
             }
             

             let totalCost = hotelCost + flightCost;
             total.textContent = `Total Cost: $${totalCost}`;
             alloc.textContent = `You've used ${((totalCost / totalBudget) * 100).toFixed(1)}% of your budget!`

        } else {
            message.textContent = "Here are your results!";
        }

    });
});


// Save all selections and trip to database
save.addEventListener("click", async () => {

    // get user id
    try {
        const response = await fetch("/current-user");
        const data = await response.json();

        if(data.loggedIn == false){
            console.log("Not logged in");
        } else {
            userId = data.user.id;

            // Save all info to db
            await saveTrip(userId);
            window.location.href = '/html/dashboard.html';

        }
    } catch (error) {
        console.log(error);
    }


});




