/*
*   index.js
*   Main entry point
*/

/*
*   Config
*/
var path = require("path");
var fs = require("fs");

require("dotenv").config();

var axios = require("axios");

// Express
var express = require("express");
var app = express();
var expressPartials = require("express-partials");

app.set("view engine", "ejs");
app.use(expressPartials());
app.use(express.static(path.join(__dirname, "/views/")));

var port = process.env.port || 4000;

// Middleware
var expressSanitizer = require("express-sanitizer");
app.use(expressSanitizer());

var { check, validationResult } = require("express-validator");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Logger (for this program itself)
var winston = require("winston");
const { format } = require("path");
const { addColors } = require("winston/lib/winston/config");
var logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: process.env.production_log || path.join(__dirname, "/lager-log.txt") })
    ]
});

if (process.env.environment == "dev") {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Database
var appDatabase = require(path.join(__dirname, "/database.js"));

// Directories
var logDir = process.env.logDir || path.join(__dirname, "/logs/");

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

app.post("/auth/register/validate", 
    check("appName").not().isEmpty().trim().escape().withMessage("'App name' field empty"),
    (req, res) => {
        var appName = req.body.appName;
        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render(path.join(__dirname, "/views/auth_register_error.ejs"), { errors: "Field 'App name' empty" });
        } else {
            appDatabase.addApp(req.body.appName);
            var newApp = appDatabase.getApp(req.body.appName);

            // Create log file
            var logFileName = logDir + "/" + newApp.app_name + ".log.txt";

            var fStream = fs.createWriteStream(logFileName);
            fStream.write("[lager]: initialized app and created log!");
            fStream.end();

            res.render(path.join(__dirname, "/views/auth_add_app_success.ejs"), { app_name: newApp.app_name, api_key: newApp.api_key });
    }
});

// GET /auth/app-list
// Returns a JSON list of all registered apps
app.get("/auth/app-list", (req, res) => {
    var appList = appDatabase.getAppList();
    for (var i = 0; i < appList.length; i++) {
        res.render(path.join(__dirname, "/views/_partials/app_list.ejs"), { app_list: appList });
    }
});

//  GET /auth/app
// Returns a JSON object of the requested app
app.get("/auth/app/:appName", (req, res) => {
    var app = appDatabase.getApp(req.params.appName);
    res.render(path.join(__dirname, "/views/_partials/app.ejs"), { app: app, app_name: app.app_name, api_key: app.api_key });
});

// GET /auth/wipe-db
// Wipes database
app.get("/auth/wipe-database", (req, res) => {
    appDatabase.wipeDatabase();
    res.render(path.join(__dirname, "/views/database_wiped.ejs"));
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
    
    // Open log
    fs.writeFileSync(logDir + "/" + appName + ".log.txt");

    
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
    res.sendFile(logDir + "/" + req.params.appName + ".log.txt");
    res.sendFile(logDir + req.params.appName + ".log.txt");
});

/*
*   Start express
*/
app.listen(port, () => {
    logger.info("Started lager on port " + port + ". (Environment=" + process.env.environment + ")");
});