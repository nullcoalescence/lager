/*
*   index.js
*   Main entry point
*/

/*
*   Config
*/
var path = require("path");

require("dotenv").config();

var axios = require("axios");

// Express
var express = require("express");
var app = express();
var expressPartials = require("express-partials");

app.set("view engine", "ejs");
app.use(expressPartials());
app.use(express.static(path.join(__dirname, "/views/")));

var port = process.env.port;

// Logger (for this program itself)
var winston = require("winston");
var logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

if (process.env.environment == "production") {
    logger.add(new winston.transports.File({ filename: process.env.production_log || path.join(__dirname, "/lager-log.txt") }));
}

/*
*   Routing
*/
// Home
app.get("/", (req, res) => {
    res.render(path.join(__dirname, "/views/index.ejs"));
});

// PUT requests - where apps send lager log requests
axios.put("/i/write-log").then((respond) => {
    console.log(response);
});

/*
*   Start express
*/
app.listen(port, () => {
    logger.info("Started lager on port " + port + ". (Environment=" + process.env.environment + ")");
});