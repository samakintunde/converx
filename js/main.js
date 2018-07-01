window.addEventListener("load", () => {
  // Load currencies to select tag
  loadCurrency();
  // Display favorites on page load
  displayFavorite();
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

console.log(inputFrom.value);

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
        upgradeDb.createObjectStore("favorites");
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
      // Check if the currencies store is in DB
      if (result) {
        fetch(`${BASE_URL}/currencies`)
          .then(res => res.json())
          .then(json => {
            for (let id in json.results) {
              if (!currency.includes(id)) currency.push(id);
            }
            return currency;
          })
          .then(currency => displayCurrency(result))
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
  if (inputFrom.innerText === "") {
    inputTo.innerHTML = null;
    return;
  }

  // Clear error while editing
  if (error.innerHTML) {
    error.innerHTML = null;
    error.style.display = "none";
  }
});

function setUnit() {
  let value = select.options[select.selectedIndex].text;
  console.log(value);
  let id = document.getElementById(id);
  console.log(id);
  unit.innerText = value;
}

selectFrom.addEventListener("input", () => {
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text;
  unit.innerText = value;
});

selectTo.addEventListener("input", () => {
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text;
  unit.innerText = value;
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
    console.log(store.get(query));
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

// CRUD favorites
const favoriteBtn = document.getElementById("favorite-btn");
const favoritesNode = document.getElementById("favorites-box");

// DISPLAY FAVORITE
function displayFavorite(newFavText) {
  dbPromise
    .then(db => {
      let tx = db.transaction("favorites");
      let store = tx.objectStore("favorites");
      return store.openCursor();
    })
    .then(function renderFavorite(cursor) {
      if (!cursor) return;
      let fav = document.createElement("div");
      fav.style.cursor = "pointer";
      fav.innerHTML = `<div class="favorite-item">${cursor.value}</div>`;
      favoritesNode.appendChild(fav);

      return cursor.continue().then(renderFavorite);
    });
}

// ADD FAVORITE
function addFavorite() {
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text;
  let selectToVal = selectTo.options[selectTo.selectedIndex].text;
  let newFavText = `${selectFromVal} to ${selectToVal}`;

  dbPromise
    .then(db => {
      let tx = db.transaction("favorites", "readwrite");
      let store = tx.objectStore("favorites");
      store.put(newFavText, newFavText);
      return tx.complete;
    })
    .then(result => {
      displayFavorite(newFavText);
    });
}

// DELETE FAVORITE
function deleteFavorite() {
  console.log("clicked");
  dbPromise
    .then(db => {
      let tx = db.transaction("favorites", "readwrite");
      let store = tx.objectStore("favorites");
      return store.openCursor();
    })
    .then(function renderFavorite(cursor) {
      if (!cursor) return;
      if (cursor.value === favoriteItem.innerText) {
        cursor.delete();
        return;
      }
      return cursor.continue().then(renderFavorite);
    })
    .then(displayFavorite());
}

// Load favorite to replace select when clicked
function loadFavorite() {
  dbPromise
    .then(db => {
      let store = db.transaction.objectStore("favorites");
      return store.openCursor();
    })
    .then(cursor => {
      if (!cursor) return;
      if (cursor.value === favoriteItem.innerText) {
      }
    });
}

// Save individual favorites to a variable
let favoriteItems = document.querySelectorAll(".favorite-item");

console.log(favoriteItems);

favoriteBtn.addEventListener("click", addFavorite);
