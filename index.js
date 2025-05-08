const express = require("express");
const session = require("express-session");
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require("bcrypt");
const fs = require("fs");
const pg = require("pg");
const dotenv = require('dotenv').config();

const saltRounds = 12;
const app = express();
const port = process.env.PORT || 3000;

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DATABASE,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("./ca.pem").toString(),
    }
}

const pgPool = new pg.Pool(config);

app.set('view engine', 'ejs');

// Isabel code
// client.connect()
//     .then(()=> console.log("connected to postgrs"))
//     .catch(err => console.error("oopsie", err.stack));
//

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/js", express.static(__dirname + "/js"));
app.use("/css", express.static(__dirname + "/css"));
app.use("/img", express.static(__dirname + "/img"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    store: new pgSession ({
        pool: pgPool,
        tableName: 'sessions'
    }),
    resave: false,
    saveUninitialized: true
}))

// Route for landing page pre-login
app.get("/", function (req, res) {
    let doc = fs.readFileSync("./html/index.html", "utf8");
    res.send(doc);
})

// Route for landing page pre-login
app.get("/createAccount", function (req, res) {
    let doc = fs.readFileSync("./html/create_account.html", "utf8");
    res.send(doc);
})

// Route for about page
app.get("/about", function (req, res) {
    let doc = fs.readFileSync("./html/about.html", "utf8");
    res.send(doc);
})

// Route for login page
app.get("/login", function (req, res) {
    let doc = fs.readFileSync("./html/login.html", "utf8");
    res.send(doc);
})

// Route for browse page
app.get("/browse", function (req, res) {
    res.render("browse", {
        stylesheets: ["browse.css"],
        scripts: ["profile.js"],
    });
})

// Route for contents page
app.get("/contents", function (req, res) {
    let doc = fs.readFileSync("./html/contents.html", "utf8");
    res.send(doc);
})

// Route for directions page
app.get("/directions", function (req, res) {
    let doc = fs.readFileSync("./html/directions.html", "utf8");
    res.send(doc);
})

// Route for manage page
app.get("/manage", function (req, res) {
    let doc = fs.readFileSync("./html/manage.html", "utf8");
    res.send(doc);
})

// Route for reviews page
app.get("/reviews", function (req, res) {
    let doc = fs.readFileSync("./html/reviews.html", "utf8");
    res.send(doc);
})

// Route for profile page
app.get("/profile", function (req, res) {
    let doc = fs.readFileSync("./html/profile.html", "utf8");
    res.send(doc);
})

// Route for view your fridges page
app.get("/view-own", function (req, res) {
    let doc = fs.readFileSync("./html/view_own.html", "utf8");
    res.send(doc);
})

// Route for create new fridge/pantry page
app.get("/new", function (req, res) {
    let doc = fs.readFileSync("./html/create_new.html", "utf8");
    res.send(doc);
})



//Isabel API
app.get("/api/reviews", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT r.*, u.username FROM reviews r
        JOIN users u ON r.userId = u.userId
        WHERE r.deletedDate IS NULL
        ORDER BY r.createdAt DESC
      `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch reviews");
    }
});

// Logout user and destroys current session
app.post("/logout", function (req, res) {
    if (req.session) {
        req.session.destroy(function (error) {
            if (error) {
                res.status(500).send("Unable to log out")
            } else {
                res.redirect("/");
            }
        });
    }
});

require('./api')(app);
require('./authentication')(app);


// Page not found
app.use(function (req, res, next) {
    let doc = fs.readFileSync("./html/404.html", "utf8");
    res.status(404).send(doc);
    next();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});