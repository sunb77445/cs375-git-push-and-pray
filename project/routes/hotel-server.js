const axios = require("axios");
const express = require("express");
const router = express.Router();

const apiFile = require("../env.json");
const hotelApiKey = apiFile["hotel_api_key"];

router.get("/api/hotels", async (req, res) => {
  try {
    const { q, check_in_date, check_out_date, adults = 2 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Missing hotel search query."
      });
    }
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_hotels",
        q: q,
        check_in_date: check_in_date,
        check_out_date: check_out_date,
        adults: adults,
        api_key: hotelApiKey
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("SerpApi error:", error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      error: "Unable to search for hotels.",
      details: error.response?.data || error.message
    });
  }
});

router.get("/api/hotel-autocomplete", async (req, res) => {
    try {
        const {q} = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                suggestions: []
            });
        }

        const response = await axios.get("https://serpapi.com/search", {
                params: {
                    engine: "google_hotels_autocomplete",
                    q: q,
                    api_key: hotelApiKey
                }
            }
        );

        res.json(response.data);

    } catch (error) {

        console.error("Autocomplete error:", error.message);

        res.status(500).json({
            error: "Unable to get suggestions."
        });
    }
});


// Save hotel to session
/*
router.post("/api/hotels/session-save", (req, res) => {
    req.session.selectedHotel = req.body.hotel;
    res.json({ success: true });
});
*/


// Save hotel to database
const sql = require("../config/db");

router.post("/api/hotels/save", async (req, res) => {
    const { tripId, hotel, price, check_in, check_out, guests } = req.body;

    if (!tripId || !hotel) {
        return res.status(400).json({
            success: false,
            message: res.message || "Missing required fields."
        });
    }

    try {
        await sql`
            INSERT INTO hotels (
                trip_id, 
                name, 
                price,
                check_in,
                check_out,  
                guests
        
            ) VALUES (
                ${tripId}, 
                ${hotel}, 
                ${price}, 
                ${check_in},
                ${check_out}, 
                ${guests}
                    
            )
        `;

        res.json({
            success: true,
            message: "Hotel saved to trip successfully!"
        });
    } catch (error) {
        console.error("Error saving hotel:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save hotel to database.",
            details: error.message
        });
    }
});

module.exports = router;

