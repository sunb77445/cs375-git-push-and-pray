require("dotenv").config();

const express = require("express");
const { searchFlights } = require("./lib/compareFlightPrices");

const app = express();
const PORT = 3000;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

app.use(express.json());
app.use(express.static("public"));


function mockFlightsFor(from, to) {
    return [
        {
            route: `${from} → ${to}`,
            meta: "Nonstop · 6h 10m",
            price: 214
        },
        {
            route: `${from} → ${to}`,
            meta: "1 stop · 8h 45m",
            price: 178
        }
    ];
}

app.post("/flights", async (req, res) => {

    const {
        tripType,
        passengers,
        cabinClass,
        from,
        to,
        depart,
        returnDate
    } = req.body;

    if (!from || !to || !depart) {

        return res.status(400).json({
            success: false,
            message: "Missing required search fields"
        });
    }

    // No API key configured yet (e.g. teammates without .env set up) ->
    // fall back to mock data so the frontend still works for local dev/demo.
    if (!RAPIDAPI_KEY) {
        console.warn("RAPIDAPI_KEY not set -- returning mock flights. See .env.example.");
        return res.json({
            success: true,
            message: "Flights found! (mock data -- no RAPIDAPI_KEY configured)",
            flights: mockFlightsFor(from, to)
        });
    }

    try {
        const flights = await searchFlights(RAPIDAPI_KEY, {
            tripType,
            passengers,
            cabinClass,
            from,
            to,
            depart,
            returnDate
        });

        if (flights.length === 0) {
            return res.json({
                success: true,
                message: "No live results came back -- try again or check different dates.",
                flights: []
            });
        }

        res.json({
            success: true,
            message: "Flights found!",
            flights
        });

    } catch (err) {
        console.error("Flight search failed:", err.message);
        // Fail soft with mock data rather than breaking the demo.
        res.json({
            success: true,
            message: "Live search failed, showing sample flights instead.",
            flights: mockFlightsFor(from, to)
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});