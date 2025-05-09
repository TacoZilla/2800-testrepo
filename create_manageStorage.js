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

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// async function geocodeAddress(fullAddress) {
//     const encoded = encodeURIComponent(fullAddress);
//     const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

//     const response = await fetch(url, {
//         headers: {
//             'User-Agent': 'YourAppNameHere/1.0 (your@email.com)' // optional but polite
//         }
//     });

//     const data = await response.json();

//     if (data.length === 0) {
//         throw new Error('Geocoding failed: No results found');
//     }

//     return {
//         lat: parseFloat(data[0].lat),
//         lng: parseFloat(data[0].lon), // note: OpenStreetMap uses "lon" for longitude
//     };
// }

async function geocodeAddress(fullAddress) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const encoded = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        return {
            lat: location.lat,
            lng: location.lng,
        };
    } else {
        throw new Error('Geocoding failed: ' + data.status);
    }
}

module.exports = function (app) {

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

    

    app.get('/storage/createnew', (req, res) => {
        res.render('create_new', {
            stylesheets: ["create_new.css"],
            scripts: ["create_new.js"]
        });
    });

    app.post('/storage/createnew', async (req, res) => {
        // const ownerId = req.session.userId;
        const ownerId = '1';
        if (!ownerId) {
            return res.status(400).json({ error: "userID is required" });
        }

        const { storageType, title, street, city, province, description } = req.body;
        const address = `${street}, ${city}, ${province}, Canada`;

        const coords = await geocodeAddress(address);
        console.log(coords);

        const client = new pg.Client(config);

        try {

            await client.connect();

            const createData = await client.query(
                `INSERT INTO public.storage ("storageType", "title", "street", "city", "ownerId", "province", "description", "coordinates" ) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, POINT($8, $9)) 
                        RETURNING *`,
                [storageType, title, street, city, ownerId, province, description, coords.lat, coords.lng]
            );

            if (createData.rows.length === 0) {
                return res.status(404).json({ error: "Storage not created" });
            }

            res.json({ message: "Storage created", storage: createData.rows[0] });
        } catch (error) {
            console.error("Error creating storage:", error);
            res.status(500).json({ error: "Internal server error" });
        } finally {
            await client.end();
        }

    });

    app.post('/storage/createnew/upload', upload.single('photo'), async (req, res) => {

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
                        if (!result?.secure_url || !result?.public_id) {
                            return reject(new Error('Cloudinary upload did not return valid URL or public ID.'));
                        }
                    }
                );
                stream.end(req.file.buffer);
            });
            
            console.log('Saving image URL to DB:', imageUrl);

            // Save image URL in PostgreSQL
            await client.query(
                `UPDATE public.storage SET 
                            "image" = $1,
                            "imgPublicId" = $2
                            WHERE "storageId" = $3`,
                [imageUrl.url, imageUrl.publicId, storageId]
            );
            console.log('Rows affected:', result.rowCount);
            if (result.rowCount === 0) {
                throw new Error('No rows updated. Check if storageId exists.');
            }
            res.status(200).json({ image: imageUrl.url });

            // Pipe the image buffer to Cloudinary upload stream
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Server error' });
        } finally {
            await client.end();

        }

    });
};