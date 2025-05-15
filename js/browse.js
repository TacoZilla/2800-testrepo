import { getUserLocation, getDistance } from "./userLocation.js";

initialize();



async function initialize() {

    const currentUrl = new URL(window.location.href);
    const lat = currentUrl.searchParams.get("lat");
    const lon = currentUrl.searchParams.get("lon");

    if (!lat || !lon) {


        const location = await getUserLocation();
        const { lat, lon } = location;

        window.location.href = `/browse?lat=${lat}&lon=${lon}`;
        return;
    }

    await loadCards();
    setupFilterButtons();
}

function setupFilterButtons() {
    const buttons = document.querySelectorAll(".filter-button");
    const mainContainer = document.querySelector("#main-card-container");
    for (let button of buttons) {
        button.addEventListener("click", (event) => {
            buttons.forEach(button => button.classList.remove("active"));
            event.target.classList.add("active");
            switch (event.target.name) {
                case "all":
                    mainContainer.classList.remove("filter-fridge", "filter-pantry");
                    break;
                case "fridge":
                    mainContainer.classList.add("filter-fridge");
                    mainContainer.classList.remove("filter-pantry");
                    break;
                case "pantry":
                    mainContainer.classList.add("filter-pantry");
                    mainContainer.classList.remove("filter-fridge");
                    break;
            }
        })
    }
}




async function getCards() {
    let location = await getUserLocation();

    const response = await fetch(`/api/browse?lat=${location.lat}&lon=${location.lon}`);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    return json;
}

async function loadCards() {
    const heroContainer = document.querySelector("#hero-card-container");
    const mainContainer = document.querySelector("#main-card-container");
    const cards = await getCards();
    if (cards.length > 0) {
        let hero = selectHero(cards);
        heroContainer.innerHTML = hero;
        heroContainer.firstChild.classList.add("hero");
        labelType(heroContainer.firstChild);
        for (let card of cards) {
            mainContainer.innerHTML += card;
            labelType(mainContainer.lastChild);
        }
    }
    else {
        console.log("No fridges to show.");
    }
}

//Selects a store to show in the hero section of the page. 
//removes it from the stores array and returns it. 
function selectHero(stores) {
    //TODO: this should use favourites and distance to select a hero
    if (stores.length > 0) {
        let hero = stores[0];
        stores.splice(0, 1);
        return hero;
    }
    return null;
}

function labelType(store) {
    const typeElement = store.querySelector(".card-storage-type");
    if (typeElement.innerHTML == "community fridge") {
        store.classList.add("fridge");
    }
    else {
        store.classList.add("pantry");
    }
}

let mapexist = false;

async function makeMap() {
    const currentUrl = new URL(window.location.href);
    let lat = parseFloat(currentUrl.searchParams.get("lat"));
    let lon = parseFloat(currentUrl.searchParams.get("lon"));
    const userlocation = { lat, lng: lon };
    const embed = new google.maps.Map(document.getElementById('map'),
        {
            zoom: 12,
            center: userlocation,
            mapId: "7d132bec7a563178eaf5cb41"

        });

    new google.maps.marker.AdvancedMarkerElement({
        position: userlocation,
        map: embed,
        title: "You are here",

    });

    const storageCard = new InfoBubble({
        minWidth: 160,
        minHeight: 75,
        shadowStyle: 1,
        padding: 10,
        borderRadius: 10,
        arrowSize: 10,
        borderWidth: 1,
        borderColor: '#96aac4',
        backgroundColor: '#ceddf1',
        disableAutoPan: true,
        hideCloseButton: true,
        arrowPosition: 50,
        backgroundClassName: 'infobubble-background',
        arrowStyle: 0,
    });

    const result = await fetch('/api/fridgePoint');
    const points = await result.json();
    console.log(points);

    points.forEach(point => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: point.lat, lng: point.lon },
            map: embed,
            title: point.name || "Fridge"
        });

        marker.addEventListener('click', () => {
            console.log(point.name)
            storageCard.setContent(`<div class="storageCard">
            <strong>${point.name}</strong>
            <a href=https://www.google.com/maps?q=${point.lat},${point.lon}> Directions </a>
            </div>
`);
            storageCard.setPosition(marker.position);
            storageCard.open(embed);
        })

    });

}



document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleMap");
    const mapContainer = document.getElementById("mapContainer");

    toggleBtn.addEventListener("click", () => {
        const isHidden = mapContainer.style.display === "none";
        mapContainer.style.display = isHidden ? "block" : "none";

        if (isHidden && !mapexist) {
            makeMap();
            mapexist = true;
        }
    });
});