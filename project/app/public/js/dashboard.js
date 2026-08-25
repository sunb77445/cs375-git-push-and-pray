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

    trips.forEach(async trip => {
        let card = document.createElement("div");
        let h3 = document.createElement("h3");
        let p = document.createElement("p");
        let p2 = document.createElement("p");

        card.classList.add("plan-placeholder");
        h3.textContent = trip.name;
        p.textContent = `${new Date(trip.from_date).toLocaleDateString()} to ${new Date(trip.to_date).toLocaleDateString()}`;

        card.append(h3);
        card.append(p);


        let response = await fetch("/current-user");
        let data = await response.json();
        console.log(data);

        if(trip.user_id != data.user.id){
            p2.textContent = `Shared With You`;
            card.append(p2);
        }

        plans.append(card);

        card.addEventListener("click", () => {
            window.location.href = `trip.html?id=${trip.trip_id}`;
        })
    });

}


loadTrips();