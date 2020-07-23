/*
*   static.js
*   Handles UI and DOM maninpulation
*/

var url;

// onload
window.onload = () => {
    url = location.protocol + "//" + location.host;

    // In case the user's webserver is server lager with a prefix in front of it, like ip-adress/my-lager-instance/
    if (location.href.split("/")[0] && location.href.split("/")[0] !== "about" && location.href.split("/")[0] !== "log") {
        //url += "/" + location.pathname.split("/")[1].split("/")[0];
    }

    $(".url").html(url);
}

// Apply nice hover effect
$(".list-group-item").hover(
    function() { $(this).addClass("active") },
    function() { $(this).removeClass("active") }
);