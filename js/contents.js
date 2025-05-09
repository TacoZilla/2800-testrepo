async function getRows() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const storageId = urlParams.get('ID');
    let rows = await fetch(`/api/contents?ID=${storageId}`);
    return rows.json();
}

async function loadRows() {
    let table = document.getElementById("content-rows");
    let rows = await getRows();
    if (rows.length > 0) {
        for (let row of rows) {
            let rowHTML = document.createElement('tr');
            rowHTML.innerHTML = row.trim();
            table.appendChild(rowHTML);
        }
    } else {
        console.log("fridge is empty");
    }
} loadRows();

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
    let qty = document.getElementById('qty');
    let name = document.getElementById('itemName');
    let bbd = document.getElementById('bbd');
    name.value = "";
    qty.value = "0";
    bbd.value = "";
    while (2 <= list.rows.length) {
        list.deleteRow(1);
    }
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

    let donateItem = {"storageId": storageId, "itemName": name.value, "quantity": qty.value, "bbd": bbd.value};
    itemsToDonate.push(donateItem);

    const list = document.getElementById('donationList');
    let itemName = document.createElement('td');
    let itemQty = document.createElement('td');
    let itemBBD = document.createElement('td');
    itemName.textContent = name.value;
    itemQty.textContent = qty.value;
    itemBBD.textContent = bbd.value;
    name.value = "";
    qty.value = "0";
    bbd.value = "";
    let item = document.createElement('tr');
    item.appendChild(itemName);
    item.appendChild(itemQty);
    item.appendChild(itemBBD);
    list.appendChild(item);
});

document.querySelector('#donate-btn').addEventListener('click', function (e) {

    let items = JSON.stringify(itemsToDonate);

    ajaxPOST(`/api/donate?ID=${storageId}`, function (data) {
        if (data) {
            let parsedData = JSON.parse(data);
            if (parsedData.status == "fail") {
                alert(parsedData.msg);
            } else {
                let table = document.getElementById('content-rows');
                while (2 <= table.rows.length) {
                    table.deleteRow(1);
                }
                loadRows();
                resetValues();
                document.getElementById('contentsmodal').style.display = 'none';
            }
        }
    }, items)
});

