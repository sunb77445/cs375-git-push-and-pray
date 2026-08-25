loadCurrentUser();
loadNotifications();

setInterval(loadNotifications, 5000);

let plans = document.getElementById("travelPlans");

async function loadTrips(){
    let response = await fetch('/trips');
    let body = await response.json();
    console.log(body);

    let trips = body.trips;
    let placeholder = document.getElementById("default");

    if(trips.length == 0 || !trips){
        console.log("No trips found");
        placeholder.style.display = "block";
        return;
    }

    trips.forEach(trip => {
        let card = document.createElement("div");
        let h3 = document.createElement("h3");
        let p = document.createElement("p");

        card.classList.add("plan-placeholder");
        h3.textContent = trip.name;
        p.textContent = `${new Date(trip.from_date).toLocaleDateString()} to ${new Date(trip.to_date).toLocaleDateString()}`;

        card.append(h3);
        card.append(p);
        plans.append(card);

        card.addEventListener("click", () => {
            window.location.href = `trip.html?id=${trip.trip_id}`;
        })
    });

}


loadTrips();