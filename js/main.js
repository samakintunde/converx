window.addEventListener("load", () => {
  // Load currencies to select tag
  loadCurrency();
});
// INITIALIZE VARIABLES
// idb config
const BASE_URL = "https://free.currencyconverterapi.com/api/v5";
const DB_NAME = "converx";
const DB_VERSION = 1;

// Getting input nodes
const inputFrom = document.getElementById("convert-from");
const inputTo = document.getElementById("convert-to");
const selectFrom = document.getElementById("select-from");
const selectTo = document.getElementById("select-to");
const error = document.getElementById("error");

// Setting focus to input
inputFrom.focus();

// INITIALIZE IndexedDB
function openDb() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open(DB_NAME, DB_VERSION, upgradeDb => {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore("rates");
        upgradeDb.createObjectStore("currencies");
        // upgradeDb.createObjectStore("favorites"); (Feature to be added later)
        break;
    }
  });
}

let dbPromise = openDb();

// INITIALIZE SERVICE WORKER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

// GET CURRENCY DATA
const currency = [];

function displayCurrency(currency) {
  currency.sort().forEach(id => {
    let currencyOption = document.createElement("option");
    currencyOption.setAttribute("value", id);
    currencyOption.innerText = id;
    // Duplicate the options to use in the two selects
    let currencyOptionClone = currencyOption.cloneNode(true);
    selectFrom.appendChild(currencyOption);
    selectTo.appendChild(currencyOptionClone);
  });
}

// LOAD CURRENCIES TO SELECT ON PAGE LOAD
function loadCurrency() {
  dbPromise.then(db => {
    let tx = db.transaction("currencies");
    let store = tx.objectStore("currencies");
    store.get("currency").then(result => {
      // console.log(result);
      // Check if the currencies store is in DB
      if (typeof result === "undefined") {
        fetch(`${BASE_URL}/currencies`)
          .then(res => res.json())
          .then(json => {
            for (let id in json.results) {
              if (!currency.includes(id)) currency.push(id);
            }
            return currency;
          })
          .then(currency => {
            dbPromise.then(db => {
              let tx = db.transaction("currencies", "readwrite");
              let store = tx.objectStore("currencies");
              store.put(currency, "currency");
              displayCurrency(currency);
              return tx.complete;
            });
          })
          .catch(err => {
            if (err) console.error(err);
          });
      }
      displayCurrency(result);
    });
  });
}

inputFrom.addEventListener("input", () => {
  // Clear the converted currency while editing
  if (inputFrom.innerText === "" || !inputFrom.innerText) {
    inputTo.innerHTML = null;
    return;
  }

  // Clear error while editing
  if (error.innerHTML) {
    error.innerHTML = null;
    error.style.display = "none";
  }
});

selectFrom.addEventListener("input", () => {
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text;
  let unit = document.getElementById("fromUnit");
  unit.innerText = selectFromVal;
});

selectTo.addEventListener("input", () => {
  let selectFromVal = selectTo.options[selectTo.selectedIndex].text;
  let unit = document.getElementById("toUnit");
  unit.innerText = selectFromVal;
});

// Getting Exchange rate
function getConversion() {
  // Getting select nodes(dropdown)
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text;
  let selectToVal = selectTo.options[selectTo.selectedIndex].text;

  let query = `${selectFromVal}_${selectToVal}`;

  if (!inputFrom.value) {
    error.innerHTML =
      '<i class="fas fa-exclamation-circle"></i>Please, input number';
    error.style.display = "block";
    return;
  }

  dbPromise.then(db => {
    let tx = db.transaction("rates", "readwrite");
    let store = tx.objectStore("rates");
    if (selectFromVal === selectToVal) {
      inputTo.innerText = 1 * inputFrom.value;
      return;
    }
    store.get(query).then(rate => {
      // Check if rate exists in the store and use it
      if (rate) {
        inputTo.innerText = rate * inputFrom.value;
        return;
      }
      // Fetch if the rate isn't available
      fetch(`${BASE_URL}/convert?q=${selectFromVal}_${selectToVal}`)
        .then(res => res.json())
        .then(json => {
          rate = json.results[`${selectFromVal}_${selectToVal}`].val;
          inputTo.innerText = rate * inputFrom.value;
          return rate;
        })
        // Adding rates to IndexeDB
        .then(rate => {
          dbPromise
            .then(db => {
              let tx = db.transaction("rates", "readwrite");
              let store = tx.objectStore("rates");
              store.put(rate, `${selectFromVal}_${selectToVal}`);
              return tx.complete;
            })
            .then(result => console.log("done"));
        });
    });
  });
}

const convertBtn = document.getElementById("convert");

convertBtn.addEventListener("click", getConversion);
