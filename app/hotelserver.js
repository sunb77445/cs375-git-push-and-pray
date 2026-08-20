const axios = require("axios");
const express = require("express");

const app = express();
const apiFile = require("../env.json");
const hotelApiKey = apiFile["hotel_api_key"];

const port = 3000;
const hostname = "localhost";

app.use(express.static("public"));

app.get("/api/hotels", async (req, res) => {
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

app.get("/api/hotel-autocomplete", async (req, res) => {
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

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});