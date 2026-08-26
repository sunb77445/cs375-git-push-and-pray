let axios = require("axios");
let express = require("express");
const sql = require("../config/db");


let apiFile = require("../env.json");
let apiKey = apiFile["restaurant_api_key"];
const router = express.Router();


router.get("/geocode", (req, res) => {
  let city = req.query.city;


  if (!city) {
    return res.status(400).json({ success: false, message: "Missing city" });
  }


  axios.get("https://api.geoapify.com/v1/geocode/search", {
    params: {
      text: city,
      type: "city",
      limit: 1,
      apiKey: apiKey
    }
  }).then(response => {
    const features = response.data.features;


    if (!features || features.length === 0) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }


    const coordinates = features[0].geometry.coordinates;
    const lon = coordinates[0];
    const lat = coordinates[1];


    res.json({
      city: city,
      lat: lat,
      lon: lon,
    });
  }).catch(error => {
    console.log(error);
    res.status(500).send("Geocoding error");
  });
});




router.get("/autocomplete", (req, res) => {
  let text = req.query.text;


  if (!text) {
    return res.status(400).json({ success: false, message: "Missing location" });
  }


  axios.get("https://api.geoapify.com/v1/geocode/autocomplete", {
    params: {
      text: text,
      apiKey: apiKey
    }
  })
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ success: false, message: "Error" });
    });
});


router.get("/restaurant", (req, res) => {
  let lat = req.query.lat;
  let lon = req.query.lon;
  let distance = req.query.distance;


  if (!lat || !lon || !distance) {
    return res.status(401).json({ success: false, message: "Missing information" });
  }


  axios.get("https://api.geoapify.com/v2/places", {
    params: {
      categories: "catering.restaurant",
      filter: `circle:${lon},${lat},${distance}`,
      apiKey: apiKey
    }
  })
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send("Error");
    });
});


router.post("/save-restaurant", (req, res) => {


  const { tripId, name, address, website, distance } = req.body;

  if (!tripId || !name || !address) {
    return res.status(400).json({
      success: false,
      message: "Missing trip ID or restaurant information"
    });
  }

  sql`
      INSERT INTO restaurants (trip_id, name, address, website, distance)
      VALUES (${tripId}, ${name}, ${address}, ${website}, ${distance})
      RETURNING id
  `
    .then(result => {
      res.json({ success: true, message: "Restaurant saved!", id: result[0].id });
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to save restaurant" });
    });
});


router.delete("/remove-restaurant/:id", (req, res) => {


  const restaurantId = req.params.id;


  sql`
        DELETE FROM restaurants
        WHERE id = ${restaurantId}
        RETURNING id
    `
    .then(result => {
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: "Restaurant not found" });
      }
      res.json({ success: true, message: "Restaurant removed!" });
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to remove restaurant" });
    });
});


router.get("/saved-restaurants/:tripId", (req, res) => {

  let tripId = req.params.tripId;


  sql`
        SELECT id, name, address FROM restaurants
        WHERE trip_id = ${tripId}
    `
    .then(result => {
      res.json({ success: true, restaurants: result });
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to fetch saved restaurants" });
    });
});


module.exports = router;


