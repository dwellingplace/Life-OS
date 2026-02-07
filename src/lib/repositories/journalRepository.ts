import { db } from '@/lib/db'
import type { JournalEntry, Attachment, OcrText, ReminderItem, TimeBlock } from '@/lib/db/schema'
import { v4 as uuid } from 'uuid'
import { onJournalSave, onPrayerComplete } from '@/lib/rpg/xpIntegration'

// ── Helpers ──

function now(): string {
  return new Date().toISOString()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Build the `fullText` field by concatenating all non-empty sections.
 * Used whenever a section is updated so fullText stays in sync.
 */
function buildFullText(sections: JournalEntry['sections']): string {
  return [
    sections.prayer,
    sections.leadership,
    sections.gratitude,
    sections.freeNotes,
  ]
    .filter(Boolean)
    .join('\n\n')
}

// ── Journal Entry CRUD ──

/**
 * Get the journal entry for a given date, or create a blank one if it
 * doesn't exist yet.
 */
export async function getOrCreateTodayEntry(
  dateStr: string,
): Promise<JournalEntry> {
  const existing = await db.journalEntries
    .where('entryDate')
    .equals(dateStr)
    .filter((e) => !e.deletedAt)
    .first()

  if (existing) return existing

  const timestamp = now()

  const entry: JournalEntry = {
    id: uuid(),
    entryDate: dateStr,
    sections: {},
    fullText: '',
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: undefined,
  }

  await db.journalEntries.add(entry)
  return entry
}

/** Get a journal entry by date (returns `undefined` if not found or deleted). */
export async function getJournalEntry(
  dateStr: string,
): Promise<JournalEntry | undefined> {
  return db.journalEntries
    .where('entryDate')
    .equals(dateStr)
    .filter((e) => !e.deletedAt)
    .first()
}

/**
 * Update a specific section of a journal entry and recompute `fullText`.
 * Always bumps `updatedAt`.
 */
export async function updateJournalSection(
  entryId: string,
  section: keyof JournalEntry['sections'],
  text: string,
): Promise<void> {
  const entry = await db.journalEntries.get(entryId)
  if (!entry) return

  const updatedSections = { ...entry.sections, [section]: text }

  await db.journalEntries.update(entryId, {
    sections: updatedSections,
    fullText: buildFullText(updatedSections),
    updatedAt: now(),
  })

  // RPG: Grant XP for journal/prayer
  const fullText = buildFullText(updatedSections)
  const wordCount = fullText.split(/\s+/).filter(Boolean).length
  if (section === 'prayer' && text.trim().length > 0) {
    onPrayerComplete(entryId).catch(() => {})
  }
  if (wordCount > 10) {
    onJournalSave(entryId, wordCount).catch(() => {})
  }
}

/**
 * Get all journal entries sorted by date descending (newest first).
 * Excludes soft-deleted entries.
 */
export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const entries = await db.journalEntries
    .filter((e) => !e.deletedAt)
    .toArray()

  return entries.sort((a, b) => b.entryDate.localeCompare(a.entryDate))
}

/** Soft-delete a journal entry by setting `deletedAt`. */
export async function deleteJournalEntry(id: string): Promise<void> {
  await db.journalEntries.update(id, {
    deletedAt: now(),
    updatedAt: now(),
  })
}

// ── Auto-tagging ──

/**
 * Auto-tag a journal entry by matching tag keywords against `fullText`.
 *
 * 1. Load the entry to get `fullText`.
 * 2. Load all non-deleted tags from `db.tags`.
 * 3. For each tag, check if any of its keywords appear in `fullText`
 *    (case-insensitive).
 * 4. Create `db.taggables` records for every matching tag.
 */
export async function autoTagEntry(entryId: string): Promise<void> {
  const entry = await db.journalEntries.get(entryId)
  if (!entry) return

  const fullTextLower = entry.fullText.toLowerCase()

  const allTags = await db.tags
    .filter((t) => !t.deletedAt)
    .toArray()

  const matchingTagIds: string[] = []

  for (const tag of allTags) {
    const matches = tag.keywords.some((kw) =>
      fullTextLower.includes(kw.toLowerCase()),
    )
    if (matches) {
      matchingTagIds.push(tag.id)
    }
  }

  // Remove existing auto-assigned taggables for this entry to avoid duplicates
  const existingTaggables = await db.taggables
    .where('taggableId')
    .equals(entryId)
    .filter((t) => t.taggableType === 'journal-entry' && t.autoAssigned)
    .toArray()

  if (existingTaggables.length > 0) {
    await db.taggables.bulkDelete(existingTaggables.map((t) => t.id))
  }

  // Create new taggable records for matching tags
  const timestamp = now()
  const newTaggables = matchingTagIds.map((tagId) => ({
    id: uuid(),
    tagId,
    taggableType: 'journal-entry' as const,
    taggableId: entryId,
    autoAssigned: true,
    createdAt: timestamp,
  }))

  if (newTaggables.length > 0) {
    await db.taggables.bulkAdd(newTaggables)
  }
}

