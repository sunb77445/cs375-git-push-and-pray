require("dotenv").config();

const express = require('express');
const session = require("express-session");
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const hostname = "0.0.0.0";

const foodRouter = require('./routes/food-server');
const flightsRouter = require('./routes/flights-server');
const hotelRouter = require('./routes/hotel-server');
const loginRouter = require('./routes/login-server');
const friendRouter = require('./routes/friend-server');
const tripRouter =  require('./routes/trip-server');

app.use(express.static(path.join(__dirname, 'app','public')));
app.use(express.static(path.join(__dirname, 'app','public','html')));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'development_fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24
    }
}));


app.use('/', foodRouter);
app.use('/', flightsRouter);
app.use('/', hotelRouter);
app.use('/', loginRouter);
app.use('/', friendRouter);
app.use('/', tripRouter);

const server = app.listen(port, hostname, () => {
    console.log(`http://localhost:${port}/index.html`);
})

const { addVotingServer } = require('./clientHandler');
addVotingServer(server);

