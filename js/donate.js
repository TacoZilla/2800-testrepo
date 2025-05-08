function ajaxPOST(url, callback, data) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            callback(this.responseText);
        } else {
            console.log(this.status);
        }
    }
    xhr.open("POST", url);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(data);
}

const itemsToDonate = [];
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const storageId = urlParams.get('ID');

document.querySelector('#open-modal').addEventListener('click', function (e) {
    document.getElementById('contentsmodal').style.display = 'flex';
});

function resetValues() {
    let list = document.getElementById('donationList');
    let name = document.getElementById('itemName');
    let qty = document.getElementById('qty');
    let bbd = document.getElementById('bbd');
    name.value = "";
    qty.value = "0";
    bbd.value = "";
    list.innerHTML = "";
    itemsToDonate.length = 0;
}

document.querySelector('#modal-cancel').addEventListener('click', function (e) {
    resetValues();
    document.getElementById('contentsmodal').style.display = 'none';
});

document.querySelector('#close-modal').addEventListener('click', function (e) {
    resetValues();
    document.getElementById('contentsmodal').style.display = 'none';
});

document.querySelector('#addItem').addEventListener('click', function (e) {
    let name = document.getElementById('itemName');
    let qty = document.getElementById('qty');
    let bbd = document.getElementById('bbd');
    let data = "Item: " + name.value + " Qty: " + qty.value + " BBD: " + bbd.value;

    let donateItem = {"storageId": storageId, "itemName": name.value, "quantity": qty.value, "bbd": bbd.value};
    itemsToDonate.push(donateItem);

    const list = document.getElementById('donationList');
    let item = document.createElement('li');
    item.textContent = data;
    list.appendChild(item);
    console.log(itemsToDonate);
});

document.querySelector('#donate-btn').addEventListener('click', function (e) {

    let items = JSON.stringify(itemsToDonate);

    ajaxPOST(`/api/donate?ID=${storageId}`, function (data) {
        if (data) {
            let parsedData = JSON.parse(data);
            if (parsedData.status == "fail") {
                alert(parsedData.msg);
            } else {
                alert(parsedData.msg);
            }
        }
    }, items)
});

