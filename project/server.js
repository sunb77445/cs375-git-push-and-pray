require("dotenv").config();

const express = require('express');
const session = require("express-session");
const app = express();
const port = 3000;
const path = require('path');
const session = require('express-session');
let hostname = "localhost";

const foodRouter = require('./routes/food-server');
const flightsRouter = require('./routes/flights-server');
const hotelRouter = require('./routes/hotel-server');
const loginRouter = require('./routes/login-server');
const friendRouter = require('./routes/friend-server');

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

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}/`);
})

