const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));


app.post("/flights", (req, res) => {

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

    // TODO: replace this block with a real call to a flight API
    // (e.g. Kiwi.com) once one is picked. For now this returns
    // placeholder flights so the frontend can be built and tested.
    const mockFlights = [
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

    res.json({
        success: true,
        message: "Flights found!",
        flights: mockFlights
    });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
