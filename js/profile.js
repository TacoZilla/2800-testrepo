

function expandReviews() { 

let revsec = document.getElementById("myreviews");
let button = document.getElementById("expandrev")

//this will be more sophisticated once we get 
//the reviews in here, because I'll make it account
//for the height of the reviews included.
if (parseInt(revsec.style.height) < 200) {
    revsec.style.height = "1000px"; 

} else {
    revsec.style.height = "175px";

}
}