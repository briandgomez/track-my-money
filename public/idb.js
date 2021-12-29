let db;

//Connect & create database 'budget_db'version 1
const request = indexedDB.open('budget_db', 1);

//Event listener to update the data if there is a change of the database
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    //Store 'new_transaction' table in database
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

//If connection to the database is successful, save the object to 'db'
request.onsuccess = function (event) {
    db = event.target.result;
    //If app is online run uplaodTransaction function
    if (navigator.onLine) {
        uploadTransaction();
    }
};

//If connection to database is unsuccessful log the error
request.onerror = function (event) {
    console.log(event.target.errorCode)
};

function saveRecord(record) {
    //Open a new transaction using the 'budget_db' table with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    //Access 'new_transaction' object store
    const transactionObjectStore = transaction.objectStore('new_transaction');
    //Add record to table
    transactionObjectStore.add(record);
};

//Function to upload saved data
function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    //Retrieve all information from object store
    const allStoreData = transactionObjectStore.getAll();

    //If 'allStoreData' is retrieved successfully run this function
    allStoreData.onsuccess = function () {
        // if data exists in indexedDb's store send it to api server
        if (allStoreData.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(allStoreData.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('new_transaction');
                    transactionObjectStore.clear();

                    alert('Transactions successfully uploaded')
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

//Listen for app to come back online
window.addEventListener('online', uploadTransaction);