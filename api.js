const {getDistance} = require("./js/userLocation");
const fs = require("fs");
const pg = require("pg");
const ejs = require("ejs");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const express = require('express');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});

const config = ({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DATABASE,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("./ca.pem").toString(),
    }
});


module.exports = function (app) {
    app.get('/api/browse', (req, res) => {


        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.log(err);
                return;
            }
            client.query("SELECT * FROM public.storage", async (error, results) => {
                if (error) {
                    console.log(error);
                    client.end();
                    return;
                }
                try {
                    const lat = parseFloat(req.query.lat);
                    const lon = parseFloat(req.query.lon);
           
                    // Map each row to a promise that renders the template
                    const renderedCards = await Promise.all(
                        results.rows.map((row) => {
                            let distance = getDistance(lat, lon, parseFloat(row.coordinates.x), parseFloat(row.coordinates.y));
                            distance = distance.toFixed(1);
                            return ejs.renderFile("views/partials/storage-card.ejs", { row, distance });
                        })
                    );
                    // Send the array of rendered HTML
                    res.json(renderedCards);
                } catch (err) {
                    console.error("Template rendering error:", err);
                    res.status(500).json({ error: "Failed to render templates" });
                } finally {
                    client.end();
                }
            });
        });
    });

    app.get('/api/contents/:id', (req, res) => {
        let storageID = req.params.id;
        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.log(err);
                return;
            }
            client.query(`
                SELECT 
                c."contentId", c."itemName", c."quantity", to_char(c."bbd", 'Mon dd, yyyy') AS bbd
                FROM public.content AS c
                WHERE c."storageId" = $1`, [storageID], async (error, results) => {
                if (error) {
                    console.log(error);
                    client.end();
                    return;
                }
                const renderedRows = await Promise.all(
                    results.rows.map((row) => {
                        return ejs.renderFile("views/partials/content-rows.ejs", {row});
                    })
                );
                
                res.json(renderedRows)
                client.end();
            });
        });

    });

    app.post('/api/donate', (req, res) => {
        // let storageId = req.query.ID;
        let data = req.body;
        let sql = 'INSERT INTO "content" ("storageId", "itemName", "quantity", "bbd") VALUES '
        let items = [];
        for (let i = 0; i < data.length; i++) {
            let info = data[i];
            let str = "(" + info.storageId + ", '" + info.itemName + "', " + info.quantity + ", '" + info.bbd + "')";
            items.push(str);
        }
        sql += items + ';';

        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.log(err);
                return;
            }
            client.query(sql, (error, results) => {
                if (error) {
                    console.log(sql);
                    res.send({status: "fail", msg: "Unable to add item to DB"})
                }
                else {
                    res.send({status: "success", msg: "Item added to DB"})
                }
            })
        })
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
                            results.rows.map(row =>
                                ejs.renderFile("views/partials/review-card.ejs", { row })
                            )
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

     app.get('/api/fridgePoint', (req, res) => {


        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.log(err);
                return;
            }
            client.query("SELECT * FROM public.storage", async (error, results) => {
                if (error) {
                    console.log(error);
                    client.end();
                    return;
                }
                 const points = results.rows.map(row => ({
                id: row.id,
                name: row.title,
                lat: parseFloat(row.coordinates.x),
                lon: parseFloat(row.coordinates.y)
            }));

            res.json(points);
              
            });
        });
    });


    app.get("/storageloc/:id", async (req, res) => {
        const storageId = req.params.id;
        const client = new pg.Client(config);
        await client.connect();
        const seperate = await client.query(`
            SELECT CAST(coordinates[0] AS FLOAT) AS latitude, CAST(coordinates[1] AS FLOAT) AS longitude
            FROM storage WHERE "storageId" = $1`,
            [storageId]);
       
        res.json(seperate.rows[0]);
        client.end();

    });

    app.get("/gmapkey", (req, res) => {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        res.json({ apiKey })
    });


    
};
