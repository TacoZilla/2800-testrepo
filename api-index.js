const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const pg = require("pg");
const dotenv = require('dotenv').config();

const saltRounds = 12;
const app = express();
const port = process.env.PORT || 3000;

const config = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DBPORT,
    database: process.env.DATABASE,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("./ca.pem").toString(),
    }
}

const client = new pg.Client(config);

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/js", express.static(__dirname + "./js"));
app.use("/css", express.static(__dirname + "./css"));
app.use("/img", express.static(__dirname + "./img"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    store: client,
    resave: false,
    saveUninitialized: true
}))

