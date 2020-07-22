/*
*   database.js
*   Responsible for handling JSON file which contains app list JSON
*/

// Config
var path = require("path");
var fs = require("fs");
const { json } = require("express");
const { data } = require("jquery");

require("dotenv").config();

// App database
var database = path.join(__dirname, "/authorized_apps_db.json");

/*
*   Adds an app to the database
*/
function addApp(appName) {
    // Generate API key
    var apiKey = generateKey();
    console.log(apiKey);

    // Read database
    var raw = fs.readFileSync(database);
    var jsonData = JSON.parse(raw);

    // Add new data
    jsonData.authorized_apps.push({ "app_name": appName, "api_key": apiKey });

    // Write to database
    var newData = JSON.stringify(jsonData);
    fs.writeFileSync(database, newData);
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
    // Read database
    var jsonData = JSON.parse(fs.readFileSync(database));
    
    // Read through data to file our app
    for (var i = 0; i < jsonData.authorized_apps.length; i++) {
        if (jsonData.authorized_apps[i].app_name == appName) {
            jsonData.authorized_apps.splice(i, 1);
        }
    }

    // Write to database
    fs.writeFileSync(database, JSON.stringify(jsonData));
}

/*
*   Generates a list of all appNames and appKeys
*   [{ "appName": "test app", "appKey": "35w46w464w64wesdg"}]
*/
function getAppList() {
    // Read database
    var raw = fs.readFileSync(database);
    var jsonData = JSON.parse(raw);
    return jsonData.authorized_apps;
}

/*
*   Wipes all items from database
*/
function wipeDatabase() {
    // Read database
    var jsonData = JSON.parse(fs.readFileSync(database));

    // Add new data
    jsonData.authorized_apps = []; // Clear

    // Write to database
    fs.writeFileSync(database, JSON.stringify(jsonData));
}

/*
*   Checks if app exists in the database
*/
function appExists(appName) {
    var apps = getAppList();
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].app_name == appName) {
            return true;
        }
    }
    return false;
}

// ====================================================================================
// Non-exported functions
// ====================================================================================

/* 
*   Generates key for an app in the database
*   This key is used in API requests to lager to verify app
*/
function generateKey() {
    return Math.floor(Math.random() * 1000);
}

/*
*   Exports
*/
module.exports = {
    addApp,
    getApp,
    removeApp,
    getAppList,
    wipeDatabase,
    appExists
}