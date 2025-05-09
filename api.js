const bcrypt = require("bcrypt");
const fs = require("fs");
const pg = require("pg");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const express = require('express');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const saltRounds = 12;

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
            client.query("SELECT * FROM public.storage", (error, results) => {
                if (error) {
                    console.log(error);
                }
                res.render('browse', results.rows);
                client.end();
            });
        });
    });

    app.get('/api/contents', (req, res) => {
        let storageID = req.query.ID;
        const client = new pg.Client(config);
        client.connect((err) => {
            if (err) {
                console.log(err);
                return;
            }
            client.query(`
                SELECT s."storageType", s."title", s."street", s."city", s."province", s."image", s."lastCleaned", s."coordinates", 
                c."contentId", c."itemName", c."quantity", c."bbd" 
                FROM public.storage AS s 
                JOIN public.content AS c ON s."storageId" = c."storageId" 
                WHERE s."storageId" = $1`, [storageID], (error, results) => {
                if (error) {
                    console.log(error);
                    client.end();
                    return;
                }
                res.render('contents', results.rows);
                client.end();
            });
        });

    });

    app.get("/storageloc", async (req, res) => {
        const storageId = req.query.id;
        const client = new pg.Client(config);
        await client.connect();
        const seperate = await client.query(`
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


    
};
