let axios = require("axios");
let express = require("express");

let apiFile = require("../env.json");
let apiKey = apiFile["restaurant_api_key"];
const router = express.Router();


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
