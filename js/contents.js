const itemsToDonate = [];
const storageId = window.location.pathname.split("/")[2];

async function getRows() {
    let rows = await fetch(`/api/contents/${storageId}`);
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

    let donateItem = { "storageId": storageId, "itemName": name.value, "quantity": qty.value, "bbd": bbd.value };
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

var qtyList = [];

function takeMode() {
    let elements = document.getElementsByClassName("item-quantity");
    let quantities = Array.from(elements);
    quantities.forEach(qty => {
        let itemId = qty.dataset["contentid"];
        let itemQty = qty.dataset["qty"];
        qtyList.push({id : parseInt(itemId), qty : parseInt(itemQty)});
        qty.innerHTML = `<input type="number" class="input-values" id="qty" value="0" min="0" data-itemid=${itemId} data-qty=${itemQty} max=${itemQty} /><span id="maxValue">/${itemQty}</span>`;
    });
    console.log(qtyList);
    document.getElementById("open-modal").classList.add('hidden');
    document.getElementById("take").classList.add('hidden');
    document.getElementById("take-cancel").classList.remove('hidden');
    document.getElementById("take-confirm").classList.remove('hidden');
};

function cancelTake() {
    let elements = document.getElementsByClassName("item-quantity");
    let quantities = Array.from(elements);
    for (let i = 0; i < quantities.length; i++) {
        quantities[i].innerHTML = qtyList[i].qty;
    }
    document.getElementById("open-modal").classList.remove('hidden');
    document.getElementById("take").classList.remove('hidden');
    document.getElementById("take-cancel").classList.add('hidden');
    document.getElementById("take-confirm").classList.add('hidden');
}

async function confirmTake() {

    qtyList.forEach(item => {
        let subQty = parseInt(document.querySelector(`[data-itemid~="${item.id}"]`).value);
        let newQty = (item.qty - subQty);
        item["qty"] = newQty;
    })

    const response = await fetch('/api/take', {
        method: "POST",
        headers : {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify(qtyList)
    })
    
    console.log(response);
}