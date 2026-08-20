const express = require("express");
const router = express.Router();

const { searchFlights } = require("../app/public/js/compareFlightPrices");


const SERPAPI_KEY = process.env.SERPAPI_KEY;


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


module.exports = router;

