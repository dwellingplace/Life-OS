import { v4 as uuid } from 'uuid'
import { db } from '@/lib/db'
import type {
  Instance,
  Template,
  ScheduleRule,
  TemplateItem,
  TemplateType,
  TimeBlock,
  CharismaReminder,
} from '@/lib/db/schema'

/* ============================================================
   TODAY GENERATION ENGINE

   Core engine that powers the Today Runway. Converts templates
   + schedule rules into concrete Instance records for a given
   date. Handles charisma-deck reminder selection, subtitle
   computation, and bulk insertion.
   ============================================================ */

// ── Constants ──

/** Maps TemplateType to the cardType string used by card components. */
const TEMPLATE_TYPE_TO_CARD_TYPE: Record<TemplateType, string> = {
  'workout': 'workout',
  'mobility': 'mobility',
  'supplements': 'supplements',
  'charisma-deck': 'charisma',
  'work-focus': 'work-focus',
  'audio-training': 'audio-training',
  'finance': 'money-minute',
  'custom-module': 'custom-module',
}

/** Ordering priority for time blocks when sorting today's instances. */
const TIME_BLOCK_PRIORITY: Record<TimeBlock, number> = {
  'morning': 0,
  'midday': 1,
  'workout': 2,
  'evening': 3,
}

/** Day-of-week labels (0=Sun ... 6=Sat). */
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ── Utility: Date string formatting ──

/**
 * Returns a YYYY-MM-DD formatted date string.
 * Defaults to today if no date is provided.
 */
