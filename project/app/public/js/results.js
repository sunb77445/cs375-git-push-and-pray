
// Page Components
let hotelPage = document.getElementById("hotels-results");
let flightPage = document.getElementById("flights-results");
let foodPage = document.getElementById("food-results");
let selections = document.getElementById("food-results");
let message = document.getElementById("message");
const pages = Array.from(document.getElementsByClassName('results-page'));
const tabs = Array.from(document.getElementsByClassName('tab-button'));

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



async function getHotels(){
    let hotelResponse = await fetch(`/api/hotels?q=hotels in ${destCity} ${destCountry}&check_in_date=${fromDate}&check_out_date=${toDate}&adults=${numTravelers}&max_price=${hotelBudget}`);
    let hotelBody = await hotelResponse.json();
    console.log(hotelBody);

    formatHotels(hotelBody.properties, hotelPage);
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
    console.log(lat, lon);
    console.log(`/restaurant?lat=${lat}&lon=${lon}&distance=1000`);
    let foodResponse = await fetch(`/restaurant?lat=${lat}&lon=${lon}&distance=1000`);
    let foodBody = await foodResponse.json();

    console.log(foodBody); 
    renderRestaurants(foodBody.features, foodPage);
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
        } else {
            message.textContent = "Here are your results!";
        }

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

});



