const form = document.getElementById("searchForm");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const error = document.getElementById("error");

//Autocomplete
const locationInput = document.getElementById("location");
const suggestionsContainer =document.getElementById("suggestions");

let autocompleteTimeout;

locationInput.addEventListener("input", () => {

    clearTimeout(autocompleteTimeout);

    const query = locationInput.value.trim();

    autocompleteTimeout = setTimeout(async () => {

        try {

            const response = await fetch(`/api/hotel-autocomplete?q=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error("Autocomplete search failed.");
            }

            const data = await response.json();
            displaySuggestions(data.suggestions || []);

        } catch (error) {
            console.error(
                "Autocomplete error:",
                error
            );

        }

    }, 300);

});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const location = document.getElementById("location").value;

  const checkIn = document.getElementById("checkIn").value;

  const checkOut = document.getElementById("checkOut").value;

  const guests = document.getElementById("guests").value;

  results.innerHTML = "";
  error.textContent = "";
  suggestionsContainer.innerHTML = "";

  try {

    const params = new URLSearchParams({
      q: `hotels in ${location}`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: guests
    });

    const response = await fetch(`/api/hotels?${params}`
    );

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

    data.properties.forEach((hotel) => {

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
          ? `<p class="rating">Average Rating: ${hotel.rating} / 5</p>`
          : "";

      // Reviews
      const reviews =
        hotel.reviews
          ? `<p class="reviews">${hotel.reviews} reviews</p>`
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
            <p class="total">
              Total:
              ${hotel.total_rate.lowest}
            </p>
          `
          : "";

      // Select button
      const selectButton = `<button class="select-hotel" data-id="${hotel.property_token}">Select hotel</button>`;

      // Description
      const description =
        hotel.description
          ? `<p class="description">${hotel.description}</p>`
          : "";

      hotelElement.innerHTML = `${image}

        <div class="hotel-info">

          <h2>
            ${hotel.name || "Unnamed Hotel"}
          </h2>

          <p class="type">
            ${hotel.type || "Hotel"}
          </p>

          ${rating}

          ${reviews}

          ${price}

          ${total}

          ${description}

          ${selectButton}

        </div>`;

      results.appendChild(hotelElement);
    });

    document.querySelectorAll(".select-hotel").forEach(btn => {
      btn.addEventListener("click", function() {

        // Deactivate all other buttons
        document.querySelectorAll(".select-hotel").forEach(otherBtn => {
          if (otherBtn !== this) {
            otherBtn.classList.remove("selected");
            otherBtn.textContent = "Select hotel"; //TODO: fix working on the toggle
          }
        });

        // Toggle
        this.classList.toggle("selected");
        this.textContent = "Selected";

        //console.log("Hotel selected for itinerary:", this.getAttribute("data-id"));
      });
    });

  } catch (error) {

    error.textContent = error.message;
  }
});

function displaySuggestions(suggestions) {

    suggestionsContainer.innerHTML = "";

    if (!suggestions || suggestions.length === 0) {
        return;
    }

    suggestions.forEach(function (suggestion) {

        const suggestionText = suggestion.autocomplete_suggestion;

        if (!suggestionText) {
            return;
        }

        const suggestionElement = document.createElement("div");

        suggestionElement.className = "suggestion";
        suggestionElement.textContent = suggestionText;

        suggestionElement.addEventListener("click", function () {

                locationInput.value = suggestionText;
                suggestionsContainer.innerHTML = "";
            }
        );

        suggestionsContainer.appendChild(suggestionElement);
    });

}

document.addEventListener("click", (event) => {
    if (!locationInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
        suggestionsContainer.innerHTML = "";
    }
});