const menuButton = document.querySelector("#header-menu-button");
menuButton.addEventListener("click", (event) => {
    let menu = event.target.nextElementSibling;
    if(menu.style.maxHeight){
        menu.style.maxHeight = null;
    }
    else{
        menu.style.maxHeight = menu.scrollHeight + "px";
    }
});