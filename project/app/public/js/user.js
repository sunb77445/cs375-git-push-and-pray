async function loadCurrentUser() {
    const response = await fetch("/current-user");
    const data = await response.json();

    if (!data.loggedIn) {
        window.location.href = "login.html";
        return;
    }

    document.querySelector("h1").textContent =
        data.user.username + "'s Travel Planner";

    document.getElementById("username").textContent =
        data.user.username;

    document.getElementById("firstName").textContent =
        data.user.first_name;

    document.getElementById("lastName").textContent =
        data.user.last_name;

    document.getElementById("email").textContent =
        data.user.email;
}

document.getElementById("userButton").addEventListener("click", function() {

    const userDropdown = document.getElementById("userDropdown");
    const friendDropdown = document.getElementById("friendDropdown");
    const notificationDropdown = document.getElementById("notificationDropdown");

    friendDropdown.classList.remove("show");
    notificationDropdown.classList.remove("show");

    userDropdown.classList.toggle("show");
});

document.getElementById("logoutButton").addEventListener("click", async function() {
    const response = await fetch("/logout", {
        method: "POST"
    });

    const data = await response.json();

    if (data.success) {
        window.location.href = "login.html";
    }
});

document.getElementById("createPlanButton").addEventListener("click", function() {
    window.location.href = "create.html";
});