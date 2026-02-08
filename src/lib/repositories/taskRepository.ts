import { db } from '@/lib/db'
import type { Task, Priority } from '@/lib/db/schema'
import { v4 as uuid } from 'uuid'
import { onTaskComplete, onAllTop3Complete } from '@/lib/rpg/xpIntegration'

// ── Types ──

export interface CreateTaskInput {
  title: string
  notes?: string
  scheduledDate?: string
  dueDate?: string
  dueTime?: string
  durationMinutes?: number
  priority?: Priority
  projectId?: string
  tags?: string[]
}

export type SnoozeOption =
  | 'tonight'
  | 'tomorrow'
  | 'next-workday'
  | 'next-week'
  | 'pick-date'

// ── Date Helpers ──

/** Add `days` to a YYYY-MM-DD string and return a new YYYY-MM-DD string. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Return the next Mon-Fri date after `from` (YYYY-MM-DD). */
export function getNextWorkday(from: string): string {
  const d = new Date(from + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  // 0 = Sunday, 6 = Saturday
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }
  return d.toISOString().slice(0, 10)
}

/** Return the next Monday on or after the day following `from` (YYYY-MM-DD). */
export function getNextMonday(from: string): string {
  const d = new Date(from + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1)
  }
  return d.toISOString().slice(0, 10)
}

function now(): string {
  return new Date().toISOString()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Priority sort weight (lower = higher priority) ──

const PRIORITY_WEIGHT: Record<Priority, number> = {
  p1: 1,
  p2: 2,
  p3: 3,
}

// ── CRUD ──

/**
 * Create a new task.
 *
 * - If only `dueDate` is provided (no `scheduledDate`), `scheduledDate` defaults to `dueDate`.
 * - Priority defaults to `'p3'`.
 * - Status defaults to `'active'`, or `'inbox'` when neither `scheduledDate` nor `dueDate` is set.
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const timestamp = now()

  const scheduledDate =
    input.scheduledDate ?? (input.dueDate ? input.dueDate : undefined)

  const hasDate = !!(scheduledDate || input.dueDate)

  const task: Task = {
    id: uuid(),
    title: input.title,
    notes: input.notes,
    scheduledDate,
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    durationMinutes: input.durationMinutes,
    priority: input.priority ?? 'p3',
    projectId: input.projectId,
    isTop3: false,
    top3Date: undefined,
    status: hasDate ? 'active' : 'inbox',
    completedAt: undefined,
    repeatRuleId: undefined,
    sortOrder: Date.now(),
    tags: input.tags ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: undefined,
  }

  await db.tasks.add(task)
  return task
}

/** Update a task by id. Always bumps `updatedAt`. */
export async function updateTask(
  id: string,
  updates: Partial<Task>,
): Promise<void> {
  await db.tasks.update(id, {
    ...updates,
    updatedAt: now(),
  })
}

/** Soft-delete a task by setting `deletedAt`. */
export async function deleteTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    deletedAt: now(),
    updatedAt: now(),
  })
}

/** Retrieve a single task by id (returns `undefined` if not found). */
export async function getTask(id: string): Promise<Task | undefined> {
  return db.tasks.get(id)
}

// ── Queries ──

/**
 * Inbox tasks: status='inbox', no scheduledDate, no dueDate, not deleted.
 * Sorted by createdAt descending (newest first).
 */