export function getDateStr(date?: Date): string {
  const d = date ?? new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ── Main generation entry point ──

/**
 * Generates today's card instances from templates + schedule rules.
 *
 * Skips generation if non-deleted instances already exist for the
 * given date (idempotent by default).
 */
export async function generateToday(dateStr: string): Promise<void> {
  // 1. Check if today is already generated
  const existingInstances = await db.instances
    .where('instanceDate')
    .equals(dateStr)
    .filter((inst) => inst.deletedAt === undefined)
    .toArray()

  if (existingInstances.length > 0) {
    // Already generated for this date — don't regenerate
    return
  }

  await _generateInstancesForDate(dateStr)
}

// ── Regenerate: refresh non-completed, non-customized instances ──

/**
 * Soft-deletes all non-completed, non-customized instances for the
 * given date, then generates fresh instances. Preserves completed
 * and user-customized cards.
 */
export async function regenerateToday(dateStr: string): Promise<void> {
  const now = new Date().toISOString()

  // Soft-delete instances that are not completed and not customized
  const existing = await db.instances
    .where('instanceDate')
    .equals(dateStr)
    .filter((inst) => inst.deletedAt === undefined)
    .toArray()

  const toSoftDelete = existing.filter(
    (inst) => inst.status !== 'completed' && !inst.isCustomized
  )

  if (toSoftDelete.length > 0) {
    await db.instances.bulkPut(
      toSoftDelete.map((inst) => ({
        ...inst,
        deletedAt: now,
        updatedAt: now,
      }))
    )
  }

  // Generate new instances (bypass the "already generated" check by
  // calling the internal generator directly)
  await _generateInstancesForDate(dateStr)
}

// ── Reset to default: soft-delete everything, regenerate ──

/**
 * Soft-deletes ALL instances for the given date (including completed
 * and customized ones), then generates a fresh default set.
 * InstanceEntries for completed cards are preserved in their own table.
 */
export async function resetTodayToDefault(dateStr: string): Promise<void> {
  const now = new Date().toISOString()

  // Soft-delete all instances for this date
  const allInstances = await db.instances
    .where('instanceDate')
    .equals(dateStr)
    .filter((inst) => inst.deletedAt === undefined)
    .toArray()

  if (allInstances.length > 0) {
    await db.instances.bulkPut(
      allInstances.map((inst) => ({
        ...inst,
        deletedAt: now,
        updatedAt: now,
      }))
    )
  }

  // Generate fresh default instances
  await _generateInstancesForDate(dateStr)
}

// ── Query: get today's instances sorted by time block + sort order ──

/**
 * Returns all non-deleted instances for the given date, ordered by
 * time block priority (morning, midday, workout, evening) then by
 * sortOrder within each block.
 */
export async function getTodayInstances(dateStr: string): Promise<Instance[]> {
  const instances = await db.instances
    .where('instanceDate')
    .equals(dateStr)
    .filter((inst) => inst.deletedAt === undefined)
    .toArray()

  // Sort by time-block priority first, then by sortOrder
  return instances.sort((a, b) => {
    const blockDiff =
      (TIME_BLOCK_PRIORITY[a.timeBlock] ?? 99) -
      (TIME_BLOCK_PRIORITY[b.timeBlock] ?? 99)
    if (blockDiff !== 0) return blockDiff
    return a.sortOrder - b.sortOrder
  })
}

// ════════════════════════════════════════════════════════════════
//  INTERNAL HELPERS
// ════════════════════════════════════════════════════════════════

/**
 * Core generation logic. Builds Instance records for each active
 * template whose schedule rule matches the given date, then bulk-
 * inserts them.
 */
async function _generateInstancesForDate(dateStr: string): Promise<void> {
  const now = new Date().toISOString()
  const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay() // 0=Sun...6=Sat
  const dayLabel = DAY_LABELS[dayOfWeek]

  // 2. Load active, non-deleted templates
  const templates = await db.templates
    .filter((t) => t.isActive === true && t.deletedAt === undefined)
    .toArray()

  if (templates.length === 0) {
    // No active templates — nothing to generate
    return
  }

  // 3. Load all non-deleted schedule rules
  const allRules = await db.scheduleRules
    .filter((r) => r.deletedAt === undefined)
    .toArray()

  if (allRules.length === 0) {
    // No schedule rules — nothing to schedule
    return
  }

  // Index rules by templateId for fast lookup
  const rulesByTemplateId = new Map<string, ScheduleRule[]>()
  for (const rule of allRules) {
    const existing = rulesByTemplateId.get(rule.templateId) ?? []
    existing.push(rule)
    rulesByTemplateId.set(rule.templateId, existing)
  }

  // Pre-load all non-deleted template items for subtitle computation
  const allItems = await db.templateItems
    .filter((item) => item.deletedAt === undefined)
    .toArray()

  const itemsByTemplateId = new Map<string, TemplateItem[]>()
  for (const item of allItems) {
    const existing = itemsByTemplateId.get(item.templateId) ?? []
    existing.push(item)
    itemsByTemplateId.set(item.templateId, existing)
  }

  // Accumulate instances to bulk-insert
  const instances: Instance[] = []

  // 4. For each template, check if it runs today
  for (const template of templates) {
    const rules = rulesByTemplateId.get(template.id) ?? []

    // A template may have multiple schedule rules (e.g., different
    // time blocks on different days). Check each one.
    for (const rule of rules) {
      // Check if the rule's effective date range covers today
      if (rule.effectiveFrom > dateStr) continue
      if (rule.effectiveUntil && rule.effectiveUntil < dateStr) continue

      // Check if today's day-of-week is in the rule's schedule
      if (!rule.daysOfWeek.includes(dayOfWeek)) continue

      // 5. Map template type to card type
      const cardType = TEMPLATE_TYPE_TO_CARD_TYPE[template.type] ?? 'custom-module'

      // Get template items for subtitle computation
      const templateItems = itemsByTemplateId.get(template.id) ?? []

      // 8. For charisma-deck, select today's reminder
      let configOverride: Record<string, unknown> | undefined
      let charismaTheme: string | undefined

      if (template.type === 'charisma-deck') {
        const selected = await _selectCharismaReminder(dateStr)
        if (selected) {
          configOverride = { selectedReminderId: selected.id }
          charismaTheme = selected.theme
        }
      }

      // 9. Compute subtitle
      const subtitle = _computeSubtitle(
        template,
        templateItems,
        dayLabel,
        charismaTheme
      )

      // 6. Create the Instance record
      const instance: Instance = {
        id: uuid(),
        templateId: template.id,
        instanceDate: dateStr,
        timeBlock: rule.timeBlock,
        status: 'pending',
        isCustomized: false,
        sortOrder: template.sortOrder,
        cardType,
        title: template.name,
        subtitle,
        createdAt: now,
        updatedAt: now,
        ...(configOverride ? { configOverride } : {}),
      }

      instances.push(instance)
    }
  }

  // 7. Tasks are managed separately — the TodayScreen queries
  // the tasks table directly. No pseudo-instances needed here.

  // 10. Bulk insert all generated instances
  if (instances.length > 0) {
    await db.instances.bulkAdd(instances)
  }
}

// ── Charisma reminder selection algorithm ──

/**
 * Picks today's charisma reminder using a weighted selection algorithm:
 *
 *  1. Pinned reminders (pinUntil >= today) are used first.
 *  2. Otherwise, exclude reminders shown within the last 7 days.
 *  3. Random pick from the remaining pool.
 *  4. If the 7-day pool is empty, expand to a 14-day exclusion window.
 *  5. If still empty (very small deck), pick from all reminders.
 *  6. Update the selected reminder's lastShownAt to today.
 *
 * Returns null if the charisma deck is completely empty.
 */
async function _selectCharismaReminder(
  dateStr: string
): Promise<CharismaReminder | null> {
  // Load all non-deleted charisma reminders
  const allReminders = await db.charismaReminders
    .filter((r) => r.deletedAt === undefined || r.deletedAt === null)
    .toArray()

  if (allReminders.length === 0) {
    // Empty charisma deck — nothing to select
    return null
  }

  // Check for pinned reminders (pinUntil >= today)
  const pinned = allReminders.filter(
    (r) => r.pinUntil !== undefined && r.pinUntil !== null && r.pinUntil >= dateStr
  )

  if (pinned.length > 0) {
    // Use the first pinned reminder (sorted by pinUntil ascending)
    const selected = pinned.sort(
      (a, b) => (a.pinUntil ?? '').localeCompare(b.pinUntil ?? '')
    )[0]
    await _updateReminderLastShown(selected.id, dateStr)
    return selected
  }

  // Exclude reminders shown within the last 7 days
  const sevenDaysAgo = _subtractDays(dateStr, 7)
  let pool = allReminders.filter(
    (r) => !r.lastShownAt || r.lastShownAt < sevenDaysAgo
  )

  // If pool is empty, expand to 14-day window
  if (pool.length === 0) {
    const fourteenDaysAgo = _subtractDays(dateStr, 14)
    pool = allReminders.filter(
      (r) => !r.lastShownAt || r.lastShownAt < fourteenDaysAgo
    )
  }

  // If still empty (very small deck or all recently shown), use all
  if (pool.length === 0) {
    pool = allReminders
  }

  // Random pick from the pool
  const selected = pool[Math.floor(Math.random() * pool.length)]
  await _updateReminderLastShown(selected.id, dateStr)
  return selected
}

/**
 * Updates a charisma reminder's lastShownAt field.
 */
async function _updateReminderLastShown(
  reminderId: string,
  dateStr: string
): Promise<void> {
  await db.charismaReminders.update(reminderId, {
    lastShownAt: dateStr,
  })
}

/**
 * Returns a YYYY-MM-DD string that is `days` before the given date string.
 */
function _subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() - days)
  return getDateStr(d)
}

