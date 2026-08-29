const urlParams = new URLSearchParams(window.location.search);
let trip_id = urlParams.get('id');
console.log("Trip ID:", trip_id);


let dest = document.getElementById("dest");
let dates = document.getElementById("dates");
let hotelList = document.getElementById("hotel-list");
let restaurantList = document.getElementById("restaurant-list");

let dialog = document.getElementById("dialog");
let addUser = document.getElementById("open-add");
let exit = document.getElementById("exit");
let membersList = document.getElementById("member-list");
let creator = document.getElementById("creator");
let friendSelect = document.getElementById("friendSelect");
let addFriendToTripButton = document.getElementById("addFriendToTripButton");
const memberResult = document.getElementById("tripMemberResult");



// fetch all trip details
async function getTripDetails(){

    try {
        let response = await fetch(`/trips${trip_id}`)
        let data = await response.json();

        dest.textContent = `Trip to ${data.details[0].dest}`;
        dates.textContent = `Planned Dates: ${new Date(data.details[0].from_date).toLocaleDateString()} to ${new Date(data.details[0].to_date).toLocaleDateString()}`;
        renderSavedHotels(data.hotel, hotelList);
        renderSavedRestaurants(data.restaurant, restaurantList);

        console.log(data);

    } catch (error) {
        console.log(error);
    }
}


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

        container.appendChild(card);
    });
}

// Displays the trip's saved restaurant(s) as clean cards
function renderSavedRestaurants(restaurants, container) {
     container.innerHTML = "";

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

        container.appendChild(card);
    });
}



// Displaying members added to current trip
async function displayMembers(){
    try {
        let response = await fetch(`/trips/${trip_id}/members`); 
        let data = await response.json();
        
        console.log(data);
        let members = data.members;

        if(members.length == 0){
            let p = document.createElement("p");
            p.textContent = "Add a friend to your trip to start collaborating!"
            membersList.append(p);
        }

        members.forEach(member => {
            let li = document.createElement("li");
            li.textContent = `👤 ${member.first_name} ${member.last_name} (${member.username})`;
            membersList.append(li);
        });
    } catch (error) {
        console.log(error);
    }

}



// Loading page content
window.addEventListener('load', async (event) => {
    if(trip_id) {
        await displayMembers();
        await getTripDetails();
    }
}); 


// Opening Add User Form
addUser.addEventListener("click", async () => {
   memberResult.replaceChildren();
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
        memberResult.textContent = "Please select a friend.";
        return;
    }

    try {

        const addResponse = await fetch(
            `/trips/${trip_id}/members`,
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
            memberResult.textContent = addData.message;
            return;
        }

        memberResult.textContent = "Friend added to trip!";

        console.log("Friend added to trip!");

        dialog.close();

        window.location.href =
            `/html/trip.html?id=${trip_id}`;

    } catch (error) {

        console.error("Could not add friend to trip:", error);

        memberResult.textContent =
            "Something went wrong. Please try again.";
    }
});


// fetching members apart of trip 
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

