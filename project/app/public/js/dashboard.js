loadCurrentUser();
loadNotifications();

setInterval(loadNotifications, 5000);

let plans = document.getElementById("travelPlans");


async function loadTrips(){
    let userResponse = await fetch("/current-user");
    let userData = await userResponse.json();
    let response = await fetch('/trips');
    let body = await response.json();
    console.log(body);

    let trips = body.trips;
    let currentUserId = userData.user.id;
    let placeholder = document.getElementById("default");

    if(trips.length == 0 || !trips){
        console.log("No trips found");
        placeholder.style.display = "block";
        return;
    }
    //update dashboard correctly when trip is deleted
    placeholder.style.display = "none";
    plans.querySelectorAll(".plan-placeholder:not(#default)").forEach(card => card.remove());

    trips.forEach(async trip => {
        let card = document.createElement("div");
        let h3 = document.createElement("h3");
        let p = document.createElement("p");

        card.classList.add("plan-placeholder");
        h3.textContent = trip.name;
        p.textContent = `${new Date(trip.from_date).toLocaleDateString()} to ${new Date(trip.to_date).toLocaleDateString()}`;

        card.append(h3);
        card.append(p);

        if(trip.user_id != currentUserId){
            let p2 = document.createElement("p");
            p2.textContent = `👤 Shared With You`;
            card.append(p2);
        } else {
            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete Trip";
            deleteButton.classList.add("delete-trip-button");
            deleteButton.addEventListener("click", async event => {
                //Stop card click for that card
                event.stopPropagation();

                //Create a ok and cancel button for confirmation
                if (!confirm("ARE YOU SURE? CAN'T BE UNDONE!")) {
                    return;
                }

                let deleteResponse = await fetch(`/trips/${trip.trip_id}`, {
                    method: "DELETE"
                });

                if (!deleteResponse.ok) {
                    alert("Could not delete this trip plan.");
                    return;
                }

                await loadTrips();
            });
            card.append(deleteButton);
        }

        plans.append(card);

        card.addEventListener("click", () => {
            window.location.href = `trip.html?id=${trip.trip_id}`;
        })
    });

}


loadTrips();