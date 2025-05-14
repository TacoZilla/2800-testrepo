const { getDistance } = require("./js/userLocation");
const fs = require("fs");
const pg = require("pg");
const ejs = require("ejs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const express = require("express");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DATABASE,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("./ca.pem").toString(),
    },
};

module.exports = function (app) {
    app.get("/api/browse", async (req, res) => {
        const client = new pg.Client(config);
        try {
            await client.connect();

            const storageResults = await client.query('SELECT * FROM public.storage WHERE "deletedDate" IS NULL');

            let favoriteIds = [];
            const favResults = await client.query('SELECT "storageId" FROM public.favourites WHERE "userId" = $1', [
                req.session.userId,
            ]);
            favoriteIds = favResults.rows.map((row) => row.storageId);

            const lat = parseFloat(req.query.lat);
            const lon = parseFloat(req.query.lon);
            const radius = req.query.radiusFilter === "none" || isNaN(parseFloat(req.query.radiusFilter))
                ? null
                : parseFloat(req.query.radiusFilter);

                console.log('radius', radius);
            let renderedCards = await Promise.all(
                storageResults.rows.map((row) => {
                    let distance = getDistance(lat, lon, parseFloat(row.coordinates.x), parseFloat(row.coordinates.y));
                    distance = distance.toFixed(1);
                    const isFavourite = favoriteIds.includes(row.storageId);

                    if (radius !== null && !isFavourite && distance > radius) return null;

                    return ejs
                        .renderFile("views/partials/storage-card.ejs", {
                            row,
                            distance,
                            isFavourite,
                        })
                        .then((html) => ({
                            html,
                            isFavourite,
                            distance,
                        }));
                })
            );

            renderedCards = renderedCards.filter(card => card !== null);

            //sort the cards by favourite/non-favourite, and then sort the sublists by distance.
            let sortByDistance = (arr) => arr.sort((a, b) => a.distance - b.distance);
            let favouriteCards = sortByDistance(renderedCards.filter((card) => card.isFavourite));
            let nonFavouriteCards = sortByDistance(renderedCards.filter((card) => !card.isFavourite));
            let allCards = [...favouriteCards, ...nonFavouriteCards];
            allCards = allCards.map((card) => card.html);
            res.json(allCards);
        } catch (err) {
            console.error("Error:", err);
            res.status(500).json({ error: "Failed to fetch data" });
        } finally {
            await client.end();
        }
    });

    app.get("/api/contents/:id", (req, res) => {
        let storageID = req.params.id;
        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.log(err);
                return;
            }
            client.query(
                `
                SELECT 
                c."contentId", c."itemName", c."quantity", to_char(c."bbd", 'Mon dd, yyyy') AS bbd
                FROM public.content AS c
                WHERE c."storageId" = $1`,
                [storageID],
                async (error, results) => {
                    if (error) {
                        console.log(error);
                        client.end();
                        return;
                    }
                    const renderedRows = await Promise.all(
                        results.rows.map((row) => {
                            return ejs.renderFile("views/partials/content-rows.ejs", { row });
                        })
                    );

                    res.json(renderedRows);
                    client.end();
                }
            );
        });
    });

    app.post("/api/donate", (req, res) => {
        // let storageId = req.query.ID;
        let data = req.body;
        let sql = 'INSERT INTO "content" ("storageId", "itemName", "quantity", "bbd") VALUES ';
        let items = [];
        for (let i = 0; i < data.length; i++) {
            let info = data[i];
            let str = "(" + info.storageId + ", '" + info.itemName + "', " + info.quantity + ", '" + info.bbd + "')";
            items.push(str);
        }
        sql += items + ";";

        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.log(err);
                return;
            }
            client.query(sql, (error, results) => {
                if (error) {
                    console.log(sql);
                    res.send({ status: "fail", msg: "Unable to add item to DB" });
                } else {
                    res.send({ status: "success", msg: "Item added to DB" });
                }
            });
        });
    });

    app.get('/api/reviews', (req, res) => {
        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("DB connection error");
            }

            client.query(
                `SELECT * FROM public.reviews WHERE "deletedDate" IS NULL ORDER BY "createdAt" DESC`,
                async (error, results) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send("Query error");
                    }

                    try {
                        const renderedCards = await Promise.all(
                            results.rows.map((row) => ejs.renderFile("views/partials/review-card.ejs", { row }))
                        );
                        res.send(renderedCards.join("")); // Send HTML string
                    } catch (err) {
                        console.error("Template rendering error:", err);
                        res.status(500).send("Template rendering error");
                    } finally {
                        client.end();
                    }
                }
            );
        });
    });

    app.get("/storageloc/:id", async (req, res) => {
        const storageId = req.params.id;
        const client = new pg.Client(config);
        await client.connect();
        const seperate = await client.query(
            `
            SELECT CAST(coordinates[0] AS FLOAT) AS latitude, CAST(coordinates[1] AS FLOAT) AS longitude
            FROM storage WHERE "storageId" = $1`,
            [storageId]);
        console.log("db:", JSON.stringify(seperate.rows[0]));
        res.json(seperate.rows[0]);
        client.end();

    });

    app.get("/gmapkey", (req, res) => {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        res.json({ apiKey })
    });

    app.post("/api/favourite", async (req, res) => {
        const id = req.body.id;
        const client = new pg.Client(config);
        await client.connect();

        const favResults = await client.query(
            'SELECT "storageId" FROM public.favourites WHERE "userId" = $1 AND "storageId" = $2',
            [req.session.userId, id]
        );
        let favoriteIds = [];
        favoriteIds = favResults.rows.map((row) => row.storageId);

        if (favoriteIds.includes(Number(id))) {
            // If already favourite, remove from favourites
            await client.query('DELETE FROM public.favourites WHERE "userId" = $1 AND "storageId" = $2', [
                req.session.userId,
                id,
            ]);
        } else {
            // If not favourite, add to favourites
            await client.query('INSERT INTO public.favourites ("userId", "storageId") VALUES ($1, $2)', [
                req.session.userId,
                id,
            ]);
        }
        res.status(200).send();
    });
};
