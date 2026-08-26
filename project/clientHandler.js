const { WebSocketServer } = require("ws");
const sql = require("./config/db");


async function isTripMember(tripId, userId) {
    const rows = await sql`
        SELECT trip_id FROM trips WHERE trip_id = ${tripId} AND user_id = ${userId}
        UNION
        SELECT trip_id FROM trip_members WHERE trip_id = ${tripId} AND user_id = ${userId}
    `;
    return rows.length > 0;
}

// tripId =>>> { clients: Set<ws>, votes: Map<userId, hotelId> }
const votingSessions = new Map();

function getVotingSession(tripId) {
    if (!votingSessions.has(tripId)) {
        votingSessions.set(tripId, { clients: new Set(), votes: new Map() });
    }
    return votingSessions.get(tripId);
}

function tallyVotes(votingSession) {
    const tally = {};
    votingSession.votes.forEach(hotelId => {
        tally[hotelId] = (tally[hotelId] || 0) + 1;
    });

    return tally;
}

function broadcastState(tripId) {
    const votingSession = votingSessions.get(tripId);

    if (!votingSession)
        return;

    const message = JSON.stringify({
        type: "state",
        tally: tallyVotes(votingSession)
    });

    //each client gets in live
    votingSession.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}


function runVotingServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        ws.on("message", async (raw) => {
            let data;

            try {
                data = JSON.parse(raw);
            } catch (error) {
                return;
            }

            if (data.type === "join") {
                const tripId = Number(data.tripId);
                const userId = Number(data.userId);

                //only allow users to vote on their own trips
                try {
                    const member = await isTripMember(tripId, userId);

                    if (!member) {
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "You are not a member of this trip."
                        }));
                        ws.close();
                        return;
                    }
                } catch (error) {
                    console.error("Vote join error:", error);
                    ws.close();
                    return;
                }

                ws.tripId = tripId;
                ws.userId = userId;

                const votingSession = getVotingSession(tripId);
                votingSession.clients.add(ws);

                ws.send(JSON.stringify({
                    type: "state",
                    tally: tallyVotes(votingSession)
                }));

                return;
            }

            if (data.type === "vote") {
                if (!ws.tripId || !ws.userId) return;

                const votingSession = getVotingSession(ws.tripId);
                votingSession.votes.set(ws.userId, data.hotelId);

                broadcastState(ws.tripId);
            }
        });

        ws.on("close", () => {
            if (ws.tripId && votingSessions.has(ws.tripId)) {
                const votingSession = votingSessions.get(ws.tripId);
                votingSession.clients.delete(ws);

                if (votingSession.clients.size === 0 && votingSession.votes.size === 0) {
                    votingSessions.delete(ws.tripId);
                }
            }
        });
    });
}

module.exports = { addVotingServer: runVotingServer };
