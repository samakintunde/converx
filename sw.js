let CACHE_NAME = "converx-v3.2";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll([
        "https://use.fontawesome.com/releases/v5.1.0/css/all.css",
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff",
        "https://fonts.googleapis.com/css?family=Markazi+Text:700|Montserrat:400",
        "./index.html",
        "./css/style.css",
        "./js/main.js",
        "./assets/icons-512.png"
      ]);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return (
                cacheName.startsWith("converx-") && cacheName !== CACHE_NAME
              );
            })
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .catch(err => console.error(err))
  );
});

self.addEventListener("fetch", event => {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === "/") {
      event.respondWith(caches.match("/index.html"));
      return;
    }
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
