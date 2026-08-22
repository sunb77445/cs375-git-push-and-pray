const express = require("express");
const sql = require("../config/db");

const router = express.Router();

router.get("/users/:username", (req, res) => {

    const username = req.params.username;

    sql`
        SELECT id, username, first_name, last_name
        FROM users
        WHERE username = ${username}
    `
    .then(result => {

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: result[0]
        });

    })
    .catch(error => {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not search for user"
        });

    });
});


router.post("/friends/request", (req, res) => {

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


    if (senderId == receiverId) {
        return res.status(400).json({
            success: false,
            message: "You cannot add yourself"
        });
    }


    sql`
        SELECT id
        FROM users
        WHERE id = ${receiverId}
    `
    .then(result => {

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        return sql`
            SELECT id, status
            FROM friend_requests
            WHERE sender_id = ${senderId}
            AND receiver_id = ${receiverId}
            AND status = 'pending'
        `;

    })
    .then(result => {

        if (!result) {
            return;
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Friend request already sent"
            });
        }


        return sql`
            INSERT INTO friend_requests
            (sender_id, receiver_id, status)
            VALUES (
                ${senderId},
                ${receiverId},
                'pending'
            )
            RETURNING id
        `;

    })
    .then(result => {

        if (!result) {
            return;
        }


        const requestId = result[0].id;


        return sql`
            INSERT INTO notifications
            (user_id, message, type)
            VALUES (
                ${receiverId},
                'You received a new friend request',
                'friend_request'
            )
            RETURNING id
        `
        .then(() => {

            res.json({
                success: true,
                message: "Friend request sent!"
            });

        });

    })
    .catch(error => {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not send friend request"
        });

    });

});


module.exports = router;