// ── Subtitle computation ──

/**
 * Computes the subtitle string for a card instance based on
 * the template type and its items.
 *
 * Examples:
 *   workout:     "Monday · 8 exercises"
 *   mobility:    "5 min · 4 stretches"
 *   supplements: "6 items"
 *   charisma:    "Presence" (the selected reminder's theme)
 *   default:     template.description or empty string
 */
function _computeSubtitle(
  template: Template,
  items: TemplateItem[],
  dayLabel: string,
  charismaTheme?: string
): string {
  const count = items.length

  switch (template.type) {
    case 'workout': {
      // "{dayLabel} · {count} exercises"
      // Use the dayLabel from the template config if available, otherwise use
      // the computed day label from the calendar date.
      const label =
        (template.config?.dayLabel as string | undefined) ?? dayLabel
      return `${label} · ${count} exercise${count !== 1 ? 's' : ''}`
    }

    case 'mobility': {
      // Sum up durationSeconds from each item's config, convert to minutes
      const totalSeconds = items.reduce((sum, item) => {
        const secs = (item.config?.durationSeconds as number) ?? 0
        return sum + secs
      }, 0)
      const totalMinutes = Math.round(totalSeconds / 60)
      return `${totalMinutes} min · ${count} stretch${count !== 1 ? 'es' : ''}`
    }

    case 'supplements': {
      return `${count} item${count !== 1 ? 's' : ''}`
    }

    case 'charisma-deck': {
      // Use the selected reminder's theme, or a generic fallback
      return charismaTheme ?? 'Daily Reminder'
    }

    case 'finance': {
      return template.description ?? 'Quick finance check'
    }

    case 'work-focus': {
      return template.description ?? 'Deep work session'
    }

    case 'audio-training': {
      return template.description ?? 'Audio training'
    }

    default: {
      // custom-module or unknown types
      return template.description ?? ''
    }
  }
}
