// INITIALIZE SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('sw registered at: ', reg.scope))
      .catch(err => console.console.error('An error occured: ', err))
  })
}

// INITALIZE INDEXEDDB
// idb.open()

// INITIALIZE VARIABLES
const BASE_URL = 'https://free.currencyconverterapi.com/api/v5'

const inputFrom = document.getElementById('convert-from')
const inputTo = document.getElementById('convert-to')
const selectFrom = document.getElementById('select-from')
const selectTo = document.getElementById('select-to')

let selectFromVal = selectFrom.options[selectFrom.selectedIndex].text
let selectToVal = selectTo.options[selectTo.selectedIndex].text

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
        selectFrom.appendChild(currencyOption)
      })
    })
}

// Getting Exchange rate

function getConversion () {
  fetch(
    `${BASE_URL}/convert?q=${selectFromVal}_${selectToVal},${selectToVal}_${selectFromVal}`
  )
    .then(res => res.json())
    .then(json => console.log(json))
}

window.addEventListener('load', loadCurrency)

inputFrom.addEventListener('input', getConversion)

// CRUD favorites
const favorites = []
const favoriteBtn = document.getElementById('favorite-btn')

const favoritesNode = document.getElementById('favorites-box')

// Adding favorites
function addFavorite () {
  selectFromVal = selectFrom.options[selectFrom.selectedIndex].text
  selectToVal = selectTo.options[selectTo.selectedIndex].text
  let newFav = `${selectFromVal} to ${selectToVal}`

  // Save favorites to localStorage
  favorites.push(newFav)
  localStorage.setItem('favorites', favorites)

  let newFavLink = document.createElement('a')
  newFavLink.setAttribute('href', '#')
  newFavLink.innerHTML = `<div class="favorite-item">${newFav}</div>`
  favoritesNode.appendChild(newFavLink)
}

favoriteBtn.addEventListener('click', addFavorite)

// Displaying favorites
favorites.forEach(favorite => {
  let link = document.createElement('a')
  link.setAttribute('href', '#')
  link.innerHTML = `<div class="favorite-item">${favorite}</div>`
  favoritesNode.appendChild(link)
})
