window.addEventListener('load', loadCurrency)
// INITIALIZE VARIABLES
// idb config
const BASE_URL = 'https://free.currencyconverterapi.com/api/v5'
const DB_NAME = 'converx'
const DB_VERSION = 1

// Getting input nodes
const inputFrom = document.getElementById('convert-from')
const inputTo = document.getElementById('convert-to')
const selectFrom = document.getElementById('select-from')
const selectTo = document.getElementById('select-to')
const error = document.getElementById('error')

// Setting focus to input
inputFrom.focus()

// INITIALIZE IndexedDB
function openDb () {
  if (!navigator.serviceWorker) {
    return Promise.resolve()
  }

  return idb.open(DB_NAME, DB_VERSION, upgradeDb => {
    let store = upgradeDb.createObjectStore('currencies')
  })
}

let dbPromise = openDb()

// INITIALIZE SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => {
        if (!navigator.serviceWorker.controller) return
        reg.addEventListener('updatefound', worker => {
          console.log('hello')
          worker.postMessage({ action: 'skipWaiting' })
        })
      })
      .catch(err => console.error('An error occured: ', err))
  })
}

// GET CURRENCY DATA
const currency = []

function loadCurrency () {
  fetch(`${BASE_URL}/currencies`)
    .then(res => res.json())
    .then(json => {
      for (let id in json.results) {
        if (currency.includes(id)) {
          return
        }
        currency.push(id)
      }
      return currency
    })
    .then(currency => {
      currency.sort().forEach(id => {
        let currencyOption = document.createElement('option')
        currencyOption.setAttribute('value', id)
        currencyOption.innerText = id
        // Duplicate the options to use in the two selects
        let currencyOptionClone = currencyOption.cloneNode(true)
        selectFrom.appendChild(currencyOption)
        selectTo.appendChild(currencyOptionClone)
      })
    })
}

selectFrom.addEventListener('change', () => {
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text
  let fromUnit = document.getElementById('fromUnit')
  fromUnit.innerText = selectFromVal
  if (error.innerText) error.style.display = 'none'
})

selectTo.addEventListener('change', () => {
  let selectToVal = selectTo.options[selectTo.selectedIndex].text
  let toUnit = document.getElementById('toUnit')
  toUnit.innerText = selectToVal
  if (error.innerText) error.style.display = 'none'
})

inputFrom.addEventListener('input', () => {
  // Clear the converted currency while editing
  if (inputFrom.innerText === '') inputTo.innerHTML = null

  // Clear error while editing
  if (error.innerHTML) {
    error.innerHTML = null
    error.style.display = 'none'
  }
})

// Getting Exchange rate
function getConversion () {
  // Getting select nodes(dropdown)
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text
  let selectToVal = selectTo.options[selectTo.selectedIndex].text

  if (inputFrom.value && (selectFromVal === 'From' || selectToVal === 'To')) {
    error.innerHTML =
      '<i class="fas fa-exclamation-circle"></i>Please, input number/select currencies'
    error.style.display = 'block'
    return
  }

  fetch(`${BASE_URL}/convert?q=${selectFromVal}_${selectToVal}`)
    .then(res => res.json())
    .then(json => {
      let rate = json.results[`${selectFromVal}_${selectToVal}`].val

      inputTo.innerText = rate * inputFrom.value
      return rate
    })
    // Adding rates to IndexeDB
    .then(rate => {
      dbPromise.then(db => {
        let tx = db.transaction('currencies', 'readwrite')
        let store = tx.objectStore('currencies')
        store.put(rate, `${selectFromVal}_${selectToVal}`)
        return tx.complete
      })
    })
}

const convertBtn = document.getElementById('convert')

convertBtn.addEventListener('click', getConversion)

// CRUD favorites
const favorites = []
const favoriteBtn = document.getElementById('favorite-btn')

const favoritesNode = document.getElementById('favorites-box')

// Displaying favorites
favorites.forEach(favorite => {
  let fav = document.createElement('div')
  fav.style('cursor', 'pointer')
  fav.innerHTML = `<div class="favorite-item">${favorite}</div>`
  favoritesNode.appendChild(fav)
})

// Adding favorites
function addFavorite () {
  let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text
  let selectToVal = selectTo.options[selectTo.selectedIndex].text
  let newFavText = `${selectFromVal} to ${selectToVal}`

  if (selectFromVal === 'From' || selectToVal === 'To') {
    error.innerHTML =
      '<i class="fas fa-exclamation-circle"></i>Please, select a currency'
    error.style.display = 'block'
    return
  }

  favorites.push(newFavText)

  let newFav = document.createElement('div')
  newFav.innerHTML = `<div class="favorite-item">${newFavText}</div>`
  favoritesNode.appendChild(newFav)
}

favoriteBtn.addEventListener('click', addFavorite)
