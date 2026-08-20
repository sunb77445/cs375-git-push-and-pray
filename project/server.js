const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
let hostname = "localhost";

const foodRouter = require('./routes/food-server');
const flightsRouter = require('./routes/flights-server');
const hotelRouter = require('./routes/hotel-server');
const loginRouter = require('./routes/login-server');

app.use(express.static(path.join(__dirname, 'app','public')));
app.use(express.static(path.join(__dirname, 'app','public','html')));
app.use(express.json());


app.use('/', foodRouter);
app.use('/', flightsRouter);
app.use('/', hotelRouter);
app.use('/', loginRouter);

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}/`);
})

