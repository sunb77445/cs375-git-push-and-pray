const form = document.getElementById("searchForm");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const error = document.getElementById("error");



function formatHotels(hotelList, element){
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

      element.appendChild(hotelElement);
    });
}


form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const location =
    document.getElementById("location").value;

  const checkIn =
    document.getElementById("checkIn").value;

  const checkOut =
    document.getElementById("checkOut").value;

  const guests =
    document.getElementById("guests").value;

  results.innerHTML = "";
  error.textContent = "";

  try {

    const params = new URLSearchParams({
      q: `hotels in ${location}`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: guests
      
    });

    const response = await fetch(
      `/api/hotels?${params}`
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

    formatHotels(data.properties);

  } catch (error) {

    error.textContent = error.message;
  }
});