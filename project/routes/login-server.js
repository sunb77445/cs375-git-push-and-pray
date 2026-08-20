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

        res.json({
            success: true,
            message: "Login successful!",
            user: {
                id: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            }
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

module.exports = router; 

