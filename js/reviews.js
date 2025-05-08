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


//isabel


document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/reviews")
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("reviews-container");
        if (!data.length) {
          container.innerHTML = "<p>No reviews yet.</p>";
          return;
        }
        data.forEach(review => {
          const div = document.createElement("div");
          div.className = "review";
          div.innerHTML = `
            <div class="review-header">
              <div class="review-header-left">
                <img class="review-header-avatar" src="/img/avatar.jpeg" alt="profile picture" />
                <div>
                  <div class="review-header-username">${review.username}</div>
                  <div class="review-header-date">${new Date(review.createdat).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <div class="review-title">${review.title}</div>
            <div class="review-rating">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
            <div class="review-body">
              ${review.photo ? `<img class="review-image" src="${review.photo}" alt="Review photo" />` : ""}
              <div class="review-text">${review.body}</div>
            </div>
            <span class="read-more" style="display: none">...read more</span>
          `;
          container.appendChild(div);
        });
      })
      .catch(err => {
        console.error("Failed to load reviews", err);
        document.getElementById("reviews-container").innerHTML = "<p>Error loading reviews.</p>";
      });
  });

// document.addEventListener("DOMContentLoaded", () => {
//     const form = document.getElementById("reviewForm");

//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         const formData = new FormData(form);
//         const review = {
//             storageId: parseInt(formData.get("storageId")),
//             title: formData.get("title"),
//             body: formData.get("body"),
//             rating: parseInt(formData.get("rating")),
//             userId: 1, // TEMP hardcoded; make dynamic based on logged-in user
//         };

//         try {
//             const res = await fetch("/submit-review", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(review)
//             });

//             if (res.ok) {
//                 alert("Review submitted!");
//                 form.reset();
//                 loadReviews();
//             } else {
//                 alert("Failed to submit review.");
//             }
//         } catch (err) {
//             console.error(err);
//         }
//     });

//     loadReviews();
// });

// async function loadReviews() {
//     try {
//         const res = await fetch("/api/reviews");
//         const reviews = await res.json();
//         const container = document.getElementById("reviews-container");
//         container.innerHTML = "";

//         reviews.forEach((review) => {
//             const reviewEl = document.createElement("div");
//             reviewEl.className = "review";
//             reviewEl.innerHTML = `
//                 <div class="review-header">
//                     <div class="review-header-left">
//                         <img class="review-header-avatar" src="/img/avatar.jpeg" />
//                         <div>
//                             <div class="review-header-username">${review.username}</div>
//                             <div class="review-header-date">${new Date(review.createdAt).toLocaleDateString()}</div>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="review-title">${review.title}</div>
//                 <div class="review-rating">${renderStars(review.rating)}</div>
//                 <div class="review-body">
//                     ${review.photo ? `<img src="${review.photo}" class="review-image" />` : ""}
//                     <div class="review-text">${review.body}</div>
//                 </div>
//             `;
//             container.appendChild(reviewEl);
//         });
//     } catch (err) {
//         console.error("Failed to load reviews:", err);
//     }
// }

function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) =>
        `<span class="star material-icons ${i < rating ? '' : 'unfilled'}">star</span>`
    ).join("");
}

