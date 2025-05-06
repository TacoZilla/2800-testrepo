document.addEventListener("click", (event) => {
    const executeOnMatch = (selector, callback) => {
        if (event.target.matches(selector)) {
            if (typeof callback === "function") {
                callback(event.target);
            }
        }
    };
    executeOnMatch(".read-more", expandReview);
    executeOnMatch(".review-image", expandImage);
});

function toggleExpanded(element) {
    console.log(element);
    element.classList.toggle("expanded");
}

function expandReview(element) {
    const body = element.previousElementSibling;
    if (body) {
        if (body.classList.contains("expanded")) {
            element.innerHTML = "...read more";
        } else {
            element.innerHTML = "read less";
        }
        toggleExpanded(body);
    }
}

function expandImage(element) {
    if (element.classList.contains("expanded")) {
        element.parentElement.querySelector(".review-body").prepend(element);
    } else {
        element.parentElement.parentElement.insertBefore(element, element.parentElement);
    }
    toggleExpanded(element);
}
