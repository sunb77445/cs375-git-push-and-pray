let axios = require("axios");
let express = require("express");
let app = express();
let apiFile = require("../env.json");
let apiKey = apiFile["api_key"];
let port = 3000;
let hostname = "localhost";
app.use(express.static("public"));
// don't change code above this lines

app.get("/restaurant", (req, res) => {
  let zip = req.query.zip;

  if (!zip) {
    return res.status(400).json({ error: "Please provide a ZIP code." });
  }

  
  const zipRegex = /^\d{5}$/;
  if (!zipRegex.test(zip)) {
    return res.status(400).json({ error: "Invalid format. Please enter a 5-digit ZIP code." });
  }

  
  let geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(zip)}&filter=countrycode:us&apiKey=${apiKey}`;
  
  axios(geocodeUrl)
    .then(geoResponse => {
      let features = geoResponse.data.features;
      
      
      if (!features || features.length === 0) {
        throw { status: 404, message: "Location not found in the US. Please check your ZIP code." };
      }

      let bestMatch = features[0].properties;
      let lon = bestMatch.lon;
      let lat = bestMatch.lat;

      let placesUrl = `https://api.geoapify.com/v2/places?categories=catering.restaurant&filter=circle:${lon},${lat},5000&bias=proximity:${lon},${lat}&limit=10&apiKey=${apiKey}`;

      return axios(placesUrl);
    })
    .then(placesResponse => {
      let placesFeatures = placesResponse.data.features;
      
      
      if (!placesFeatures || placesFeatures.length === 0) {
        throw { status: 404, message: "No restaurants found in this area." };
      }

      let restaurantsArray = placesFeatures.map(feature => feature.properties);
      res.json(restaurantsArray);
    })
    .catch(error => {
      console.log(error);
      
     
      if (error.status && error.message) {
        res.status(error.status).json({ error: error.message });
      } 
      else {
        res.status(500).json({ error: "An error occurred fetching the data." });
      }
    });
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});