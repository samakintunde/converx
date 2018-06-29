let CACHE_NAME = 'converx-v2.0'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll([
        'index.html',
        'js/main.js',
        'css/style.css',
        'https://use.fontawesome.com/releases/v5.1.0/css/all.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff',
        'https://fonts.googleapis.com/css?family=Markazi+Text:700|Montserrat:400'
      ])
    })
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return cacheName.startsWith('converx-') && cacheName !== CACHE_NAME
          })
          .map(cacheName => caches.delete(cacheName))
      )
    })
  )
})

self.addEventListener('fetch', event => {
  let reqUrl = new URL(event.request.url)

  if (reqUrl === location.origin) {
    event.respondWith(caches.match(reqUrl))
    return
  }
  event.respondWith(
    caches.match(event.req).then(res => res || fetch(event.request))
  )
})

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') self.skipWaiting()
})

// H
