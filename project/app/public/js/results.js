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
let foodSelection = document.getElementById("selected-restaurant");

let save = document.getElementById("save-trip");
let alloc = document.getElementById("calc");
let total = document.getElementById("total");

// API Params
const params = new URLSearchParams(window.location.search);
let destCity = params.get("destCity");
let destState = params.get("destState");
let destCountry = params.get("destCountry");
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

// Present when we arrived here from the "Edit" flow on an already-saved
// trip (trip.js's browseFlightsForEdit). editTripId is always set in that
// case; editFlightId is only set when replacing a specific existing flight
// rather than adding a brand new one.
let editTripId = params.get("editTripId");
let editFlightId = params.get("editFlightId");


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
    let geoResponse = await fetch(`/geocode?city=${destCity}`);
    let geoBody = await geoResponse.json();
    let lat = geoBody.lat;
    let lon = geoBody.lon;
    let foodResponse = await fetch(`/restaurant?lat=${lat}&lon=${lon}&distance=1000`);
    let foodBody = await foodResponse.json();

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

async function saveTrip(userId){

    let tripName = `Trip to ${destCity}`;

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

    // Save selected flight to the newly created trip
    try {
        if (typeof selectedFlight !== "undefined" && selectedFlight) {
            await fetch("/api/flights/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tripId: tripId,
                    route: selectedFlight.route,
                    airline: selectedFlight.meta,
                    price: selectedFlight.price,
                    departureTime: selectedFlight.departureTime,
                    arrivalTime: selectedFlight.arrivalTime,
                    duration: selectedFlight.duration,
                    stops: selectedFlight.stops
                })
            });
        }
    } catch (error) {
        console.log("Error saving flight:", error.message);
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


// Load hotels by default
window.addEventListener('load', async (event) => {
   try { await getHotels(); } catch (error) { console.log("Error loading hotels:", error.message); }
   try { await getFlights(); } catch (error) { console.log("Error loading flights:", error.message); }
   try { await getFood(); } catch (error) { console.log("Error loading food:", error.message); }
   loadingScreen.style.display = 'none';

   if (editTripId) {
       setupEditModeBanner();
       document.getElementById("flights").click();
   }
});

// When arriving here in "edit mode" (see trip.js's browseFlightsForEdit),
// shows a banner on the Flights tab so the user can pick a flight and save
// it straight back into their existing trip instead of creating a new one.
function setupEditModeBanner() {
    const banner = document.createElement("div");
    banner.id = "edit-mode-banner";
    banner.innerHTML = `
        <p>Pick a flight below, then confirm to save it to your trip.</p>
        <button id="confirm-edit-flight-btn">Use Selected Flight</button>
    `;
    flightPage.prepend(banner);

    document.getElementById("confirm-edit-flight-btn").addEventListener("click", async () => {
        if (typeof selectedFlight === "undefined" || !selectedFlight) {
            alert("Please select a flight first.");
            return;
        }

        try {
            const endpoint = editFlightId ? `/api/flights/${editFlightId}` : "/api/flights/save";
            const method = editFlightId ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tripId: editTripId,
                    route: selectedFlight.route,
                    airline: selectedFlight.airline,
                    price: selectedFlight.price,
                    departureTime: selectedFlight.departureTime,
                    arrivalTime: selectedFlight.arrivalTime,
                    duration: selectedFlight.duration,
                    stops: selectedFlight.stops
                })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.message || "Could not save flight to trip.");
                return;
            }

            window.location.href = `/html/trip.html?id=${editTripId}`;

        } catch (error) {
            console.error(error);
            alert("Something went wrong saving the flight.");
        }
    });
}

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

             let hotelSelection = getHotelSelection([]);
             hotelSelectionElement.replaceChildren();
             formatHotel(hotelSelection, hotelSelectionElement);

             let hotelCost = 0;
             for (const hotel of hotelSelection) {
                 if (hotel.total_rate && hotel.total_rate.extracted_lowest) {
                     hotelCost += hotel.total_rate.extracted_lowest;
                 }
             }

             // Render the selected flight (selectedFlight comes from flights.js)
             flightSelection.replaceChildren();
             let flightCost = 0;
             if (typeof selectedFlight !== "undefined" && selectedFlight) {
                 const flightEl = document.createElement("div");
                 flightEl.innerHTML = `
                    <h2>${selectedFlight.route}</h2>
                    <p>${selectedFlight.meta || ""}</p>
                    <p>${selectedFlight.departureTime || ""} → ${selectedFlight.arrivalTime || ""}</p>
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

// Save the trip to the database
const saveTripButton = document.getElementById("saveTripButton");

saveTripButton.addEventListener("click", async function() {

    const response = await fetch("/trips", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: `Trip to ${destCity}`,
            dest: destCity,
            fromDate: fromDate,
            toDate: toDate,
            flight: selectedFlight
        })
    });

    const data = await response.json();

    if (data.success) {
        alert("Trip saved!");
    } else {
        alert(data.message || "Could not save trip.");
    }
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