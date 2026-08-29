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


// Save hotel to database (creator or invited member only)
const sql = require("../config/db");
const { getTripRole } = require("../config/tripAccess");

router.post("/api/hotels/save", async (req, res) => {
    const { tripId, hotel, price, check_in, check_out, guests } = req.body;

    if (!tripId || !hotel) {
        return res.status(400).json({
            success: false,
            message: res.message || "Missing required fields."
        });
    }

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    try {
        const role = await getTripRole(req.session.userId, tripId);

        if (!role) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this trip."
            });
        }

        const [saved] = await sql`
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
            RETURNING *
        `;

        res.json({
            success: true,
            message: "Hotel saved to trip successfully!",
            hotel: saved
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


// Edit a hotel already saved to a trip (creator or invited member only)
router.patch("/api/hotels/:hotel_id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    const hotelId = req.params.hotel_id;
    const { name, price, check_in, check_out, guests } = req.body;

    try {
        const [existing] = await sql`SELECT trip_id FROM hotels WHERE id = ${hotelId}`;

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found."
            });
        }

        const role = await getTripRole(req.session.userId, existing.trip_id);

        if (!role) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this trip."
            });
        }

        const [updated] = await sql`
            UPDATE hotels
            SET name = COALESCE(${name}, name),
                price = COALESCE(${price}, price),
                check_in = COALESCE(${check_in}, check_in),
                check_out = COALESCE(${check_out}, check_out),
                guests = COALESCE(${guests}, guests)
            WHERE id = ${hotelId}
            RETURNING *
        `;

        res.json({
            success: true,
            hotel: updated
        });

    } catch (error) {
        console.error("Error updating hotel:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update hotel."
        });
    }
});


// Remove a hotel from a trip (creator or invited member only)
router.delete("/api/hotels/:hotel_id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    const hotelId = req.params.hotel_id;

    try {
        const [existing] = await sql`SELECT trip_id FROM hotels WHERE id = ${hotelId}`;

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found."
            });
        }

        const role = await getTripRole(req.session.userId, existing.trip_id);

        if (!role) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this trip."
            });
        }

        await sql`DELETE FROM hotels WHERE id = ${hotelId}`;

        res.json({
            success: true,
            message: "Hotel removed."
        });

    } catch (error) {
        console.error("Error deleting hotel:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete hotel."
        });
    }
});

module.exports = router;