
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



async function onSubmit(){
   
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

   const params = new URLSearchParams({
      destCity: destCity,
      destState: destState,
      destCountry: destCountry,
      fromCity: fromCity,
      fromState: fromState,
      fromDate: fromDate,
      toDate: toDate,
      numTravelers: numTravelers,
      totalBudget: totalBudget,
      foodBudget: foodBudget,
      hotelBudget: hotelBudget,
      flightBudget: flightBudget,
      attractionsBudget: attractionsBudget,

   });

   window.location.href = `results.html?${params}`;

}

// Event Listeners
button2.addEventListener("click", onSubmit);




