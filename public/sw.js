// ============================================================
// Life OS — Service Worker
// Caching strategy optimized for a local-first PWA.
// ============================================================

const CACHE_NAME = 'lifeos-v1'
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── Install: precache app shell ──

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  self.skipWaiting()
})

// ── Activate: clean old caches ──

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// ── Fetch: routing strategy ──

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // API calls: network first
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Images: stale while revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // App shell & static assets: cache first
  event.respondWith(cacheFirst(request))
})

// ── Push notification handler ──

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Life OS'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: data.tag || 'default',
    data: data.url || '/',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click handler ──

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(event.notification.data || '/')
    })
  )
})

// ============================================================
// Caching Strategies
// ============================================================

/**
 * Cache First — App shell & static assets.
 * Serve from cache immediately. If not cached, fetch from network,
 * cache the response, and return it.
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    // If both cache and network fail, return a basic offline fallback
    return offlineFallback(request)
  }
}

/**
 * Network First — Supabase API calls.
 * Try the network first. If it fails (offline), fall back to cache.
 * Successful network responses are cached for future offline use.
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return offlineFallback(request)
  }
}

/**
 * Stale While Revalidate — Images.
 * Return cached version immediately (if available) while fetching
 * a fresh copy in the background to update the cache.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => {
      // Network failed — the cached response (if any) is already being returned
      return cachedResponse
    })

  // Return cached immediately, or wait for network if nothing is cached
  return cachedResponse || fetchPromise
}

/**
 * Offline fallback — returns a minimal offline response when both
 * cache and network are unavailable.
 */
function offlineFallback(request) {
  // For navigation requests, return a minimal offline HTML page
  if (request.mode === 'navigate') {
    return new Response(
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Life OS — Offline</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f1219;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center}.container{max-width:400px}h1{font-size:1.5rem;margin-bottom:1rem}p{color:#94a3b8;line-height:1.6;margin-bottom:1.5rem}button{background:#3b82f6;color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:0.5rem;font-size:1rem;cursor:pointer}button:hover{background:#2563eb}</style></head><body><div class="container"><h1>You\'re offline</h1><p>Life OS needs a network connection to load for the first time. Your data is safely stored on your device.</p><button onclick="location.reload()">Try again</button></div></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // For other requests, return a simple 503
  return new Response('Offline', { status: 503, statusText: 'Offline' })
}
