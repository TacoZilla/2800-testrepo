import config from "./config.js";

async function getFridgeLocation(storageId){
    const client = new pg.Client(config);
    await client.connect();
    const seperate = await client.query(`
        SELECT CAST(coordinates[0] AS FLOAT) AS latitude, CAST(coordinates[1] AS FLOAT) AS longitude
        FROM storage WHERE "storageId" = $1`,
        [storageId]);
        console.log("db:", JSON.stringify(seperate.rows[0]));
        client.end();  
        return seperate.rows[0];
}

export async function getDistanceToStore(fridgeId, userlocation = null) {
    if (!userlocation) {
        userlocation = await getUserLocation();
    }
    if (userlocation) {
        let storagelocation = await getStoreLocation(fridgeId);
        let distance = getDistance(userlocation.lat, userlocation.lon, storagelocation.lat, storagelocation.lon);
        return distance;
    }
    return null;
}