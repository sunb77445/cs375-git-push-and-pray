let axios = require("axios");
let express = require("express");

let apiFile = require("../env.json");
let apiKey = apiFile["restaurant_api_key"];
const router = express.Router();


router.get("/geocode", (req,res) => {
  let city = req.query.city;

  if(!city) {
    return res.status(400).send("Missing city");
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
      return res.status(404).send("Location not found");
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
    return res.status(400).send("Missing location");
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
    res.status(500).send("Error");
  });
});

router.get("/restaurant", (req, res) => {
  let lat = req.query.lat;
  let lon = req.query.lon;
  let distance = req.query.distance;

  if (!lat || !lon || !distance) {
    return res.status(400).send("Missing information");
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

module.exports = router;
