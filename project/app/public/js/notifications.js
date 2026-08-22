async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(
            `/notifications/${notificationId}/read`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (data.success) {
            await loadNotifications();
        }

    } catch (error) {
        console.error("Could not mark notification as read:", error);
    }
}

async function loadNotifications() {

    try {

        const response = await fetch("/notifications");
        const data = await response.json();

        if (!data.success) {
            return;
        }

        const list =
            document.getElementById("notificationsList");

        const notificationButton =
            document.getElementById("notificationButton");

        const unreadCount = data.notifications.length;

        if (unreadCount > 0) {
            notificationButton.classList.add("has-notifications");
        } else {
            notificationButton.classList.remove("has-notifications");
        }

        if (data.notifications.length === 0) {
            list.innerHTML = "<p>No notifications.</p>";
            return;
        }

        list.innerHTML = "";

        data.notifications.forEach(notification => {

            const notificationElement =
                document.createElement("div");

            notificationElement.classList.add("notification-item");

            if (notification.type === "friend_request") {

                notificationElement.innerHTML = `
                    <p>${notification.message}</p>

                    <div class="friend-request-buttons">

                        <button
                            class="acceptButton"
                            data-id="${notification.friend_request_id}">
                            O
                        </button>

                        <button
                            class="declineButton"
                            data-id="${notification.friend_request_id}">
                            X
                        </button>

                    </div>
                `;

            } else {

                notificationElement.innerHTML = `
                    <p>${notification.message}</p>
                `;

                notificationElement.addEventListener(
                    "click",
                    async function() {

                        await markNotificationAsRead(notification.id);

                    }
                );

            }

            list.appendChild(notificationElement);

        });


        document
            .querySelectorAll(".acceptButton")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async function() {

                        const requestId = this.dataset.id;

                        const response = await fetch(
                            `/friends/requests/${requestId}/accept`,
                            {
                                method: "POST"
                            }
                        );

                        const result = await response.json();

                        if (!result.success) {
                            alert(result.message);
                            return;
                        }

                        await loadNotifications();
                        await loadFriends();

                    }
                );

            });


        document
            .querySelectorAll(".declineButton")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async function() {

                        const requestId = this.dataset.id;

                        const response = await fetch(
                            `/friends/requests/${requestId}/decline`,
                            {
                                method: "POST"
                            }
                        );

                        const result = await response.json();

                        if (!result.success) {
                            alert(result.message);
                            return;
                        }

                        await loadNotifications();
                        await loadFriends();

                    }
                );

            });

    } catch (error) {

        console.error(
            "Could not load notifications:",
            error
        );

    }
}

document.getElementById("notificationButton")
    .addEventListener("click", async function() {

        document
            .getElementById("notificationDropdown")
            .classList.toggle("show");

        await loadNotifications();
    });
