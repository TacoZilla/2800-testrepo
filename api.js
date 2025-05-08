const bcrypt = require("bcrypt");
const fs = require("fs");
const pg = require("pg");
const ejs = require("ejs");

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
            client.query("SELECT * FROM public.storage", async (error, results) => {
                if (error) {
                    console.log(error);
                    client.end();
                    return;
                }
                console.log(results)
                try {
                    // Map each row to a promise that renders the template
                    const renderedCards = await Promise.all(
                        results.rows.map(row => 
                            ejs.renderFile("views/partials/storage-card.ejs", { row })
                        )
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
};
