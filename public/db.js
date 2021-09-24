let db;
let budgetVersion;

const request = indexedDB.open("budget", budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log("IndexDB outdated!");

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`Updated DB from version ${oldVersion} to ${newVersion}`);

    db = e.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onerror = function (e) {
  console.log(`An error occurred. Error Code: ${e.target.errorCode}`);
};

function checkDatabase() {
  let transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function () {

    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {

          if (res.length !== 0) {
            transaction = db.transaction(["pending"], "readwrite");

            const currentStore = transaction.objectStore("pending");

            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  db = e.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

const saveRecord = (record) => {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
};

window.addEventListener("online", checkDatabase);