

let button1 = document.getElementById("button1").disabled = true;
// button1 = document.getElementById("button1").disabled = false;

let button2 = document.getElementById("button2");
// button2 = document.getElementById("button2").disabled = false;

let loadingScreen = document.querySelectorAll("loading");


button2.addEventListener("click", () => {
    // consolidate info to send to api
    
   loadingScreen.style.display = "block";
});




