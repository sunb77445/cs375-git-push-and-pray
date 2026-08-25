
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


// response data
let hotelData, flightData, foodData;

let userId;

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
    renderRestaurants(foodBody.features, foodPage);
}

function getHotelSelection(list){
    let selectedHotel = document.getElementsByClassName("selected")[0].parentElement;
    list.push(hotelData.properties[selectedHotel.id]);

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
        await fetch("/api/hotels/save",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        tripId: tripId,
                        hotel: getHotelSelection([])[0].name,
                        price: getHotelSelection([])[0].rate_per_night.extracted_lowest,
                        check_in: fromDate,
                        check_out: toDate,
                        guests: numTravelers
                    }),

                });
    } catch (error) {
        console.log("Error saving hotel:", error.message);
    }

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

             let hotelSelection = getHotelSelection([]);
             formatHotel(hotelSelection, hotelSelectionElement);

             let hotelCost = hotelSelection[0].total_rate.extracted_lowest;
             let totalCost = hotelCost;
             total.textContent = `Total Cost: $${totalCost}`;
             alloc.textContent = `You've used ${hotelCost / totalBudget}% of your budget!`

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




    // FOR HOTELS TABLE


    // FOR RESTUARANTS TABLE


    // FOR FLIGHTS TABLE


    // await saveTrip();

});



