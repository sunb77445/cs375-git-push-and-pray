const express = require("express");
const router = express.Router();



const apiFile = require("../env.json");
const apiKey = apiFile["flights_api_key"];
const { searchFlights } = require("../app/public/js/compareFlightPrices");


const SERPAPI_KEY = apiKey;


// Used to changing city to 3 digit airport form 
async function resolveLocation(apiKey, query){
    if (/^[A-Z]{3}$/.test(query) || query.startsWith("/m/") || query.startsWith("/g/")) {
    return query;
  }

  try {
    const url = `https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${apiKey}&engine=google_flights_autocomplete`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.suggestions && data.suggestions.length > 0){
        return data.suggestions[0].id;
    }
    return query;

  } catch (err) {
        return query;
  }
}


router.post(
    "/flights",
    async (req, res) => {

        console.log("\n");
        console.log("========================================");
        console.log("NEW FLIGHT SEARCH");
        console.log("========================================");

        console.log(
            JSON.stringify(
                req.body,
                null,
                2
            )
        );


        const {

            tripType,

            passengers,

            cabinClass,

            from,

            to,

            depart,

            returnDate

        } = req.body;


        if (
            !from ||
            !to ||
            !depart
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Departure, arrival, and departure date are required.",

                flights: []

            });
        }


        if (!SERPAPI_KEY) {

            console.error(
                "SERPAPI_KEY IS MISSING."
            );

            return res.status(500).json({

                success: false,

                message:
                    "SerpApi key is missing. Check your .env file.",

                flights: []

            });
        }


        try {
            const [newFrom, newTo] = await Promise.all([resolveLocation(SERPAPI_KEY, from), resolveLocation(SERPAPI_KEY, to)]);
            console.log(newFrom, newTo);

            const flights =
                await searchFlights(
                    SERPAPI_KEY,
                    {
                        tripType:
                            tripType || "oneway",

                        passengers:
                            passengers || 1,

                        cabinClass:
                            cabinClass || "economy",

                        from: newFrom,

                        to: newTo,

                        depart,

                        returnDate
                    }
                );


            console.log(
                `Returning ${flights.length} flights to frontend.`
            );


            return res.json({

                success: true,

                message:
                    `Found ${flights.length} flights.`,

                flights

            });


        } catch (error) {

            console.error(
                "\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
            );

            console.error(
                "FLIGHT SEARCH FAILED"
            );

            console.error(
                error
            );

            console.error(
                "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n"
            );


            return res.status(502).json({

                success: false,

                message:
                    error.message,

                flights: []

            });
        }
    }
);

// Save a selected flight to a trip
const sql = require("../config/db");

router.post("/api/flights/save", async (req, res) => {
    const { tripId, route, airline, price, departureTime, arrivalTime, duration, stops } = req.body;

    if (!tripId || !route) {
        return res.status(400).json({
            success: false,
            message: "Missing trip ID or flight information."
        });
    }

    try {
        const [flight] = await sql`
            INSERT INTO flights (trip_id, route, airline, price, departure_time, arrival_time, duration, stops)
            VALUES (${tripId}, ${route}, ${airline}, ${price}, ${departureTime}, ${arrivalTime}, ${duration}, ${stops})
            RETURNING *
        `;

        res.json({
            success: true,
            message: "Flight saved to trip successfully!",
            flight
        });

    } catch (error) {
        console.error("Error saving flight:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save flight to database.",
            details: error.message
        });
    }
});

module.exports = router;

