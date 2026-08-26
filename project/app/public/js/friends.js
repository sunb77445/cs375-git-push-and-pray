async function loadFriends() {
    try {
        const response = await fetch("/friends");
        const data = await response.json();

        const list = document.getElementById("friendsList");

        if (!data.success) {
            list.innerHTML = `<p>${data.message}</p>`;
            return;
        }

        if (data.friends.length === 0) {
            list.innerHTML = "<p>No friends yet.</p>";
            return;
        }

        list.innerHTML = "";

        data.friends.forEach(friend => {
            const friendElement = document.createElement("div");

            friendElement.classList.add("friend-item");

            friendElement.innerHTML = `
                <p>
                    <strong>${friend.username}</strong>
                    <br>
                    ${friend.first_name} ${friend.last_name}
                </p>
            `;

            list.appendChild(friendElement);
        });

    } catch (error) {
        console.error("Could not load friends:", error);

        document.getElementById("friendsList").innerHTML =
            "<p>Could not load friends.</p>";
    }
}


document.getElementById("friendButton").addEventListener("click", async function() {

    const friendDropdown = document.getElementById("friendDropdown");
    const userDropdown = document.getElementById("userDropdown");
    const notificationDropdown = document.getElementById("notificationDropdown");

    userDropdown.classList.remove("show");
    notificationDropdown.classList.remove("show");

    friendDropdown.classList.toggle("show");

    if (friendDropdown.classList.contains("show")) {
        await loadFriends();
    }
});


document.getElementById("searchFriendButton").addEventListener("click", async function() {

    const username =
        document.getElementById("friendUsername").value.trim();

    const result =
        document.getElementById("friendResult");

    if (!username) {
        result.innerHTML = "<p>Please enter a username.</p>";
        return;
    }

    try {
        const response = await fetch(
            "/users/" + encodeURIComponent(username)
        );

        const data = await response.json();

        if (!data.success) {
            result.innerHTML = `<p>${data.message}</p>`;
            return;
        }

        result.innerHTML = `
            <p>
                ${data.user.username}
                (${data.user.first_name} ${data.user.last_name})
            </p>

            <button id="addFriendButton">
                Add Friend
            </button>
        `;

        document.getElementById("addFriendButton")
            .addEventListener("click", async function() {

                const response = await fetch(
                    "/friends/request",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            receiverId: data.user.id
                        })
                    }
                );

                const result = await response.json();

                document.getElementById("friendResult").innerHTML =
                    `<p>${result.message}</p>`;
            });

    } catch (error) {
        console.error(error);

        result.innerHTML =
            "<p>Something went wrong.</p>";
    }
});