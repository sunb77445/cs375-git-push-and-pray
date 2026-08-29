const urlParams = new URLSearchParams(window.location.search);
let tripId = urlParams.get('id');
let dest = document.getElementById("dest");
let dates = document.getElementById("dates");
let hotelList = document.getElementById("hotel-list");
let flightList = document.getElementById("flight-list");
let restaurantList = document.getElementById("restaurant-list");

let dialog = document.getElementById("dialog");
let addUser = document.getElementById("open-add");
let exit = document.getElementById("exit");
let membersList = document.getElementById("member-list");
let creator = document.getElementById("creator");
let friendSelect = document.getElementById("friendSelect");
let addFriendToTripButton = document.getElementById("addFriendToTripButton");
const result = document.getElementById("tripMemberResult");

let addHotelButton = document.getElementById("add-hotel-button");
let addFlightButton = document.getElementById("add-flight-button");
let addRestaurantButton = document.getElementById("add-restaurant-button");

// Set once we know whether the logged-in user is the trip creator or an
// invited member. The edit/delete/add controls only render if this is set,
// since the server would reject those calls anyway for anyone else.
let currentTripRole = null;


// fetch all trip details
fetch(`/trips${tripId}`).then(response => {
    return response.json().then(data => ({ ok: response.ok, data }));

}).then(({ ok, data }) => {

    if (!ok) {
        dest.textContent = "Can't view this trip";
        dates.textContent = data.message || "You don't have access to this trip.";
        return;
    }

    currentTripRole = data.role;

    dest.textContent = `Trip to ${data.details[0].dest}`;
    dates.textContent = `Planned Dates: ${new Date(data.details[0].from_date).toLocaleDateString()} to ${new Date(data.details[0].to_date).toLocaleDateString()}`;

    renderSavedHotels(data.hotel, hotelList);
    renderSavedFlights(data.flight, flightList);
    renderSavedRestaurants(data.restaurant, restaurantList);

    if (addHotelButton) addHotelButton.style.display = currentTripRole ? "" : "none";
    if (addFlightButton) addFlightButton.style.display = currentTripRole ? "" : "none";
    if (addRestaurantButton) addRestaurantButton.style.display = currentTripRole ? "" : "none";

    console.log(data);

}).catch(error => {
    console.log(error);
});


// Displays the trip's saved hotel(s) as clean cards
function renderSavedHotels(hotels, container) {
    container.innerHTML = "";

    if (!hotels || hotels.length === 0) {
        container.innerHTML = "<p class=\"empty-note\">No hotel selected yet.</p>";
        return;
    }

    hotels.forEach(hotel => {
        const card = document.createElement("div");
        card.className = "saved-hotel-card";

        card.innerHTML = `
            <h3 class="saved-hotel-name">${hotel.name}</h3>
            <p class="saved-hotel-price">$${hotel.price} / night</p>
            <!---<p class = "saved-total-price"></p>--->
            <p class="saved-hotel-guests">${hotel.guests} guest${hotel.guests == 1 ? "" : "s"}</p>
        `;

        if (currentTripRole) {
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => editHotel(hotel));

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => deleteHotel(hotel.hotel_id));

            card.append(editBtn, deleteBtn);
        }

        container.appendChild(card);
    });
}

