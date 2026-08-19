require("dotenv").config();

const express = require("express");

const {
    searchFlights
} = require("./lib/compareFlightPrices");


const app = express();

const PORT = 3000;

const SERPAPI_KEY =
    process.env.SERPAPI_KEY;


app.use(
    express.json()
);


app.use(
    express.static("public")
);


app.post(
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

                        from,

                        to,

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


//Start server:

app.listen(
    PORT,
    () => {

        console.log("\n");
        console.log("========================================");

        console.log(
            `Server running at http://localhost:${PORT}`
        );

        console.log("========================================");

        console.log(
            "SerpApi key:",
            SERPAPI_KEY
                ? "LOADED"
                : "MISSING"
        );

        console.log(
            "Flight API: SerpApi Google Flights"
        );

        console.log("========================================");

    }
);