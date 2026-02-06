/* ============================================================
   Busy Day Mode
   Simplifies the Today view by filtering down to essential
   cards: top-3 tasks, first workout, and morning journal.
   ============================================================ */

import { db } from '@/lib/db'

// ── Types ──

export interface BusyDayConfig {
  isActive: boolean
  activatedAt?: string
  /** Modules that stay visible in busy day mode */
  visibleModules: string[]
  /** Default: only show top 3 tasks, 1 workout, morning journal */
  defaultVisibleModules: string[]
}

// ── Cards shown during busy day mode ──

const BUSY_DAY_CARDS = new Set<string>([
  'top3',
  'workout',
  'journal-am',
])

// ── Activate / Deactivate ──

export async function activateBusyDay(): Promise<void> {
  await db.appSettings.update('user-settings', {
    'todayPrefs.busyDayActive': true,
    updatedAt: new Date().toISOString(),
  })
}

export async function deactivateBusyDay(): Promise<void> {
  await db.appSettings.update('user-settings', {
    'todayPrefs.busyDayActive': false,
    updatedAt: new Date().toISOString(),
  })
}

// ── Toggle (returns new state) ──

export async function toggleBusyDay(): Promise<boolean> {
  const settings = await db.appSettings.get('user-settings')
  const newState = !settings?.todayPrefs?.busyDayActive

  await db.appSettings.update('user-settings', {
    'todayPrefs.busyDayActive': newState,
    updatedAt: new Date().toISOString(),
  })

  return newState
}

// ── Query helpers for TodayScreen ──

/**
 * Returns the list of module identifiers that remain visible
 * when busy day mode is on.
 */
export function getBusyDayVisibleModules(): string[] {
  return ['top3', 'workout', 'journal-morning']
}

/**
 * Determines whether a specific card should render when busy day
 * mode is active.  Used by TodayScreen to conditionally show/hide
 * individual cards.
 *
 * @param cardType  - the card's type identifier (e.g. "top3", "workout", "journal")
 * @param timeBlock - the time block the card belongs to (e.g. "morning", "midday")
 */
export function isVisibleInBusyDay(cardType: string, timeBlock: string): boolean {
  // Directly whitelisted card types
  if (BUSY_DAY_CARDS.has(cardType)) {
    return true
  }

  // Morning journal is also allowed
  if (cardType === 'journal' && timeBlock === 'morning') {
    return true
  }

  return false
}
