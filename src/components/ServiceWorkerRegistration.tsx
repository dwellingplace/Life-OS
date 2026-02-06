'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope)

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Every hour
      })
      .catch((err) => {
        console.error('SW registration failed:', err)
      })

    // Request persistent storage so the browser won't evict IndexedDB
    if (navigator.storage?.persist) {
      navigator.storage.persist().then((granted) => {
        console.log('Persistent storage:', granted ? 'granted' : 'denied')
      })
    }
  }, [])

  return null
}
