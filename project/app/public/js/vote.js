const proposeVoteButton = document.getElementById("propose-vote-button");
const voteDialog = document.getElementById("vote-dialog");
const voteEndButton = document.getElementById("vote-end-button");
const voteOptions = document.getElementById("vote-options");
const voteStatus = document.getElementById("vote-status");

let voteSocket = null;
let myVote = null;
let tripHotels = [];
let latestTally = {};
let sessionActive = false;
let currentUserId = null;

// Connect as soon as the trip page loads, so every member's button reflects live session status even before they open the dialog
async function initVoting() {
    try {
        const userResponse = await fetch("/current-user");
        const userData = await userResponse.json();

        if (!userData.loggedIn) return;

        currentUserId = userData.user.id;

        const tripResponse = await fetch(`/trips${trip_id}`);
        const tripData = await tripResponse.json();
        tripHotels = tripData.hotel || [];

        connectVoteSocket();

    } catch (error) {
        console.log("Could not initialize voting:", error);
    }
}

//adding websocket for getting client "online"
function connectVoteSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    voteSocket = new WebSocket(`${protocol}//${window.location.host}`);

    voteSocket.addEventListener("open", () => {
        voteSocket.send(
            JSON.stringify({ type: "join", tripId: trip_id, userId: currentUserId }
            ));
    });

    voteSocket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "status") {
            setSessionActive(data.active);
        }

        if (data.type === "state") {
            latestTally = data.tally;

            if (voteDialog.open) {
                renderVoteOptions(latestTally);
            }
        }

        if (data.type === "ended") {
            handleVoteEnded(data);
        }

        if (data.type === "error") {
            voteStatus.textContent = data.message;
        }
    });

    voteSocket.addEventListener("close", () => {
        voteSocket = null;
    });
}

function setSessionActive(active) {
    sessionActive = active;

    if (active) {
        proposeVoteButton.textContent = "Join Live Voting";
        proposeVoteButton.classList.add("voting-live");

        if (voteDialog.open) {
            voteStatus.textContent = "Live voting is on! Click a hotel to vote!";
        }
    } else {
        proposeVoteButton.textContent = "Propose Vote";
        proposeVoteButton.classList.remove("voting-live");
    }
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

function handleVoteEnded(data) {
    setSessionActive(false);

    if (data.outcome === "tie") {
        voteStatus.textContent = "";
        voteOptions.innerHTML = `
            <p class="vote-outcome">There's a tie! Voting has ended - nothing has changed.</p>
            <button id="vote-outcome-ok">OK</button>
        `;

        document.getElementById("vote-outcome-ok").addEventListener("click", () => {
            voteDialog.close();
        });

        return;
    }

    if (data.outcome === "winner") {
        const hotel = tripHotels.find(h => String(h.hotel_id) === String(data.hotelId));
        const hotelName = hotel ? hotel.name : "this hotel";

        voteStatus.textContent = "";
        voteOptions.innerHTML = `
            <p class="vote-outcome">Do you want to finalize <strong>${hotelName}</strong> for this trip?</p>
            <div class="vote-outcome-actions">
                <button id="vote-finalize-yes">Yes</button>
                <button id="vote-finalize-no">No</button>
            </div>
        `;

        document.getElementById("vote-finalize-no").addEventListener("click", () => {
            voteDialog.close();
        });

        document.getElementById("vote-finalize-yes").addEventListener("click", async () => {
            try {
                await fetch(`/trips/${trip_id}/hotels/${data.hotelId}/finalize`, {
                    method: "POST"
                });
            } catch (error) {
                console.log("Could not finalize hotel:", error);
            }

            window.location.reload();
        });
    }
}

proposeVoteButton.addEventListener("click", () => {
    if (tripHotels.length === 0) {
        voteStatus.textContent = "No hotels have been added to this trip yet.";
        voteOptions.innerHTML = "";
        voteDialog.showModal();
        return;
    }

    myVote = null;
    voteStatus.textContent = sessionActive
        ? "Live voting is on! Click a hotel to vote!"
        : "Starting live voting...";

    renderVoteOptions(latestTally);
    voteDialog.showModal();

    if (!sessionActive && voteSocket && voteSocket.readyState === WebSocket.OPEN) {
        voteSocket.send(JSON.stringify({ type: "start" }));
    }
});

voteEndButton.addEventListener("click", () => {
    if (voteSocket && voteSocket.readyState === WebSocket.OPEN) {
        voteSocket.send(JSON.stringify({ type: "end" }));
    }
});

initVoting();
