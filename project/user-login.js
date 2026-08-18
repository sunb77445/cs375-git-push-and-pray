require("dotenv").config();

const express = require("express");
const sql = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));


app.get("/test-db", (req, res) => {
    sql`SELECT NOW()`
        .then(result => {
            res.json({
                success: true,
                message: "Database connected!",
                time: result[0]
            });
        })
        .catch(error => {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Database connection failed"
            });
        });
});


app.post("/signup", (req, res) => {
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


app.post("/login", (req, res) => {

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


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});