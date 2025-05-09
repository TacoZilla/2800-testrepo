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

// add review modal scripts
function openModal() {
    document.getElementById("reviewModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("reviewModal").style.display = "none";
}
//isabel

function saveReviewData(userId, storageId) {
    const title = document.getElementById("reviewTitle");
    const body = document.getElementById("reviewText");
    const rating = document.getElementById("reviewStars");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("submit").addEventListener("click", async (e) => {
        e.preventDefault();

        const review = {
            title: document.getElementById("reviewTitle").value.trim(),
            body: document.getElementById("reviewText").value.trim(),
            rating: parseInt(document.getElementById("reviewRating").value.trim(), 10),
        };
        console.log(review.body);
        try {
            const res = await fetch(`/reviews?storageId=1`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(review),
            });
            if (res.ok) {
                alert("Review submitted!");
                //loadReviews();
            } else {
                alert("Failed to submit review.");
            }
        } catch (err) {
            console.error(err);
        }
    });
    // loadReviews();
});

getReviews();
async function getReviews() {
    let response = await fetch("api/reviews");
    let reviews = await response.text(); 
    document.getElementById('reviews-container').innerHTML = reviews;
}
