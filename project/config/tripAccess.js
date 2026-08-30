const sql = require("./db");

//Determines a user's relationship to a trip:
//Returns "creator" if they made the trip, "member" if they were invited to collaborate on it, or null if they have no access at all.
 

async function getTripRole(userId, tripId) {
    if (!userId || !tripId) {
        return null;
    }

    const trip = await sql`
        SELECT user_id FROM trips WHERE trip_id = ${tripId}
    `;

    if (trip.length === 0) {
        return null;
    }

    if (trip[0].user_id === userId) {
        return "creator";
    }

    const membership = await sql`
        SELECT 1 FROM trip_members
        WHERE trip_id = ${tripId} AND user_id = ${userId}
    `;

    return membership.length > 0 ? "member" : null;
}

module.exports = { getTripRole };