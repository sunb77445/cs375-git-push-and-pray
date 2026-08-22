const form = document.getElementById("searchForm");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const error = document.getElementById("error");



function formatHotels(hotelList, element){
      hotelList.forEach((hotel) => {

      const hotelElement = document.createElement("div");
      hotelElement.className = "hotel";

      // card fields with optional checking (show if they exist)
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
          ? `<p class = "rating">Average Rating: ${hotel.rating} / 5</p>`
          : "";

      // Reviews
      const reviews =
        hotel.reviews
          ? `<p class = "reviews">${hotel.reviews} reviews</p>`
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
            <p class = "total">
              Total:
              ${hotel.total_rate.lowest}
            </p>
          `
          : "";

      const selectButton = `<button class="select-hotel" data-id="${hotel.property_token}">Select hotel</button>`;


          // Description
      const description =
        hotel.description
          ? `<p class = "description">${hotel.description}</p>`
          : "";

      hotelElement.innerHTML = `${image}

        <div class="hotel-info">

          <h2>
            ${hotel.name || "Unnamed Hotel"}
          </h2>

          ${rating}
          ${reviews}
          ${price}
          ${total}
          ${description}
          ${selectButton}

        </div>

        <div class="clear"></div>
      `;

      element.appendChild(hotelElement);
    });
}


form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const location = document.getElementById("location").value;

  const checkIn = document.getElementById("checkIn").value;

  const checkOut = document.getElementById("checkOut").value;

  const guests = document.getElementById("guests").value;

  results.innerHTML = "";
  error.textContent = "";

  try {

    const params = new URLSearchParams({
      q: `hotels in ${location}`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: guests
      
    });

    const response = await fetch(`/api/hotels?${params}`);

    if (!response.ok) {
        throw new Error("Hotel search failed.");
    }

    const data = await response.json();

    if (
      !data.properties ||
      data.properties.length === 0
    ) {
      results.innerHTML =
        "<p>No hotels found.</p>";

      return;
    }

    formatHotels(data.properties, results);
    selectHotel(results); //event listener for selecting hotel

  } catch (error) {
    error.textContent = error.message;
  }
});

function selectHotel(container) {
    container.addEventListener("click", function(event) {
        if (event.target && event.target.classList.contains("select-hotel")) {
            const btn = event.target;
            const isSelected = btn.classList.contains("selected");

            // deselect all other all buttons
            container.querySelectorAll(".select-hotel").forEach(otherBtn => {
                otherBtn.classList.remove("selected");
                otherBtn.textContent = "Select hotel";
            });

            if (!isSelected) {
                btn.classList.add("selected");
                btn.textContent = "Selected";
            }
        }
    });
}
