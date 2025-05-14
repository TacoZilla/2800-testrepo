
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

// Helper functions
function getStorageIdFromURL() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

function initializeReviewSubmission() {
    document.getElementById("submit").addEventListener("click", async (e) => {
        e.preventDefault();
        await submitReview();
    });
}

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
    initializeReviewSubmission();
    getReviews();
    registerEventListeners();
});

// Helper functions
function getStorageIdFromURL() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

function initializeReviewSubmission() {
    document.getElementById("submit").addEventListener("click", async (e) => {
        e.preventDefault();
        await submitReview();
    });
}

// Review functions
async function submitReview() {
    const storageId = window.location.pathname.split("/")[2];
    const review = {
        title: document.getElementById("reviewTitle").value.trim(),
        body: document.getElementById("reviewText").value.trim(),
        rating: parseInt(document.getElementById("reviewRating").value.trim(), 10),
    };

    // if (!validateReview(review)) return;

    try {
        console.log(storageId);
        const res = await fetch(`/reviews/${storageId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(review),
        });

        if (res.ok) {
            alert("Review submitted!");
            resetReviewForm();
            await getReviews();
        } else {
            alert("Failed to submit review. Please try again");
        }}
        catch (err) {
            console.log(err);
        }}

async function getReviews() {
    try {
        const storageId = window.location.pathname.split("/")[2];
        const response = await fetch(`/api/reviews/${storageId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reviews = await response.text();
        document.getElementById('reviews-container').innerHTML = reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        // You might want to display an error message to the user here
        document.getElementById('reviews-container').innerHTML =                               
            '<p>Error loading reviews. Please try again later.</p>';
    }
}

//replies
function registerEventListeners() {

    document.addEventListener("click", (event) => {
        
        const executeOnMatch = (selector, callback) => {
            if (event.target.matches(selector)) {
                callback(event.target);
            }
        };

        executeOnMatch(".read-more", expandReview);
        executeOnMatch(".review-image", expandImage);
        executeOnMatch(".reply-button", toggleReplyForm);
        executeOnMatch(".submit-reply", submitReply);
    });

    document.addEventListener("DOMContentLoaded", updateReadMoreButton);
    window.addEventListener("resize", updateReadMoreButton);
}

function toggleReplyForm(button) {
    const form = button.nextElementSibling;
    form.style.display = form.style.display == "none" ? "block" : "none";
}

async function submitReply(button) {
    const reviewDiv = button.closest(".review");
    const reviewId = reviewDiv.dataset.reviewId;
    const textarea = reviewDiv.querySelector(".reply-text");
    const replyText = textarea.value.trim();

    if (!replyText) {
        alert("Reply cannot be empty.");
        return;
    }
    try {
        const res = await fetch(`/replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewId: parseInt(reviewId, 10), reply: replyText, storageId: getStorageIdFromURL() }),
        });

        if (res.ok) {
            // const newReplyHTML = await res.text();
            // console.log(newReplyHTML);
            // reviewDiv.querySelector(".replies").insertAdjacentHTML("beforeend", newReplyHTML);
            // textarea.value = "";
            reviewDiv.querySelector(".reply-form-container").style.display = "none";
            location.reload();
        } else {
            alert("Failed to submit reply.");
        }
    } catch (err) {
        console.error(err);
    }};