app.post('/submit-review', upload.single('photo'), async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send('Not logged in');
  
    const { title, body, rating, storageId } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
  
    try {
      await client.query(`
        INSERT INTO reviews (userId, storageId, title, body, rating, photo, createdAt)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [userId, storageId, title, body, rating, photo]);
      res.redirect('/reviews');
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving review");
    }
  });
  
  // GET REVIEWS
 
  

// const review = {
//     userId: 1, // Hardcoded for now; replace with actual session-based ID
//     storageId: 7, // Replace with actual storage ID the review is for
//     title: form.title.value,
//     body: form.comment.value,
//     rating: parseInt(form.rating.value),
//     photo: form.image_url.value || null
// };

// document.getElementById("reviewForm").addEventListener("submit", async (e) => {
//     e.preventDefault();
//     const form = e.target;

//     const review = {
//         storageId: form.storageId.value,
//         title: form.title.value,
//         body: form.comment.value,
//         rating: parseInt(form.rating.value),
//         photo: form.image_url.value || null
//     };

//     try {
//         const res = await fetch("/submit-review", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(review)
//         });

//         if (res.ok) {
//             alert("Review submitted!");
//             location.reload();
//         } else {
//             alert("Failed to submit review.");
//         }
//     } catch (err) {
//         console.error("Error submitting review:", err);
//     }
// });


// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;
//     const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
//     const user = result.rows[0];

//     if (user && await bcrypt.compare(password, user.password)) {
//         req.session.userId = user.userid;  // store userId in session
//         res.redirect('/reviews');
//     } else {
//         res.status(401).send('Invalid credentials');
//     }
// });

// app.post('/submit-review', async (req, res) => {
//     const userId = req.session.userId;
//     if (!userId) return res.status(401).send('Not logged in');

//     const { title, body, rating, storageId } = req.body;
//     const createdAt = new Date().toISOString();

//     try {
//         await client.query(`
//             INSERT INTO reviews (userId, storageId, rating, title, body, createdAt)
//             VALUES ($1, $2, $3, $4, $5, $6)
//         `, [userId, storageId, rating, title, body, createdAt]);

//         res.redirect('/reviews');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Error saving review");
//     }
// });


// app.get("/api/reviews", async (req, res) => {
//     try {
//         const result = await client.query(`
//             SELECT "reviewId", "userId", "storageId", "rating", "title", "body", "photo", "createdAt"
//             FROM reviews
//             WHERE "deletedDate" IS NULL
//             ORDER BY "createdAt" DESC
//         `);
//         res.json(result.rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Failed to fetch reviews" });
//     }
// });


// app.post("/api/reviews", async (req, res) => {
//     const { userId, storageId, title, body, rating, photo } = req.body;

//     if (!userId || !storageId || !title || !body || !rating) {
//         return res.status(400).json({ error: "Missing required fields" });
//     }

//     try {
//         await client.query(
//             `INSERT INTO reviews ("userId", "storageId", "title", "body", "rating", "photo", "createdAt")
//              VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
//             [userId, storageId, title, body, rating, photo || null]
//         );
//         res.status(201).json({ message: "Review submitted successfully" });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Database insert failed" });
//     }
// });

// document.addEventListener("DOMContentLoaded", () => {
//     fetch("/api/reviews")
//         .then(res => res.json())
//         .then(data => {
//             const container = document.getElementById("reviews-container");
//             if (!data.length) {
//                 container.innerHTML = "<p>No reviews yet.</p>";
//                 return;
//             }

//             data.forEach(review => {
//                 const div = document.createElement("div");
//                 div.className = "review";
//                 div.innerHTML = `
//                     <div class="review-header">
//                         <div class="review-header-left">
//                             <img class="review-header-avatar" src="/img/avatar.jpeg" alt="profile picture" />
//                             <div>
//                                 <div class="review-header-username">${review.username || "Anonymous"}</div>
//                                 <div class="review-header-date">${new Date(review.createdat).toLocaleDateString()}</div>
//                             </div>
//                         </div>
//                         <div class="review-header-right">
//                             <span class="review-action">report</span>
//                         </div>
//                     </div>
//                     <div class="review-title">${review.title}</div>
//                     <div class="review-rating">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
//                     <div class="review-body">
//                         ${review.photo ? `<img class="review-image" src="${review.photo}" alt="Review photo" />` : ""}
//                         <div class="review-text">${review.body}</div>
//                     </div>
//                 `;
//                 container.appendChild(div);
//             });
//         })
//         .catch(err => {
//             console.error("Failed to load reviews", err);
//             document.getElementById("reviews-container").innerHTML = "<p>Error loading reviews.</p>";
//         });
// });


// // document.addEventListener("DOMContentLoaded", () => {
// //     fetch("/api/reviews")
// //         .then(res => res.json())
// //         .then(data => {
// //             const container = document.getElementById("reviews-container");
// //             data.forEach(review => {
// //                 const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
// //                 const reviewEl = document.createElement("div");
// //                 reviewEl.classList.add("review");
// //                 reviewEl.innerHTML = `
// //                     <div class="review-header">
// //                         <div class="review-header-left">
// //                             <img class="review-header-avatar" src="/img/avatar.jpeg" alt="profile picture" />
// //                             <div>
// //                                 <div class="review-header-username">${review.username}</div>
// //                                 <div class="review-header-date">${new Date(review.review_date).toLocaleDateString()}</div>
// //                             </div>
// //                         </div>
// //                         <div class="review-header-right">
// //                             <span class="review-action">report</span>
// //                         </div>
// //                     </div>
// //                     <div class="review-title">${review.title}</div>
// //                     <div class="review-rating">${stars}</div>
// //                     <div class="review-body">
// //                         ${review.image_url ? `<img src="${review.image_url}" alt="Review image" class="review-image" />` : ''}
// //                         <div class="review-text">${review.comment}</div>
// //                     </div>
// //                     <span class="read-more" style="display: none">...read more</span>
// //                 `;
// //                 container.appendChild(reviewEl);
// //             });
// //         })
// //         .catch(err => {
// //             console.error("Failed to load reviews", err);
// //         });
// // });

// app.get("/api/reviews", async (req, res) => {
//     try {
//         const result = await client.query(`
//             SELECT r.*, u.username
//             FROM reviews r
//             JOIN users u ON r.userId = u.userId
//             WHERE r.deletedDate IS NULL
//             ORDER BY r.createdAt DESC
//         `);
//         res.json(result.rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Failed to fetch reviews");
//     }
// });

// document.addEventListener("DOMContentLoaded", () => {
//     const form = document.getElementById("reviewForm");

//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         const formData = new FormData(form);
//         const review = {
//             storageId: formData.get("storageId"),
//             title: formData.get("title"),
//             body: formData.get("body"),
//             rating: parseInt(formData.get("rating")),
//             photo: null // Optional: you could add image upload logic later
//         };

//         try {
//             const res = await fetch("/submit-review", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(review)
//             });

//             if (res.ok) {
//                 alert("Review submitted!");
//                 form.reset();
//                 loadReviews(); // Reload reviews
//             } else {
//                 alert("Error submitting review");
//             }
//         } catch (err) {
//             console.error("Submission failed:", err);
//         }
//     });

//     loadReviews(); // Load existing reviews on page load
// });

// async function loadReviews() {
//     try {
//         const res = await fetch("/api/reviews");
//         const reviews = await res.json();
//         const container = document.getElementById("reviews-container");
//         container.innerHTML = "";

//         reviews.forEach((review) => {
//             const reviewEl = document.createElement("div");
//             reviewEl.className = "review";
//             reviewEl.innerHTML = `
//                 <div class="review-header">
//                     <div class="review-header-left">
//                         <img class="review-header-avatar" src="/img/avatar.jpeg" />
//                         <div>
//                             <div class="review-header-username">${review.username}</div>
//                             <div class="review-header-date">${new Date(review.createdAt).toISOString().split("T")[0]}</div>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="review-title">${review.title}</div>
//                 <div class="review-rating">
//                     ${renderStars(review.rating)}
//                 </div>
//                 <div class="review-body">
//                     ${review.photo ? `<img src="${review.photo}" class="review-image" />` : ""}
//                     <div class="review-text">${review.body}</div>
//                 </div>
//             `;
//             container.appendChild(reviewEl);
//         });
//     } catch (err) {
//         console.error("Failed to load reviews:", err);
//     }
// }

// function renderStars(rating) {
//     return Array.from({ length: 5 }, (_, i) =>
//         `<span class="star material-icons ${i < rating ? "" : "unfilled"}">star</span>`
//     ).join("");
// }


// app.get('/reviews', async (req, res) => {
//     try {
//       const result = await pool.query('SELECT * FROM reviews');
//       res.render('reviews', { reviews: result.rows });
//     } catch (err) {
//       console.error(err);
//       res.send("Error retrieving reviews");
//     }
//   });

//   app.post("/reviews", async (req, res) => {
//     const { username, title, comment, rating, image_url } = req.body;
//     try {
//         await client.query(
//             'INSERT INTO reviews (username, title, comment, rating, image_url, review_date) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)',
//             [username, title, comment, parseInt(rating), image_url || null]
//         );
//         res.redirect('/reviews');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Error saving review");
//     }
//   });