import { db } from '@/lib/db'
import type {
  CharismaReminder,
  FinanceEntry,
  Department,
  WeeklyFocus,
} from '@/lib/db/schema'
import { v4 as uuid } from 'uuid'

// ── Helpers ──

function now(): string {
  return new Date().toISOString()
}

function getMonday(d: Date = new Date()): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().slice(0, 10)
}

// ============================================================
//  CHARISMA REMINDERS
// ============================================================

/**
 * Mark a charisma reminder as "got it" — updates lastShownAt on the
 * reminder and completes the associated card instance.
 */
export async function markCharismaGotIt(
  reminderId: string,
  instanceId: string,
): Promise<void> {
  const timestamp = now()

  await db.charismaReminders.update(reminderId, {
    lastShownAt: timestamp,
  })

  await db.instances.update(instanceId, {
    status: 'completed',
    completedAt: timestamp,
    updatedAt: timestamp,
  })
}

/**
 * Toggle the isFavorited flag on a charisma reminder.
 */
export async function toggleCharismaFavorite(
  reminderId: string,
): Promise<void> {
  const reminder = await db.charismaReminders.get(reminderId)
  if (!reminder) return

  await db.charismaReminders.update(reminderId, {
    isFavorited: !reminder.isFavorited,
  })
}

/**
 * Pin a charisma reminder for a given number of days from now.
 * Pass days = 0 to unpin.
 */
export async function pinCharismaReminder(
  reminderId: string,
  days: number,
): Promise<void> {
  if (days === 0) {
    await db.charismaReminders.update(reminderId, {
      pinUntil: undefined,
    })
    return
  }

  const pinDate = new Date()
  pinDate.setDate(pinDate.getDate() + days)

  await db.charismaReminders.update(reminderId, {
    pinUntil: pinDate.toISOString(),
  })
}

/**
 * Swap the currently shown charisma reminder for a random different one.
 *
 * Eligible reminders must be:
 *  - not soft-deleted
 *  - not snoozed past today
 *  - not shown in the last 7 days
 *  - not the current reminder
 *
 * Returns the new reminder's ID, or null if no eligible reminder exists.
 * Also patches the instance's configOverride.selectedReminderId.
 */
export async function swapCharismaReminder(
  instanceId: string,
  currentReminderId: string,
): Promise<string | null> {
  const today = new Date().toISOString()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoISO = sevenDaysAgo.toISOString()

  const eligible = await db.charismaReminders
    .filter((r) => {
      if (r.deletedAt) return false
      if (r.id === currentReminderId) return false
      if (r.snoozeUntil && r.snoozeUntil > today) return false
      if (r.lastShownAt && r.lastShownAt > sevenDaysAgoISO) return false
      return true
    })
    .toArray()

  if (eligible.length === 0) return null

  const picked = eligible[Math.floor(Math.random() * eligible.length)]

  const instance = await db.instances.get(instanceId)
  if (instance) {
    await db.instances.update(instanceId, {
      configOverride: {
        ...instance.configOverride,
        selectedReminderId: picked.id,
      },
      updatedAt: now(),
    })
  }

  return picked.id
}

/**
 * Snooze a charisma reminder until a given ISO date string.
 */
export async function snoozeCharismaReminder(
  reminderId: string,
  until: string,
): Promise<void> {
  await db.charismaReminders.update(reminderId, {
    snoozeUntil: until,
  })
}

// ============================================================
//  FINANCE (MONEY MINUTE)
// ============================================================

/**
 * Create and persist a new finance entry.
 */
export async function saveFinanceEntry(
  entryDate: string,
  amount: number,
  category: string,
  note?: string,
): Promise<FinanceEntry> {
  const timestamp = now()

  const entry: FinanceEntry = {
    id: uuid(),
    entryDate,
    amount,
    category,
    note,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.financeEntries.add(entry)
  return entry
}

/**
 * Get all non-deleted finance entries for a specific date,
 * sorted by createdAt descending (newest first).
 */
export async function getTodayFinanceEntries(
  dateStr: string,
): Promise<FinanceEntry[]> {
  const entries = await db.financeEntries
    .where('entryDate')
    .equals(dateStr)
    .filter((e) => !e.deletedAt)
    .toArray()

  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return entries
}

/**
 * Soft-delete a finance entry.
 */
export async function deleteFinanceEntry(id: string): Promise<void> {
  await db.financeEntries.update(id, {
    deletedAt: now(),
    updatedAt: now(),
  })
}

// ============================================================
//  WORK FOCUS
// ============================================================

/**
 * Get all non-deleted departments sorted by sortOrder.
 */
export async function getDepartments(): Promise<Department[]> {
  return db.departments
    .filter((d) => !d.deletedAt)
    .sortBy('sortOrder')
}

/**
 * Get the weekly focus record for a department and week start date.
 */
export async function getWeeklyFocus(
  departmentId: string,
  weekStart: string,
): Promise<WeeklyFocus | undefined> {
  return db.weeklyFocus
    .where('departmentId')
    .equals(departmentId)
    .filter((wf) => wf.weekStart === weekStart && !wf.deletedAt)
    .first()
}

/**
 * Get or create a weekly focus record for a department and week.
 * If one already exists it is returned; otherwise a new empty one is created.
 */
export async function getOrCreateWeeklyFocus(
  departmentId: string,
  weekStart: string,
): Promise<WeeklyFocus> {
  const existing = await getWeeklyFocus(departmentId, weekStart)
  if (existing) return existing

  const timestamp = now()

  const focus: WeeklyFocus = {
    id: uuid(),
    departmentId,
    weekStart,
    items: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.weeklyFocus.add(focus)
  return focus
}

/**
 * Replace the full items array on a weekly focus record.
 */
export async function updateWeeklyFocusItems(
  focusId: string,
  items: Array<{ text: string; completed: boolean }>,
): Promise<void> {
  await db.weeklyFocus.update(focusId, {
    items,
    updatedAt: now(),
  })
}

/**
 * Toggle the completed state of a single item by index.
 */
export async function toggleWeeklyFocusItem(
  focusId: string,
  itemIndex: number,
): Promise<void> {
  const focus = await db.weeklyFocus.get(focusId)
  if (!focus) return

  const items = [...focus.items]
  if (itemIndex < 0 || itemIndex >= items.length) return

  items[itemIndex] = {
    ...items[itemIndex],
    completed: !items[itemIndex].completed,
  }

  await db.weeklyFocus.update(focusId, {
    items,
    updatedAt: now(),
  })
}

/**
 * Append a new (uncompleted) item to a weekly focus record.
 */
export async function addWeeklyFocusItem(
  focusId: string,
  text: string,
): Promise<void> {
  const focus = await db.weeklyFocus.get(focusId)
  if (!focus) return

  const items = [...focus.items, { text, completed: false }]

  await db.weeklyFocus.update(focusId, {
    items,
    updatedAt: now(),
  })
}

/**
 * Returns a flat array of all focus-item texts across every department
 * for the current week. Used by the Today summary card.
 */
export async function getCurrentWeekFocusItems(): Promise<string[]> {
  const weekStart = getMonday()

  const allFocus = await db.weeklyFocus
    .where('weekStart')
    .equals(weekStart)
    .filter((wf) => !wf.deletedAt)
    .toArray()

  return allFocus.flatMap((wf) => wf.items.map((item) => item.text))
}
