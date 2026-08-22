const express = require("express");
const sql = require("../config/db");
const router = express.Router();

router.post("/trips", async (req, res) => {

    try {

        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const { name, dest, fromDate, toDate, flight } = req.body;

        const tripResult = await sql`
            INSERT INTO trips
            (name, dest, "fromDate", "toDate", user_id)
            VALUES (
                ${name},
                ${dest},
                ${fromDate},
                ${toDate},
                ${req.session.userId}
            )
            RETURNING id
        `;

        const tripId = tripResult[0].id;

        if (flight) {

            await sql`
                INSERT INTO flights
                (trip_id, route, airline, price, departure_time, arrival_time, duration, stops)
                VALUES (
                    ${tripId},
                    ${flight.route},
                    ${flight.airline},
                    ${flight.price},
                    ${flight.departureTime},
                    ${flight.arrivalTime},
                    ${flight.duration},
                    ${flight.stops}
                )
            `;
        }

        res.json({
            success: true,
            message: "Trip saved!",
            tripId: tripId
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not save trip."
        });
    }
});

module.exports = router;