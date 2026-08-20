 const resultsDiv = document.getElementById("results");

        document
            .getElementById("flightSearchForm")
            .addEventListener("submit", async function(event) {

                event.preventDefault();

                const tripType =
                    document.getElementById("tripType").value;

                const passengers =
                    document.getElementById("passengers").value;

                const cabinClass =
                    document.getElementById("cabinClass").value;

                const from =
                    document.getElementById("from").value;

                const to =
                    document.getElementById("to").value;

                const depart =
                    document.getElementById("depart").value;

                const returnDate =
                    document.getElementById("return").value;


                const response = await fetch("/flights", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        tripType,
                        passengers,
                        cabinClass,
                        from,
                        to,
                        depart,
                        returnDate
                    })
                });


                const data = await response.json();


                document.getElementById("message")
                    .textContent = data.message;


                if (data.success) {
                    renderResults(data.flights, resultsDiv);
                } else {
                    document.getElementById("results").textContent =
                        data.message || "Flight search failed.";
                }

            });



        function renderResults(flights, element) {

            element.innerHTML = "";

            if (!flights || flights.length === 0) {
                element.textContent = "No flights found.";
                return;
            }

            flights.forEach(function(flight) {

                const card = document.createElement("div");

                card.innerHTML = `
                    <p>
                        <strong>${flight.route}</strong><br>
                        ${flight.meta}<br>
                        $${flight.price}
                        <button class="add-btn">Add to itinerary</button>
                    </p>
                    <hr>
                `;

                element.appendChild(card);
            });
        }