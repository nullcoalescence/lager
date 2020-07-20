/*
*   database.js
*   Responsible for handling JSON file which contains app list JSON
*/

// Config
var path = require("path");
var fs = require("fs");
const { json } = require("express");

require("dotenv").config();

// App database
var appDB = path.join(__dirname, "/authorized_apps_db.json");

/*
*   Adds an app to the database
*/
function addApp(appName) {
    // Generate API key
    var apiKey = generateKey();

    // Read database
    var raw = fs.readFileSync(appDB);
    var jsonData = JSON.parse(raw);

    // Add new data
    jsonData.authorized_apps.push({ "app_name": appName, "api_key": apiKey });

    // Write to database
    var newData = JSON.stringify(jsonData);
    fs.writeFileSync(appDB, newData);
}

/*
*   Gets an app from the database
*   Returns as a JSON object
*/
function getApp(appName) {
    var appList = getAppList();
    for (var i = 0; i < appList.length; i++) {
        if (appList[i].app_name == appName) {
            return appList[i];
        }
    }
}

/*
*   Removes an app from the database
*/
function removeApp(appName) {
}

/*
*   Generates a list of all appNames and appKeys
*   [{ "appName": "test app", "appKey": "35w46w464w64wesdg"}]
*/
function getAppList() {
    // Read database
    var raw = fs.readFileSync(appDB);
    var jsonData = JSON.parse(raw);
    return jsonData.authorized_apps;
}

/*
*   Wipes all items from database
*/
function wipeDatabase() {
    // Read database
    var raw = fs.readFileSync(appDB);
    var jsonData = JSON.parse(raw);

        // Add new data
        jsonData.authorized_apps = []; // Clear

        // Write to database
        var newData = JSON.stringify(jsonData);
        fs.writeFileSync(appDB, newData);

}

// ====================================================================================
// Non-exported functions
// ====================================================================================

/* 
*   Generates key for an app in the database
*   This key is used in API requests to lager to verify app
*/
function generateKey() {
    return "API_KEY";
}

/*
*   Exports
*/
module.exports = {
    addApp,
    getApp,
    removeApp,
    getAppList,
    wipeDatabase
}