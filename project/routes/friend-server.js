const express = require("express");
const sql = require("../config/db");

const router = express.Router();

router.get("/users/:username", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const username = req.params.username;

        const result = await sql`
            SELECT id, username, first_name, last_name
            FROM users
            WHERE username = ${username}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (Number(result[0].id) === Number(req.session.userId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot add yourself"
            });
        }

        res.json({
            success: true,
            user: result[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not search for user"
        });
    }
});


router.post("/friends/request", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const senderId = req.session.userId;
        const receiverId = req.body.receiverId;

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Receiver ID is required"
            });
        }

        if (Number(senderId) === Number(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot add yourself"
            });
        }

        const receiver = await sql`
            SELECT id
            FROM users
            WHERE id = ${receiverId}
        `;

        if (receiver.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const existingRequest = await sql`
            SELECT id, sender_id, receiver_id, status
            FROM friend_requests
            WHERE
                (sender_id = ${senderId} AND receiver_id = ${receiverId})
                OR
                (sender_id = ${receiverId} AND receiver_id = ${senderId})
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (existingRequest.length > 0) {
            const request = existingRequest[0];

            if (request.status === "accepted") {
                return res.status(400).json({
                    success: false,
                    message: "You are already friends"
                });
            }

            if (request.status === "pending") {
                return res.status(400).json({
                    success: false,
                    message: "A friend request already exists"
                });
            }
        }

        const request = await sql`
            INSERT INTO friend_requests
            (sender_id, receiver_id, status)
            VALUES (
                ${senderId},
                ${receiverId},
                'pending'
            )
            RETURNING id
        `;

        const requestId = request[0].id;

        const sender = await sql`
            SELECT username
            FROM users
            WHERE id = ${senderId}
        `;

        const senderUsername = sender[0].username;

        await sql`
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                friend_request_id
            )
            VALUES (
                ${receiverId},
                ${senderUsername} || ' sent you a friend request',
                'friend_request',
                ${requestId}
            )
        `;

        res.json({
            success: true,
            message: "Friend request sent!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not send friend request"
        });
    }
});


router.get("/notifications", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const notifications = await sql`
            SELECT
                n.id,
                n.message,
                n.type,
                n.is_read,
                n.created_at,
                n.friend_request_id
            FROM notifications n
            WHERE n.user_id = ${req.session.userId}
            AND n.is_read = false
            ORDER BY n.created_at DESC
        `;

        res.json({
            success: true,
            notifications
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not get notifications"
        });
    }
});


router.post("/friends/requests/:id/accept", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const requestId = req.params.id;
        const receiverId = req.session.userId;

        const request = await sql`
            UPDATE friend_requests
            SET status = 'accepted'
            WHERE id = ${requestId}
            AND receiver_id = ${receiverId}
            AND status = 'pending'
            RETURNING id, sender_id, receiver_id
        `;

        if (request.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found"
            });
        }

        const senderId = request[0].sender_id;

        await sql`
            UPDATE notifications
            SET is_read = true
            WHERE friend_request_id = ${requestId}
            AND user_id = ${receiverId}
        `;

        const receiver = await sql`
            SELECT username
            FROM users
            WHERE id = ${receiverId}
        `;

        const receiverUsername = receiver[0].username;

        await sql`
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                is_read
            )
            VALUES (
                ${senderId},
                ${receiverUsername} || ' accepted your friend request',
                'friend_request_accepted',
                false
            )
        `;

        res.json({
            success: true,
            message: "Friend request accepted!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not accept friend request"
        });
    }
});


router.post("/friends/requests/:id/decline", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const requestId = req.params.id;
        const receiverId = req.session.userId;

        const request = await sql`
            UPDATE friend_requests
            SET status = 'declined'
            WHERE id = ${requestId}
            AND receiver_id = ${receiverId}
            AND status = 'pending'
            RETURNING id, sender_id
        `;

        if (request.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found"
            });
        }

        const senderId = request[0].sender_id;

        await sql`
            UPDATE notifications
            SET is_read = true
            WHERE friend_request_id = ${requestId}
            AND user_id = ${receiverId}
        `;

        const receiver = await sql`
            SELECT username
            FROM users
            WHERE id = ${receiverId}
        `;

        const receiverUsername = receiver[0].username;

        await sql`
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                is_read
            )
            VALUES (
                ${senderId},
                ${receiverUsername} || ' declined your friend request',
                'friend_request_declined',
                false
            )
        `;

        res.json({
            success: true,
            message: "Friend request declined"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not decline friend request"
        });
    }
});

router.post("/notifications/:id/read", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const notificationId = req.params.id;

        const result = await sql`
            UPDATE notifications
            SET is_read = true
            WHERE id = ${notificationId}
            AND user_id = ${req.session.userId}
            RETURNING id
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not mark notification as read"
        });
    }
});

router.get("/friends", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const userId = req.session.userId;

        const friends = await sql`
            SELECT
                u.id,
                u.username,
                u.first_name,
                u.last_name,
                u.email
            FROM friend_requests fr
            JOIN users u
                ON (
                    CASE
                        WHEN fr.sender_id = ${userId}
                        THEN fr.receiver_id
                        ELSE fr.sender_id
                    END
                ) = u.id
            WHERE
                (
                    fr.sender_id = ${userId}
                    OR fr.receiver_id = ${userId}
                )
                AND fr.status = 'accepted'
            ORDER BY u.username
        `;

        res.json({
            success: true,
            friends
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not get friends"
        });
    }
});


module.exports = router;