// ── Attachments ──

/** Create an attachment record for a journal entry. */
export async function addAttachment(
  entryId: string,
  file: File,
  localUri: string,
): Promise<Attachment> {
  const timestamp = now()

  const attachment: Attachment = {
    id: uuid(),
    parentType: 'journal-entry',
    parentId: entryId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    storageKey: `journal/${entryId}/${uuid()}`,
    localUri,
    thumbnailUri: undefined,
    uploadStatus: 'pending',
    createdAt: timestamp,
    deletedAt: undefined,
  }

  await db.attachments.add(attachment)
  return attachment
}

/** Get all non-deleted attachments for a journal entry. */
export async function getAttachments(
  entryId: string,
): Promise<Attachment[]> {
  return db.attachments
    .where('parentId')
    .equals(entryId)
    .filter((a) => a.parentType === 'journal-entry' && !a.deletedAt)
    .toArray()
}

/** Soft-delete an attachment by setting `deletedAt`. */
export async function deleteAttachment(id: string): Promise<void> {
  await db.attachments.update(id, {
    deletedAt: now(),
  })
}

// ── OCR ──

/** Save an OCR result for an attachment. */
export async function saveOcrResult(
  attachmentId: string,
  rawText: string,
  confidence: number,
): Promise<OcrText> {
  const timestamp = now()

  const ocrText: OcrText = {
    id: uuid(),
    attachmentId,
    rawText,
    editedText: rawText,
    confidence,
    engine: 'default',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.ocrTexts.add(ocrText)
  return ocrText
}

/** Update the user-edited OCR text. Always bumps `updatedAt`. */
export async function updateOcrText(
  ocrId: string,
  editedText: string,
): Promise<void> {
  await db.ocrTexts.update(ocrId, {
    editedText,
    updatedAt: now(),
  })
}

/** Get the OCR text record for an attachment (returns `undefined` if none). */
export async function getOcrText(
  attachmentId: string,
): Promise<OcrText | undefined> {
  return db.ocrTexts
    .where('attachmentId')
    .equals(attachmentId)
    .first()
}

// ── Reminder Items ──

/** Create a reminder from a starred journal line. */
export async function createReminderFromLine(
  entryId: string,
  text: string,
  lineRef: string,
): Promise<ReminderItem> {
  const timestamp = now()

  const reminder: ReminderItem = {
    id: uuid(),
    text,
    sourceEntryId: entryId,
    sourceLineRef: lineRef,
    isPinned: false,
    pinOrder: undefined,
    snoozeUntil: undefined,
    surfaceInToday: true,
    surfaceTimeBlock: undefined,
    isFavorited: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: undefined,
  }

  await db.reminderItems.add(reminder)
  return reminder
}

/**
 * Get all active reminders: not deleted, not snoozed past today.
 * Sorted by pinned first (ascending pinOrder), then by updatedAt descending.
 */
export async function getActiveReminders(): Promise<ReminderItem[]> {
  const todayStr = today()

  const reminders = await db.reminderItems
    .filter(
      (r) =>
        !r.deletedAt &&
        (!r.snoozeUntil || r.snoozeUntil <= todayStr),
    )
    .toArray()

  return reminders.sort((a, b) => {
    // Pinned items come first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    // Among pinned items, sort by pinOrder ascending
    if (a.isPinned && b.isPinned) {
      return (a.pinOrder ?? 0) - (b.pinOrder ?? 0)
    }

    // Among unpinned items, sort by updatedAt descending
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

/** Toggle the pin state of a reminder. */
export async function togglePinReminder(id: string): Promise<void> {
  const reminder = await db.reminderItems.get(id)
  if (!reminder) return

  await db.reminderItems.update(id, {
    isPinned: !reminder.isPinned,
    pinOrder: !reminder.isPinned ? Date.now() : undefined,
    updatedAt: now(),
  })
}

/** Snooze a reminder until a given date. */
export async function snoozeReminder(
  id: string,
  until: string,
): Promise<void> {
  await db.reminderItems.update(id, {
    snoozeUntil: until,
    updatedAt: now(),
  })
}

/** Toggle whether a reminder surfaces in the Today view. */
export async function toggleSurfaceInToday(id: string): Promise<void> {
  const reminder = await db.reminderItems.get(id)
  if (!reminder) return

  await db.reminderItems.update(id, {
    surfaceInToday: !reminder.surfaceInToday,
    updatedAt: now(),
  })
}

/** Soft-delete a reminder by setting `deletedAt`. */
export async function deleteReminder(id: string): Promise<void> {
  await db.reminderItems.update(id, {
    deletedAt: now(),
    updatedAt: now(),
  })
}

/**
 * Reorder pinned reminders by updating `pinOrder` for each id
 * in the given order (index = new sort position).
 */
export async function reorderPinnedReminders(
  orderedIds: string[],
): Promise<void> {
  const timestamp = now()

  await db.transaction('rw', db.reminderItems, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.reminderItems.update(orderedIds[i], {
        pinOrder: i,
        updatedAt: timestamp,
      })
    }
  })
}
