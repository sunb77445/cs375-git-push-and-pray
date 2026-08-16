
// let button1 = document.getElementById("button1").disabled = true;
// button1 = document.getElementById("button1").disabled = false;

let button2 = document.getElementById("button2");
// button2 = document.getElementById("button2").disabled = false;

let loadingScreen = document.querySelector(".loading");
let sliders = document.querySelectorAll(".slider");


// budget preferences
sliders.forEach(slider => {
   let sliderValue = document.getElementById(`${slider.id}-value`);

   slider.addEventListener("input", (event) => {
      sliderValue.textContent = `${event.target.value}%`;
   })
   
});


// formatting
function formatHotels(hotelList){
      hotelList.forEach((hotel) => {

      const hotelElement = document.createElement("div");
      hotelElement.className = "hotel";

      // Hotel image
      const image = hotel.images &&hotel.images.length > 0
          ? `
            <img
              src="${hotel.images[0].thumbnail}"
              alt="${hotel.name || "Hotel"}"
            >
          `
          : "";

      // Rating
      const rating =
        hotel.rating
          ? `<p>${hotel.rating} / 5</p>`
          : "";

      // Reviews
      const reviews =
        hotel.reviews
          ? `<p>${hotel.reviews} reviews</p>`
          : "";

      // Price per night
      const price =
        hotel.rate_per_night?.lowest
          ? `
            <p class="price">
              ${hotel.rate_per_night.lowest}
              per night
            </p>
          `
          : "";

      // Total price
      const total =
        hotel.total_rate?.lowest
          ? `
            <p>
              Total:
              ${hotel.total_rate.lowest}
            </p>
          `
          : "";

      // Description
      const description =
        hotel.description
          ? `<p>${hotel.description}</p>`
          : "";

      hotelElement.innerHTML = `
        ${image}

        <div class="hotel-info">

          <h2>
            ${hotel.name || "Unnamed Hotel"}
          </h2>

          <p>
            ${hotel.type || "Hotel"}
          </p>

          ${rating}

          ${reviews}

          ${price}

          ${total}

          ${description}

        </div>

        <div class="clear"></div>
      `;

      results.appendChild(hotelElement);
    });
}




async function search(){

// Trip Info 
   let destCity = document.getElementById("city").value;
   let destState = document.getElementById("state").value;
   let destCountry = document.getElementById("country").value;

   let fromCity = document.getElementById("fromCity").value;
   let fromState = document.getElementById("fromState").value;

   let fromDate = document.getElementById("fromDate").value;
   let toDate = document.getElementById("toDate").value;

   let numTravelers = document.getElementById("travelers").value;

   // Calculate budget allocation based on slider
   let totalBudget = document.getElementById("budget").value;
   let foodBudget = totalBudget * (document.getElementById("food").value / 100);
   let hotelBudget = totalBudget * (document.getElementById("accomodations").value / 100);
   let flightBudget = totalBudget * (document.getElementById("flights").value / 100);
   let attractionsBudget = totalBudget * (document.getElementById("activities").value / 100);


   console.log(`Going To: ${destCity}, ${destState}, ${destCountry}`);
   console.log(`From: ${fromCity}, ${fromState}`);
   console.log(`On: ${fromDate} to ${toDate}`);
   console.log(`With ${numTravelers} Travelers`);
   console.log(`Food Budget: ${foodBudget}`);
   console.log(`Hotel Budget: ${hotelBudget} `);
   console.log(`Flight Budget: ${flightBudget}`);
   console.log(`Attractions Budget: ${attractionsBudget}`);


   // Hotel API
    let hotelResponse = await fetch(`/api/hotels?q=hotels in ${destCity} ${destCountry}&check_in_date=${fromDate}&check_out_date=${toDate}&adults=${numTravelers}&max_price=${hotelBudget}`);
    let hotelBody = await hotelResponse.json();
    console.log(hotelBody);
    let hotels = hotelBody.properties;




   // Flight API
   /* let flightResponse = await fetch(`/flights?passengers=${numTravelers}?from=${fromCity}?to=${destCity}?depart=${fromDate}?returnDate=${toDate}`);
    let flightBody = await response.json();
    console.log(flightBody);


    // Food API
    let foodResponse = fetch(`/restaurant?city=${destCity}?country=${destCountry}`);
    let foodBody = await response.json();
    console.log(foodBody);*/

}



async function onSubmit(){
   loadingScreen.style.display = 'flex';
   await search();
   window.location.href = 'results.html';

}

// Event Listeners
button2.addEventListener("click", onSubmit);




