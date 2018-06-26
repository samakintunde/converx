let CACHE_NAME = 'converx-v1.0'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll([
        'index.html',
        'js/main.js',
        'css/style.css',
        'https://use.fontawesome.com/releases/v5.1.0/css/all.css'
      ])
    })
  )
})

self.addEventListener('fetch', event => {
  let url = event.request.url
})
