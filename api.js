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


    app.get("/manage/storage", async (req, res) => {
        const storageId = req.query.storageId;

        if (!storageId) {
            return res.status(400).json({ error: "Storage ID is required" });
        }
        const client = new pg.Client(config);
        try {
            await client.connect();

            const result = await client.query(
                `SELECT * FROM public.storage WHERE "storageId" = $1 AND "deletedDate" IS NULL`, // ✅ spelling fix: storageId
                [storageId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Storage not found" });
            }

            const storage = result.rows[0];

            if (storage.lastCleaned) {
                storage.lastCleaned = new Date(storage.lastCleaned);
            }
            res.render('manage', {
                storage,
                stylesheets: ["manage.css"],
                scripts: ["manage.js"]
            });
        } catch (error) {
            console.error("Error fetching storage:", error);
            res.status(500).json({ error: "Internal server error" });
        } finally {
            await client.end(); // ✅ Close connection
        }

    });

    app.put("/manage/storage", async (req, res) => {
        const { storageId } = req.query;
        const { title, storageType, street, city, province, lastCleaned, image } = req.body;

        if (!storageId) {
            return res.status(400).json({ error: "Storage ID is required" });
        }
        const client = new pg.Client(config);
        try {
            // Convert empty string to NULL
            const cleanedValue = lastCleaned === '' || lastCleaned === null
                ? null
                : lastCleaned;
            await client.connect();

            const result = await client.query(
                `UPDATE public.storage
                 SET "title" = $1, 
                     "storageType" = $2, 
                     "street" = $3, 
                     "city" = $4, 
                     "province" = $5, 
                     "lastCleaned" = $6,
                     "image"= $7
                 WHERE "storageId" = $8
                 RETURNING *`,
                [title, storageType, street, city, province, cleanedValue, image, storageId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Storage not found" });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error("Error updating storage:", error);
            res.status(500).json({ error: "Internal server error" });
        } finally {
            await client.end(); // ✅ Close connection
        }
    });

    app.delete("/manage/storage/soft-delete", async (req, res) => {
        const { storageId } = req.query;

        if (!storageId) {
            return res.status(400).json({ error: "Storage ID is required" });
        }
        const client = new pg.Client(config);

        try {
            await client.connect();

            const result = await client.query(
                `UPDATE public.storage 
                 SET "deletedDate" = CURRENT_DATE 
                 WHERE "storageId" = $1 
                 RETURNING *`,
                [storageId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Storage not found" });
            }

            res.json({ message: "Storage soft-deleted", storage: result.rows[0] });
        } catch (error) {
            console.error("Error soft-deleting storage:", error);
            res.status(500).json({ error: "Internal server error" });
        } finally {
            await client.end();
        }
    });

    app.post('/manage/storage/upload', upload.single('photo'), async (req, res) => {

        const storageId = req.query.storageId;
        if (!storageId) {
            return res.status(400).json({ error: 'Missing storageId' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file upload' });
        }
        const client = new pg.Client(config);

        try {
            await client.connect();

            //delete old image
            try {
                const existing = await client.query(
                    `SELECT "imgPublicId" FROM public.storage WHERE "storageId" = $1`,
                    [storageId]
                );

                const oldPublicId = existing.rows[0]?.imgPublicId;

                if (oldPublicId) {
                    await cloudinary.uploader.destroy(oldPublicId);
                }
            } catch (error) {
                console.error('Delete on the cloudinary error:', error);
                res.status(500).json({ error: 'Server error' });

            }


            // Upload to Cloudinary
            const imageUrl = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(

                    { folder: 'storage_img' },

                    (error, result) => {

                        if (error) return reject(error);

                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id
                        });
                    }
                );
                stream.end(req.file.buffer);
            });

            // Save image URL in PostgreSQL
            await client.query(
                `UPDATE public.storage SET 
                    "image" = $1,
                    "imgPublicId" = $2
                    WHERE "storageId" = $3`,
                [imageUrl.url, imageUrl.publicId, storageId]
            );

            res.status(200).json({ image: imageUrl.url });

            // Pipe the image buffer to Cloudinary upload stream
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Server error' });
        } finally {
            await client.end();

        }

    });
    // isabel put ur code here

    // app.get('/api/reviews', (req, res) => {
    //     const client = new pg.Client(config);
    //     client.connect((err) => {
    //         if (err) {
    //             console.log(err);
    //             return;
    //         }
    //         client.query(
    //             "SELECT * FROM public.reviews", async (error, results) => {
    //                 if (error) {
    //                     console.log(error);
    //                     client.end();
    //                     return;
    //                 }
    //                 console.log(results)
    //                 try {
    //                     // Map each row to a promise that renders the template
    //                     const renderedCards = await Promise.all(
    //                         results.rows.map(row =>
    //                             ejs.renderFile("views/partials/review-card.ejs", { row })
    //                         )
    //                     );
    //                     // Send the array of rendered HTML
    //                     res.json(renderedCards);
    //                 } catch (err) {
    //                     console.error("Template rendering error:", err);
    //                     res.status(500).json({ error: "Failed to render templates" });
    //                 } finally {
    //                     client.end();
    //                 }
    //             });
    //     });
    // });

    // api.js
    app.get('/api/reviews', (req, res) => {
        console.log("isabel")
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

    //end isabel
};

























