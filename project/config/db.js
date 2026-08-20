const postgres = require("postgres");

const apiFile = require("../env.json");

const databaseUrl = apiFile["database_url"];

const sql = postgres(databaseUrl);

module.exports = sql;