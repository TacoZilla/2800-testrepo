initialize();

async function initialize(){
    const heroContainer = document.querySelector("#hero-card-container");
    const mainContainer = document.querySelector("#main-card-container");
    const cards = await getCards();
    console.log(cards);
    if(cards.length > 0){
        let hero = selectHero(cards);
        heroContainer.innerHTML = hero;
        heroContainer.firstChild.classList.add("hero");

        //TODO: show hero.
        for(let card of cards){
            mainContainer.innerHTML += card;
        }
    }
    else{
        //TODO: we need a "nothing to show" message to appear on browse
        console.log("No fridges to show.")
    }

}

async function getCards() {
    const response = await fetch("/api/browse");
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    return json;
}

//Selects a store to show in the hero section of the page. 
//removes it from the stores array and returns it. 
function selectHero(stores){
    //TODO: this should use favourites and distance to select a hero
    if(stores.length > 0){
        let hero = stores[0];
        stores.splice(0, 1);
        return hero;
    }
    return null;
}