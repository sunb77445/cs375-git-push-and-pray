const proposeVoteButton = document.getElementById("propose-vote-button");
const voteDialog = document.getElementById("vote-dialog");
const voteExit = document.getElementById("vote-exit");
const voteOptions = document.getElementById("vote-options");
const voteStatus = document.getElementById("vote-status");

let voteSocket = null;
let myVote = null;
let tripHotels = [];

async function openVoteDialog() {
    voteStatus.textContent = "Loading...";
    voteOptions.innerHTML = "";
    myVote = null;
    voteDialog.showModal();

    try {
        const userResponse = await fetch("/current-user");
        const userData = await userResponse.json();

        const tripResponse = await fetch(`/trips${tripId}`);
        const tripData = await tripResponse.json();
        tripHotels = tripData.hotel || [];

        if (tripHotels.length === 0) {
            voteStatus.textContent = "No hotels have been added to this trip yet.";
            return;
        }

        connectVoteSocket(userData.user.id);

    } catch (error) {
        console.log(error);
        voteStatus.textContent = "Could not load voting options.";
    }
}

//adding websocket for getting client "online"
function connectVoteSocket(userId) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    voteSocket = new WebSocket(`${protocol}//${window.location.host}`);

    voteSocket.addEventListener("open", () => {
        voteSocket.send(
            JSON.stringify({ type: "join", tripId, userId}
            ));
        voteStatus.textContent = "Live voting is on! Click a hotel to vote!";
    });

    voteSocket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "state") {
            renderVoteOptions(data.tally);
        }

        if (data.type === "error") {
            voteStatus.textContent = data.message;
        }
    });

    voteSocket.addEventListener("close", () => {
        voteSocket = null;
    });
}

function renderVoteOptions(tally) {
    voteOptions.innerHTML = "";

    tripHotels.forEach(hotel => {
        const count = tally[hotel.hotel_id] || 0;

        const row = document.createElement("div");
        row.className = "vote-option";

        if (myVote === hotel.hotel_id) {
            row.classList.add("my-vote");
        }

        row.innerHTML = `
            <span class="vote-hotel-name">${hotel.name}</span>
            <span class="vote-count">${count} vote${count === 1 ? "" : "s"}</span>
        `;

        row.addEventListener("click", () => {
            myVote = hotel.hotel_id;

            if (voteSocket && voteSocket.readyState === WebSocket.OPEN) {
                voteSocket.send(JSON.stringify({ type: "vote", hotelId: hotel.hotel_id }));
            }

            renderVoteOptions(tally);
        });

        voteOptions.appendChild(row);
    });
}

proposeVoteButton.addEventListener("click", openVoteDialog);

voteExit.addEventListener("click", () => {
    if (voteSocket) {
        voteSocket.close();
    }
    voteDialog.close();
});
