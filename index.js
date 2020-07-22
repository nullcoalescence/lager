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
var appDB = require(path.join(__dirname, "/database.js"));

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
        appName = appName.replace(/ +/g, "-"); // Replace spaces with dashes
        console.log(appName);
        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render(path.join(__dirname, "/views/error.ejs"), { errors: "Field 'App name' empty" });
        } else {

            // Make sure we are not registering a duplicate app
            var validApps = appDB.getAppList();
            for (var i = 0; i < validApps.length; i++) {
                if (validApps[i].app_name == appName) {
                    res.render(path.join(__dirname, "/views/error.ejs"), { errors: "App with that name already exists" });
                    return;
                }
            }

            appDB.addApp(appName);
            var newApp = appDB.getApp(appName);

            // Create log file
            var logFileName = logDir + "/" + newApp.app_name + ".log.txt";

            var fStream = fs.createWriteStream(logFileName);
            fStream.write("[lager]: initialized app and created log!\n");
            fStream.end();

            res.render(path.join(__dirname, "/views/auth_add_app_success.ejs"), { app_name: newApp.app_name, api_key: newApp.api_key });
    }
});

// GET /auth/app-list
// Returns a JSON list of all registered apps
app.get("/auth/app-list", (req, res) => {
    var appList = appDB.getAppList();

    if (appList.length == 0) {
        res.render(path.join(__dirname, "/views/error.ejs"), { errors: "No apps registered in the database yet" });
    }

    for (var i = 0; i < appList.length; i++) {
        res.render(path.join(__dirname, "/views/all_apps.ejs"), { app_list: appList });
    }
});

// GET /auth/view-app
// @todo
// Returns a JSON object of the requested app
app.get("/auth/view-app/", (req, res) => {
    var app = appDB.getApp(req.params.appName);
    res.render(path.join(__dirname, "/views/_partials/app.ejs"), { app: app, app_name: app.app_name, api_key: app.api_key });
});

// GET /auth/wipe-db
// Wipes database
app.get("/auth/wipe-database", (req, res) => {
    appDB.wipeDatabase();
    res.render(path.join(__dirname, "/views/database_wiped.ejs"));
});

// GET /auth/revoke
// UI for user to select app to remove from database
app.get("/auth/revoke", (req, res) => {
    var appList = appDB.getAppList();

    if (appList.length == 0) {
        res.render(path.join(__dirname, "/views/error.ejs"), { errors: "No apps registered in the database yet" });
    }

    res.render(path.join(__dirname, "/views/_partials/app_list_with_buttons.ejs"), { app_list: appList, url: "/auth/revoke-app?app=", text: "Revoke" });
});

// GET /auth/revoke-app?app="appname"
// Removes an app from database
app.get("/auth/revoke-app", (req, res) => {
    appDB.removeApp(req.query.app);
    res.render(path.join(__dirname, "/views/removed_app.ejs"));
});

// GET /logs/view
app.get("/logs/view", (req, res) => {
    var appList = appDB.getAppList();

    res.render(path.join(__dirname, "/views/_partials/app_list_with_buttons.ejs"), { app_list: appList, url: "/logs/view-log?app=", text: "View log" })
});

// POST /apps/write/?appName="appName"?text="Text"?auth="AuthKey"
// Writes the log of a specified app
// app - name of app registered in database
// text - text to log
// auth - auth key assigned in database
app.post("/log/write", (req, res) => {
    var appName = req.query.app;
    var logText = req.sanitize(req.query.text); 
    var authKey = req.query.auth;
    
    if (!appDB.appExists(appName)) {
        res.status(400).send("400 bad request: Invalid 'app' parameter - app does not exist")
    }

    
    var formattedLogEntry = "[" + appName + "]: " + logText + "\n";
    
    // Open log
    fs.appendFileSync(logDir + "/" + appName + ".log.txt", formattedLogEntry, (err) => {
        if (err) logger.error("Error writing to file\n" + err);
        console.log("wrote to file");
    });

    
    res.end();

});

// GET /logs/view-log?app="app"
// Views log of an app
// ?app - name of app
app.get("/logs/view-log", (req, res) => {
    var appName = req.query.app;

    if (!appDB.appExists(appName)) {
        res.render(path.join(__dirname, "/views/error.ejs"), { errors: "App doesn't exist" });
    }

    res.render(path.join(__dirname, "/views/view_log.ejs"), { app_name: appName });
});

// GET /log/get-log?app="App-name"
// Returns actual log file
// app - name of app
app.get("/log/get-log", (req, res) => {
    var appName = req.query.app;

    if (!appDB.appExists(appName)) {
        res.status(400).send("400 bad request: Invalid 'name' parameter - app does not exist");
    }

    res.sendFile(logDir + "/" + appName + ".log.txt");
});

// 404 file not found
app.use((req, res) => {
    res.status("404").render(path.join(__dirname, "/views/404_error.ejs"));
})

/*
*   Start express
*/
app.listen(port, () => {
    logger.info("Started lager on port " + port + ". (Environment=" + process.env.environment + ")");
});