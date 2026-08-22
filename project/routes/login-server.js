const express = require("express");
const sql = require("../config/db");
const router = express.Router(); 

router.post("/signup", (req, res) => {
    const {
        username,
        password,
        firstName,
        lastName,
        email
    } = req.body;

    sql`
        INSERT INTO users
        (username, password, first_name, last_name, email)
        VALUES (
            ${username},
            ${password},
            ${firstName},
            ${lastName},
            ${email}
        )
        RETURNING id, username, first_name, last_name, email
    `
    .then(result => {
        res.json({
            success: true,
            message: "Account created!",
            user: result[0]
        });
    })
    .catch(error => {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not create account"
        });
    });
});


router.post("/login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    sql`
        SELECT id, username, password, first_name, last_name, email
        FROM users
        WHERE username = ${username}
    `
    .then(result => {

        if (result.length === 0) {

            return res.json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const user = result[0];

        if (password !== user.password) {

            return res.json({
                success: false,
                message: "Invalid username or password"
            });
        }

        req.session.userId = user.id;
        req.session.username = user.username;


        res.json({
            success: true,
            message: "Login successful!"
        });

    })
    .catch(error => {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });

    });
});

router.get("/current-user", (req, res) => {

    if (!req.session.userId) {

        return res.json({
            loggedIn: false
        });
    }

    sql`
        SELECT id, username, first_name, last_name, email
        FROM users
        WHERE id = ${req.session.userId}
    `
    .then(result => {

        if (result.length === 0) {

            return res.json({
                loggedIn: false
            });
        }

        res.json({
            loggedIn: true,
            user: result[0]
        });

    })
    .catch(error => {

        console.error(error);

        res.status(500).json({
            loggedIn: false
        });

    });
});

router.post("/logout", (req, res) => {

    req.session.destroy(error => {

        if (error) {

            return res.status(500).json({
                success: false,
                message: "Could not log out"
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logged out"
        });

    });
});

module.exports = router; 

