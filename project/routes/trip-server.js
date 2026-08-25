const express = require("express");
const sql = require("../config/db");
const router = express.Router(); 


// saves a trip
router.post("/save", async (req, res) => {
    let body = req.body;
    console.log("Body of POST request");
        console.log(body);

    if (
        !body.hasOwnProperty("user_id") ||
        !body.hasOwnProperty("name") ||
        !body.hasOwnProperty("depart") ||
        !body.hasOwnProperty("return") ||
        !body.hasOwnProperty("destination")
    ) {
        return res.sendStatus(400);
    }

    try {
        const result  = await sql
        `INSERT into trips(user_id, name, from_date, to_date, dest)
        VALUES (${body.user_id}, ${body.name}, ${body.depart}, ${body.return}, ${body.destination})
        RETURNING trip_id`; 

        const trip_id = result[0]?.trip_id;
        console.log("Inserted Trip ID:", trip_id);
        res.status(200).json({trip_id});

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});


// retrieves all trips
router.get('/trips', async (req, res) => {

    try {
        const trips = await
    sql`
            SELECT trip_id, name, dest, from_date, to_date
            FROM trips
            WHERE user_id = ${req.session.userId}
        `;

    res.json({trips});

    } catch (error) {
         console.error(error);
         res.status(500).json({ error: 'Failed to fetch trips' });
    }

});


// retrieves info for a specific trip
router.get('/trips:trip_id', async (req, res) => {
    const id = req.params.trip_id;

    const details =  await 
    sql`
            SELECT trip_id, user_id, name, dest, from_date, to_date
            FROM trips
            WHERE trip_id = ${id}
        `;

    const hotel = await 

    sql`
            SELECT name, price, check_in, check_out, guests
            FROM hotels
            WHERE trip_id = ${id}
        `;

    res.json({details, hotel});
});


module.exports = router;