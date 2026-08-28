
let next = document.getElementById("next-button");
let step2 = document.getElementById("step2");
let inputs = Array.from(document.getElementsByClassName("required"));

let submit = document.getElementById("submit");
let loadingScreen = document.querySelector(".loading");
let sliders = document.querySelectorAll(".slider");
let cityInput = document.getElementById("city");
let citySuggestions = document.getElementById("city-suggestions");
let selectedDestLat = null;
let selectedDestLon = null;



// Display Step 2
next.addEventListener("click", () => {
    step2.classList.add('slide-in');
    step2.classList.add('active');
});


// Ensure all fields are filled
function checkInputs(){
   let complete = true;

   inputs.forEach(input => {
      if (input.value.trim() === ''){
            complete = false;
         }
   });

   next.disabled = !complete;
}

inputs.forEach(input => {
   input.addEventListener("input", checkInputs);
});

checkInputs();

// Autocomplete the destination and fill in its location details.
cityInput.addEventListener("input", () => {
   const text = cityInput.value.trim();
   selectedDestLat = null;
   selectedDestLon = null;
   citySuggestions.replaceChildren();

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
         const places = data.features || [];
         if (places.length === 0) {
            return;
         }

         places.forEach(place => {
            let option = document.createElement("div");

            const properties = place.properties || {};
            const formatted = properties.formatted || "Unknown location";
            const coordinates = place.geometry && place.geometry.coordinates;

            if (!coordinates || coordinates.length < 2) {
               return;
            }

            option.textContent = formatted;
            option.addEventListener("click", () => {
               cityInput.value = properties.city || properties.town ||
                  properties.village || properties.municipality ||
                  properties.name || formatted;
               document.getElementById("state").value = properties.state || "";
               document.getElementById("country").value = properties.country || "";
               selectedDestLon = coordinates[0];
               selectedDestLat = coordinates[1];
               citySuggestions.replaceChildren();
               checkInputs();
            });

            citySuggestions.appendChild(option);
         });
      })
      .catch(error => console.log(error));
});


// budget preferences
sliders.forEach(slider => {
    slider.addEventListener('input', updateSliders);
});

// Ensure allocations dont exceed given budget
function updateSliders(event){
   let total = 0;

   sliders.forEach(slider => 
      total += Number(slider.value)
   );

   if(total > 100){
      let remainder = total - 100;
      event.target.value = Number(event.target.value) - remainder;
   }

    sliders.forEach(slider => {
      let sliderValue = document.getElementById(`${slider.id}-value`);
      let budget = Number(document.getElementById("budget").value);

      sliderValue.textContent = `${slider.value}% - $${((Number(slider.value) / 100) * budget).toFixed(2)}`;
   });

}


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

  console.log(`Going To: ${destCity}, ${destState}, ${destCountry}`);
   console.log(`From: ${fromCity}, ${fromState}`);
   console.log(`On: ${fromDate} to ${toDate}`);
   console.log(`With ${numTravelers} Travelers`);
   console.log(`Food Budget: ${foodBudget}`);
   console.log(`Hotel Budget: ${hotelBudget} `);
   console.log(`Flight Budget: ${flightBudget}`);

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

   });

   if (selectedDestLat !== null && selectedDestLon !== null) {
      params.set("destLat", selectedDestLat);
      params.set("destLon", selectedDestLon);
   }

   window.location.href = `results.html?${params}`;

}

// Event Listeners
submit.addEventListener("click", onSubmit);




