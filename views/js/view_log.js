/*
*   view_log.js
*   Reads a log file and renders it to page.
*   Use with view_log.ejs
*   Requires jQuery.
*/

var appName;

window.onload = () => {

    // Get hidden meta
    appName = $(".appName").html();

    // Render log from file
    $.get("/apps/" + appName + "/get-log", (data) => {
        data = data.replace(/\n/g, "<br>"); // Replace newlines with <br>
        $(".log-content").html(data);
    });
}

function exportFile() {
    window.open("/apps/"+ appName + "/get-log");
}