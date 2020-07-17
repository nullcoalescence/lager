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

var expressSanitizer = require("express-sanitizer");
app.use(expressSanitizer());

// Logger (for this program itself)
var winston = require("winston");
const { format } = require("path");
var logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: process.env.production_log || path.join(__dirname, "/lager-log.txt") })
    ]
});

if (process.env.environment == "dev") {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

/*
*   Routing
*/
// Home
app.get("/", (req, res) => {
    res.render(path.join(__dirname, "/views/index.ejs"));
});

app.get("/about", (req, res) => {
    res.render(path.join(__dirname, "/views/about.ejs"));
});

app.get("/help", (req, res) => {
    res.render(path.join(__dirname, "/views/help.ejs"));
});

/*
*   All app authorization in done under /auth/
*/
app.get("/auth/", (req, res) => {
    res.render(path.join(__dirname, "/views/auth_index.ejs"));
});

app.get("/auth/register", (req, res) => {
    res.render(path.join(__dirname, "/views/auth_register.ejs"));
});

// POST /apps/:appname/write-log
// Writes the log of a specified app
// :appname - specified app
// ?appName - name of (authenticated) app
// ?logText - text to log
app.post("/apps/:appName/write-log/", (req, res) => {
    var appName = req.params.appName;
    var logText = req.sanitize(req.query.logText); 
    
    // Input validation
    // 1) Make sure appName is a valid registered app
    if (appName) { 
        // @todo 
    }
    
    var formattedLogEntry = "[" + appName + "]: " + logText;
    
    //console.log(formattedLogEntry);
    //res.send(formattedLogEntry);

    logger.info(formattedLogEntry);
    res.end();

});

// GET /apps/:appname/view-log
// Views log of an app
// :appname - name of application to view logs
app.get("/apps/:appName/view-log", (req, res) => {
    res.render(path.join(__dirname, "/views/view_log.ejs"), { appName: req.params.appName });
});

// GET /apps/:appName/get-log
// Returns actual log file
// Used to export logs for user and for jQuery get() requests in view_log.js
app.get("/apps/:appName/get-log", (req, res) => {
    res.sendFile(path.join(__dirname, "/lager-log.txt"));
});

/*
*   Start express
*/
app.listen(port, () => {
    logger.info("Started lager on port " + port + ". (Environment=" + process.env.environment + ")");
});