export async function getInboxTasks(): Promise<Task[]> {
  const tasks = await db.tasks
    .where('status')
    .equals('inbox')
    .filter(
      (t) => !t.deletedAt && !t.scheduledDate && !t.dueDate,
    )
    .toArray()

  return tasks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/**
 * Today tasks: scheduled for today, due today, or overdue (past due & not completed).
 * Not deleted. Sorted by priority then sortOrder.
 */
export async function getTodayTasks(dateStr: string): Promise<Task[]> {
  const tasks = await db.tasks
    .filter(
      (t) =>
        !t.deletedAt &&
        (t.scheduledDate === dateStr ||
          t.dueDate === dateStr ||
          (!!t.dueDate && t.dueDate < dateStr && t.status !== 'completed') ||
          (!!t.scheduledDate && t.scheduledDate < dateStr && !t.dueDate && t.status !== 'completed')),
    )
    .toArray()

  return tasks.sort((a, b) => {
    const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
    if (pw !== 0) return pw
    return a.sortOrder - b.sortOrder
  })
}

/**
 * Upcoming tasks: scheduled or due within the next `days` days from `fromDate`.
 * Excludes deleted and completed tasks. Sorted by date, then priority, then sortOrder.
 */
export async function getUpcomingTasks(
  fromDate: string,
  days: number,
): Promise<Task[]> {
  const endDate = addDays(fromDate, days)

  const tasks = await db.tasks
    .filter(
      (t) =>
        !t.deletedAt &&
        t.status !== 'completed' &&
        ((!!t.scheduledDate &&
          t.scheduledDate >= fromDate &&
          t.scheduledDate <= endDate) ||
          (!!t.dueDate && t.dueDate >= fromDate && t.dueDate <= endDate)),
    )
    .toArray()

  return tasks.sort((a, b) => {
    const dateA = a.scheduledDate ?? a.dueDate ?? ''
    const dateB = b.scheduledDate ?? b.dueDate ?? ''
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
    if (pw !== 0) return pw
    return a.sortOrder - b.sortOrder
  })
}

/** All tasks for a given project, not deleted. */
export async function getProjectTasks(projectId: string): Promise<Task[]> {
  return db.tasks
    .where('projectId')
    .equals(projectId)
    .filter((t) => !t.deletedAt)
    .toArray()
}

/** Top-3 tasks for a specific date. Not deleted. */
export async function getTop3Tasks(dateStr: string): Promise<Task[]> {
  return db.tasks
    .filter((t) => t.isTop3 && t.top3Date === dateStr && !t.deletedAt)
    .toArray()
}

// ── Actions ──

/** Mark a task as completed. */
export async function completeTask(id: string): Promise<void> {
  const timestamp = now()
  const task = await db.tasks.get(id)
  await db.tasks.update(id, {
    status: 'completed',
    completedAt: timestamp,
    updatedAt: timestamp,
  })

  // RPG: Grant XP
  if (task) {
    onTaskComplete(id, task.isTop3, task.priority === 'p1').catch(() => {})

    // Check if all Top 3 are now complete
    if (task.isTop3 && task.top3Date) {
      const top3 = await db.tasks
        .filter((t) => t.isTop3 && t.top3Date === task.top3Date && !t.deletedAt)
        .toArray()
      const allDone = top3.every((t) => t.status === 'completed' || t.id === id)
      if (allDone && top3.length >= 3) {
        onAllTop3Complete(task.top3Date).catch(() => {})
      }
    }
  }
}

/** Mark a completed task as active again. */
export async function uncompleteTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'active',
    completedAt: undefined,
    updatedAt: now(),
  })
}

/** Toggle a task between completed and active. */
export async function toggleTask(id: string): Promise<void> {
  const task = await db.tasks.get(id)
  if (!task) return

  if (task.status === 'completed') {
    await uncompleteTask(id)
  } else {
    await completeTask(id)
  }
}

/**
 * Snooze a task by changing its `scheduledDate`.
 * Never modifies `dueDate`.
 */
export async function snoozeTask(
  id: string,
  option: SnoozeOption,
  customDate?: string,
): Promise<void> {
  const task = await db.tasks.get(id)
  if (!task) return

  const reference = task.scheduledDate ?? today()
  let newScheduledDate: string

  switch (option) {
    case 'tonight':
      // Keep the same scheduled date — caller can use this to set an evening flag.
      newScheduledDate = reference
      break
    case 'tomorrow':
      newScheduledDate = addDays(reference, 1)
      break
    case 'next-workday':
      newScheduledDate = getNextWorkday(reference)
      break
    case 'next-week':
      newScheduledDate = getNextMonday(reference)
      break
    case 'pick-date':
      if (!customDate) {
        throw new Error('customDate is required when option is "pick-date"')
      }
      newScheduledDate = customDate
      break
  }

  await db.tasks.update(id, {
    scheduledDate: newScheduledDate,
    status: 'active',
    updatedAt: now(),
  })
}

/**
 * Promote a task to the Top-3 for a given date.
 * If there are already 3 top-3 tasks on that date, the oldest one is demoted.
 */
export async function promoteToTop3(
  id: string,
  dateStr: string,
): Promise<void> {
  const existing = await db.tasks
    .filter((t) => t.isTop3 && t.top3Date === dateStr && !t.deletedAt && t.id !== id)
    .toArray()

  // If already at capacity, demote the oldest (by updatedAt)
  if (existing.length >= 3) {
    const oldest = existing.sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    )[0]
    await demoteFromTop3(oldest.id)
  }

  await db.tasks.update(id, {
    isTop3: true,
    top3Date: dateStr,
    updatedAt: now(),
  })
}

/** Remove a task from the Top-3. */
export async function demoteFromTop3(id: string): Promise<void> {
  await db.tasks.update(id, {
    isTop3: false,
    top3Date: undefined,
    updatedAt: now(),
  })
}
