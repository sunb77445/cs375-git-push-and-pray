const urlParams = new URLSearchParams(window.location.search);
let tripId = urlParams.get('id');
let dest = document.getElementById("dest");
let dates = document.getElementById("dates");
let hotel = document.getElementById("hotel");

let dialog = document.getElementById("dialog");
let addUser = document.getElementById("open-add");
let searchButton = document.getElementById("searchFriendButton");
let exit = document.getElementById("exit");
let userToAdd = document.getElementById("friendUsername"); 
let membersList = document.getElementById("member-list");
let creator = document.getElementById("creator");
const result = document.getElementById("tripMemberResult");


// fetch all trip details
fetch(`/trips${tripId}`).then(response => {
    return response.json();

}).then(data => {
    dest.textContent = `Trip to ${data.details[0].dest}`;
    dates.textContent = `Planned Dates: ${new Date(data.details[0].from_date).toLocaleDateString()} to ${new Date(data.details[0].to_date).toLocaleDateString()}`;
    // creator.textContent = `Created By ${}`;
    formatHotel(data.hotel, hotel);

    console.log(data);

}).catch(error => {
    console.log(error);
});



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
        li.textContent = `${member.first_name} ${member.last_name} (${member.username})`;
        membersList.append(li);
    });
   
}).catch(error => {
    console.log(error);
});




// Opening Add User Form
addUser.addEventListener("click", () => {
    result.replaceChildren();
    userToAdd.value = "";
    dialog.showModal();
});

// Closing Add User Form
exit.addEventListener("click", () => {
    dialog.close();
});


// Searching/adding users to trip
async function searchUser(username){
    username = username.trim();

    if (!username) {
        result.textContent = "Please enter a username.";
        return;
    }

    // Validate user exists
    let response = await fetch(`/users/${username}`);
    let data = await response.json();

    if(!data.success){
        result.textContent = data.message;
        return;
    }

    result.textContent = `${data.user.username} (${data.user.first_name} ${data.user.last_name})`;
    console.log("Found user: ", data.user);

    let addButton = document.createElement("button");
    addButton.textContent = "Add to Trip";

    result.appendChild(addButton);


    // Add member to trip
    addButton.addEventListener("click", async () => {

        const addResponse = await fetch(`/trips/${tripId}/members`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ user_id: data.user.id })
            }
        );

        const addData = await addResponse.json();

        if (!addResponse.ok) {
            result.textContent = addData.message;
            return;
        }

        result.textContent = "User added to trip!";
        console.log("User added to trip!");
        dialog.close();
        window.location.href = `/html/trip.html?id=${tripId}`;

    });
}


// Trigger search
searchButton.addEventListener("click", async () => {
    await searchUser(userToAdd.value); 
});


