const CACHE_NAME = 'montana-shell-v1'
const APP_ROOT = new URL('./', self.location.href)
const APP_URL = APP_ROOT.href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([
    APP_URL,
    new URL('manifest.webmanifest', APP_ROOT).href,
    new URL('icons/icon-192.png', APP_ROOT).href,
    new URL('icons/icon-512.png', APP_ROOT).href,
  ])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('montana-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]))
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    try {
      const response = await fetch(request)
      if (response.ok) await cache.put(request, response.clone())
      return response
    } catch {
      const cached = await cache.match(request)
      if (cached) return cached
      if (request.mode === 'navigate') return (await cache.match(APP_URL)) || Response.error()
      return Response.error()
    }
  })())
})