async function editHotel(hotel) {
    const name = prompt("Hotel name:", hotel.name);
    if (name === null) return;

    const price = prompt("Price per night:", hotel.price);
    if (price === null) return;

    const guests = prompt("Number of guests:", hotel.guests);
    if (guests === null) return;

    try {
        const response = await fetch(`/api/hotels/${hotel.hotel_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price, guests })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not update hotel.");
            return;
        }

        refreshTrip();

    } catch (error) {
        console.error(error);
        alert("Something went wrong updating the hotel.");
    }
}

async function deleteHotel(hotelId) {
    if (!confirm("Remove this hotel from the trip?")) return;

    try {
        const response = await fetch(`/api/hotels/${hotelId}`, { method: "DELETE" });
        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not delete hotel.");
            return;
        }

        refreshTrip();

    } catch (error) {
        console.error(error);
        alert("Something went wrong deleting the hotel.");
    }
}

if (addHotelButton) {
    addHotelButton.addEventListener("click", async () => {
        const name = prompt("Hotel name:");
        if (!name) return;

        const price = prompt("Price per night:");
        if (price === null) return;

        const guests = prompt("Number of guests:", "1");
        if (guests === null) return;

        try {
            const response = await fetch("/api/hotels/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId, hotel: name, price, guests })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.message || "Could not add hotel.");
                return;
            }

            refreshTrip();

        } catch (error) {
            console.error(error);
            alert("Something went wrong adding the hotel.");
        }
    });
}


// Displays the trip's saved flight(s) as clean cards
function renderSavedFlights(flights, container) {
    if (!container) return;
    container.innerHTML = "";

    if (!flights || flights.length === 0) {
        container.innerHTML = "<p class=\"empty-note\">No flight selected yet.</p>";
        return;
    }

    flights.forEach(flight => {
        const card = document.createElement("div");
        card.className = "saved-hotel-card";

        card.innerHTML = `
            <h3 class="saved-hotel-name">${flight.route || ""}</h3>
            <p>${flight.airline || ""}</p>
            <p class="saved-hotel-price">$${flight.price}</p>
            <p>${flight.departure_time || ""} → ${flight.arrival_time || ""}</p>
            <p>${flight.duration || ""} · ${flight.stops === 0 ? "Nonstop" : flight.stops ? flight.stops + " stop(s)" : ""}</p>
        `;

        if (currentTripRole) {
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => editFlight(flight));

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => deleteFlight(flight.flight_id));

            card.append(editBtn, deleteBtn);
        }

        container.appendChild(card);
    });
}

async function editFlight(flight) {
    const route = prompt("Route (e.g. PHL -> LGA):", flight.route);
    if (route === null) return;

    const airline = prompt("Airline / details:", flight.airline);
    if (airline === null) return;

    const price = prompt("Price:", flight.price);
    if (price === null) return;

    try {
        const response = await fetch(`/api/flights/${flight.flight_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ route, airline, price })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not update flight.");
            return;
        }

        refreshTrip();

    } catch (error) {
        console.error(error);
        alert("Something went wrong updating the flight.");
    }
}

async function deleteFlight(flightId) {
    if (!confirm("Remove this flight from the trip?")) return;

    try {
        const response = await fetch(`/api/flights/${flightId}`, { method: "DELETE" });
        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not delete flight.");
            return;
        }

        refreshTrip();

    } catch (error) {
        console.error(error);
        alert("Something went wrong deleting the flight.");
    }
}

if (addFlightButton) {
    addFlightButton.addEventListener("click", async () => {
        const route = prompt("Route (e.g. PHL -> LGA):");
        if (!route) return;

        const airline = prompt("Airline / details:");
        if (airline === null) return;

        const price = prompt("Price:");
        if (price === null) return;

        try {
            const response = await fetch("/api/flights/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId, route, airline, price })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.message || "Could not add flight.");
                return;
            }

            refreshTrip();

        } catch (error) {
            console.error(error);
            alert("Something went wrong adding the flight.");
        }
    });
}


function renderSavedRestaurants(restaurants, container) {
    container.replaceChildren();

    if (!restaurants || restaurants.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.className = "empty-note";
        emptyNote.textContent = "No restaurants selected yet.";
        container.appendChild(emptyNote);
        return;
    }

    restaurants.forEach(restaurant => {
        const card = document.createElement("div");
        card.className = "saved-hotel-card";

        const restaurantName = document.createElement("h3");
        restaurantName.className = "saved-hotel-name";
        restaurantName.textContent = restaurant.name;

        const address = document.createElement("p");
        address.textContent = restaurant.address || "Address unavailable";

        card.append(restaurantName, address);

        if (restaurant.website) {
            const website = document.createElement("a");
            website.href = restaurant.website;
            website.target = "_blank";
            website.rel = "noopener noreferrer";
            website.textContent = "Visit Website";
            card.appendChild(website);
        }

        if (currentTripRole) {
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => editRestaurant(restaurant));

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => deleteRestaurant(restaurant.restaurant_id));

            card.append(editBtn, deleteBtn);
        }

        container.appendChild(card);
    });
}

