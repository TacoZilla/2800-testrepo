

function expandReviews() {

    let revsec = document.getElementById("myreviews");
    let button = document.getElementById("expandrev")

    //this will be more sophisticated once we get 
    //the reviews in here, because I'll make it account
    //for the height of the reviews included.
    if (parseInt(revsec.style.height) < 400) {
        revsec.style.height = "1000px";

    } else {
        revsec.style.height = "350px";

    }

}

function togglePasswordFields() {
    const container = document.getElementById("change-password-container");
    container.style.display = container.style.display === "none" ? "block" : "none";
    // const fieldpassword = ['oldPassword', 'newPassword'];
    // for(let pass of fieldpassword){
    //     pass.disabled =!pass.disabled
    // };
}
function toggleProfileEdit() {
    const fieldIds = ['firstName', 'lastName', 'email'];

    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.disabled = !field.disabled;
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('submit').addEventListener('click', async () => {
        //e.preventDefault();
        //const form = e.target;

        let newPassword = document.getElementById('newPassword').value;
        let oldPassword = document.getElementById('oldPassword').value;

        const data = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            notifications: document.getElementById('notifications').checked
        };

        if (oldPassword && newPassword) {
            data.oldPassword = oldPassword;
            data.newPassword = newPassword;
        }

        // const formData = new FormData();
        // formData.append("firstName", document.getElementById('firstName').value.trim());
        // formData.append("lastName", document.getElementById('lastName').value.trim());
        // formData.append("email", document.getElementById('email').value.trim());

        // formData.append("notifications", document.getElementById('notifications').checked ? "true" : "false")
        // if (oldPassword && newPassword) {
        //     formData.append("oldPassword", oldPassword);
        //     formData.append("newPassword", newPassword);
        // }
        // console.log('FormData contents:');
        // for (const [key, value] of formData.entries()) {
        //     console.log(`${key}: ${value}`);
        // }

        try {
            const response = await fetch(`/update-profile`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            alert(result.message);
        } catch (err) {
            console.error("Error submitting form:", err);
            alert("Submission failed.");
        }
    });
});

async function getStorageCards(){
     const response = await fetch(`/ownedstorage`);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    return json;

}

async function getReviewCards(){
     const response = await fetch(`/ownedReview`);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    return json;

}


async function loadStorageCards() {
    //const heroContainer = document.querySelector("#hero-card-container");
    const mainContainer = document.querySelector("#storage-card-container");
    const cards = await getStorageCards();
    if (cards.length > 0) {
        
        for (let card of cards) {
            mainContainer.innerHTML += card;
        }
    }
    else {
        console.log("No storages to show.");
    }
}

async function loadReviewCards() {
    //const heroContainer = document.querySelector("#hero-card-container");
    const mainContainer = document.querySelector("#review-card-container");
    const cards = await getReviewCards();
    if (cards.length > 0) {
        
        for (let card of cards) {
            mainContainer.innerHTML += card;
        }
    }
    else {
        mainContainer.innerHTML = 'No review to show'
        console.log("No review to show.");
    }
}

loadStorageCards();
loadReviewCards();

