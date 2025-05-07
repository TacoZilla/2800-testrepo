const bcrypt = require("bcrypt");
const fs = require("fs");
const pg = require("pg");

const saltRounds = 12;

const config = ({
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DBPORT,
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
        console.log(storageId);
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
            console.log('date', storage.lastCleaned)
            res.render('manage', { storage });
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
            console.log('data', result.rows[0])
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
        }finally {
            await client.end();
        }
    });
};


