async function editRestaurant(restaurant) {
    const name = prompt("Restaurant name:", restaurant.name);
    if (name === null) return;

    const address = prompt("Address:", restaurant.address);
    if (address === null) return;

    const website = prompt("Website (optional):", restaurant.website || "");
    if (website === null) return;

    try {
        const response = await fetch(`/restaurant/${restaurant.restaurant_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, address, website })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not update restaurant.");
            return;
        }

        refreshTrip();

    } catch (error) {
        console.error(error);
        alert("Something went wrong updating the restaurant.");
    }
}

async function deleteRestaurant(restaurantId) {
    if (!confirm("Remove this restaurant from the trip?")) return;

    try {
        const response = await fetch(`/remove-restaurant/${restaurantId}`, { method: "DELETE" });
        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not delete restaurant.");
            return;
        }

        refreshTrip();

    } catch (error) {
        console.error(error);
        alert("Something went wrong deleting the restaurant.");
    }
}

if (addRestaurantButton) {
    addRestaurantButton.addEventListener("click", async () => {
        const name = prompt("Restaurant name:");
        if (!name) return;

        const address = prompt("Address:");
        if (address === null) return;

        const website = prompt("Website (optional):");
        if (website === null) return;

        try {
            const response = await fetch("/save-restaurant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId, name, address, website })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.message || "Could not add restaurant.");
                return;
            }

            refreshTrip();

        } catch (error) {
            console.error(error);
            alert("Something went wrong adding the restaurant.");
        }
    });
}


// Re-fetches trip details and re-renders every section (used after any
// add/edit/delete so the page always reflects what's in the database).
function refreshTrip() {
    fetch(`/trips${tripId}`).then(response => {
        return response.json();
    }).then(data => {
        currentTripRole = data.role;
        renderSavedHotels(data.hotel, hotelList);
        renderSavedFlights(data.flight, flightList);
        renderSavedRestaurants(data.restaurant, restaurantList);
    }).catch(error => {
        console.log(error);
    });
}


// Fetching members added to current trip
fetch(`/trips/${tripId}/members`).then(response => {
    return response.json();

}).then(data => {
    console.log(data);
    let members = data.members;

    if(members.length == 0){
        let p = document.createElement("p");
        p.textContent = "Add a friend to your trip to start collaborating!"
        membersList.append(p);
    }

    members.forEach(member => {
        let li = document.createElement("li");
        li.textContent = `👤 ${member.first_name} ${member.last_name} (${member.username})${member.is_creator ? " — Creator" : ""}`;
        membersList.append(li);
    });
   
}).catch(error => {
    console.log(error);
});




// Opening Add User Form
addUser.addEventListener("click", async () => {
    result.replaceChildren();
    await loadFriendsForTrip();
    dialog.showModal();
});

// Closing Add User Form
exit.addEventListener("click", () => {
    dialog.close();
});


// Searching/adding users to trip
addFriendToTripButton.addEventListener("click", async () => {

    const userId = friendSelect.value;

    if (!userId) {
        result.textContent = "Please select a friend.";
        return;
    }

    try {

        const addResponse = await fetch(
            `/trips/${tripId}/members`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId
                })
            }
        );

        const addData = await addResponse.json();

        if (!addResponse.ok) {
            result.textContent = addData.message;
            return;
        }

        result.textContent = "Friend added to trip!";

        console.log("Friend added to trip!");

        dialog.close();

        window.location.href =
            `/html/trip.html?id=${tripId}`;

    } catch (error) {

        console.error("Could not add friend to trip:", error);

        result.textContent =
            "Something went wrong. Please try again.";
    }
});


async function loadFriendsForTrip() {
    try {
        const response = await fetch("/friends");
        const data = await response.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        friendSelect.innerHTML = `
            <option value="">Select a friend</option>
        `;

        data.friends.forEach(friend => {
            const option = document.createElement("option");

            option.value = friend.id;
            option.textContent =
                `${friend.first_name} ${friend.last_name} (${friend.username})`;

            friendSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Could not load friends:", error);
    }
}