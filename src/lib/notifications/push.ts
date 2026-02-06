/**
 * Push notification utilities for iOS 16.4+ PWA support.
 *
 * This module handles requesting notification permission and subscribing
 * to push notifications via the service worker. All browser-API calls
 * are guarded so the module can be safely imported in any environment
 * (SSR / Node), but the actual functionality only executes in the browser.
 */

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

/** Check if push notifications are supported (iOS 16.4+ PWA or standard browsers). */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

/** Check if the app is running as an installed PWA (standalone mode). */
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  )
}

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

/** Request notification permission from the user. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return await Notification.requestPermission()
}

/** Get the current notification permission status without prompting. */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied'
  return Notification.permission
}

// ---------------------------------------------------------------------------
// Push subscription management
// ---------------------------------------------------------------------------

/**
 * Subscribe to push notifications by registering with the active service
 * worker. Returns the existing subscription if one is already active, or
 * creates a new one using the VAPID public key from the environment.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null

  try {
    const registration = await navigator.serviceWorker.ready

    // Return existing subscription if present
    const existing = await registration.pushManager.getSubscription()
    if (existing) return existing

    // VAPID public key is required to create a new subscription
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.warn(
        'NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set -- push subscription skipped'
      )
      return null
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })

    return subscription
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err)
    return null
  }
}

/** Unsubscribe from push notifications if a subscription exists. */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return false
    return await subscription.unsubscribe()
  } catch (err) {
    console.error('Failed to unsubscribe from push notifications:', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Local / fallback notifications
// ---------------------------------------------------------------------------

/**
 * Show a local notification through the service worker.
 * Useful for testing and as an offline fallback when the push server is
 * unreachable.
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushSupported()) return
  if (Notification.permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    ...options,
  })
}

/**
 * Schedule a reminder notification after a given delay.
 *
 * This uses `setTimeout` with a local notification as a simple client-side
 * scheduler. For reliable delivery across app restarts, pair this with a
 * server-side push scheduler.
 */
export async function scheduleReminderNotification(
  title: string,
  body: string,
  delayMs: number
): Promise<void> {
  setTimeout(() => {
    showLocalNotification(title, {
      body,
      tag: `reminder-${Date.now()}`,
    })
  }, delayMs)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a URL-safe base64 string (used for VAPID keys) into a Uint8Array
 * that the PushManager API expects as `applicationServerKey`.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
