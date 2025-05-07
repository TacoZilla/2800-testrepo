registerEventListeners();

function registerEventListeners() {
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
    document.addEventListener("DOMContentLoaded", updateReadMoreButton);
    window.addEventListener("resize", updateReadMoreButton);
}

function expandReview(element) {
    const body = element.previousElementSibling;
    if (body) {
        if (body.classList.contains("expanded")) {
            element.innerHTML = "...read more";
        } else {
            element.innerHTML = "read less";
        }
        body.classList.toggle("expanded");
    }
}

function expandImage(element) {
    if (element.classList.contains("expanded")) {
        element.parentElement.querySelector(".review-body").prepend(element);
    } else {
        element.parentElement.parentElement.insertBefore(element, element.parentElement);
    }
    element.classList.toggle("expanded");
}

function updateReadMoreButton() {
    document.querySelectorAll(".review-body").forEach((body) => {
        const readMore = body.nextElementSibling;
        // Check if the review body has overflow.
        if (body.scrollHeight > body.clientHeight) {
            readMore.style.display = "block";
        } else {
            readMore.style.display = "none";
        }
    });
}
