const fs = require("fs");
const pg = require("pg");
const ejs = require('ejs');

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
        let storageId = req.query.ID;
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
};
