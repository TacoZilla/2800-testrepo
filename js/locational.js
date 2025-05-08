let lat, lon;
let storelat, storelon;

function getUserLocation() {
    navigator.geolocation.getCurrentPosition(position => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        console.log(lat + " " + lon);

    })

};

function getDistance(lat1, lon1, lat2, lon2) { //got this from stack overflow https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;

}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function getFridgePosition() {
    let params = new URLSearchParams(window.location.search);
    let storageId = params.get("id");

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/storageloc?id=${storageId}`);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let data = JSON.parse(xhr.responseText);
            storelat = data.latitude;
            storelon = data.longitude;
            console.log(storelat + " " + storelon);
        }
    };
    xhr.send();
}

function switchMapView() {
    console.log("Called");
    let params = new URLSearchParams(window.location.search);
     let storageId = 7; //params.get("id");
const apixhr = new XMLHttpRequest();
apixhr.open("GET", "/gmapkey");
apixhr.onreadystatechange = function() {
    if (apixhr.readyState === 4 && apixhr.status === 200) {
        const apiKey = JSON.parse(apixhr.responseText).apiKey;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/storageloc?id=${storageId}`);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let data = JSON.parse(xhr.responseText);
            storelat = data.latitude;
            storelon = data.longitude;


            const googleEmbed = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${storelat},${storelon}`;
            document.getElementById("map").src = googleEmbed;
            document.getElementById("main-contents").style.display = "none";
            document.getElementById("map-content").style.display = "block";
            
        }
    };
    xhr.send();
}
};
apixhr.send();
}

function openMap() {
    const googleMapsUrl = `https://www.google.com/maps?q=${storelat},${storelon}`;
    window.open(googleMapsUrl, '_blank'); 
}


