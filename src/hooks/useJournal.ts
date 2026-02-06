'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { JournalEntry, Attachment, OcrText, ReminderItem } from '@/lib/db/schema'
import {
  getOrCreateTodayEntry,
  updateJournalSection,
  autoTagEntry,
  addAttachment,
  deleteAttachment,
  saveOcrResult,
  updateOcrText,
  createReminderFromLine,
  togglePinReminder,
  snoozeReminder as repoSnoozeReminder,
  toggleSurfaceInToday,
  deleteReminder as repoDeleteReminder,
} from '@/lib/repositories/journalRepository'

// ── Types ──

export interface JournalData {
  isLoading: boolean
  entry: JournalEntry | null
  attachments: Attachment[]
  ocrTexts: Record<string, OcrText> // keyed by attachmentId
  reminders: ReminderItem[]

  // Section editing
  updateSection: (section: keyof JournalEntry['sections'], text: string) => void

  // Photo/attachments
  addPhoto: (file: File, localUri: string) => Promise<void>
  deletePhoto: (attachmentId: string) => Promise<void>

  // OCR
  saveOcr: (attachmentId: string, rawText: string, confidence: number) => Promise<void>
  updateOcr: (ocrId: string, editedText: string) => Promise<void>

  // Reminders (from starred lines)
  starLine: (text: string, lineRef: string) => Promise<void>

  // All reminders (for reminders view)
  allReminders: ReminderItem[]
  togglePin: (id: string) => Promise<void>
  snoozeReminder: (id: string, until: string) => Promise<void>
  toggleSurface: (id: string) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
}

// ── Hook ──

export function useJournal(dateStr: string): JournalData {
  const [isLoading, setIsLoading] = useState(true)
  const [entryId, setEntryId] = useState<string | null>(null)
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  // Initialize: get or create the journal entry for this date
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const entry = await getOrCreateTodayEntry(dateStr)
        if (cancelled) return
        setEntryId(entry.id)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize journal entry:', err)
        if (!cancelled) setIsLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [dateStr])

  // Clean up debounce timers on unmount
  useEffect(() => {
    return () => {
      for (const timerId of Object.values(debounceTimers.current)) {
        clearTimeout(timerId)
      }
    }
  }, [])

  // Live query: journal entry for the current date
  const entry = useLiveQuery(
    async (): Promise<JournalEntry | undefined> => {
      if (!entryId) return undefined
      return db.journalEntries
        .where('entryDate')
        .equals(dateStr)
        .filter((e) => !e.deletedAt)
        .first()
    },
    [dateStr, entryId],
    undefined as JournalEntry | undefined
  )

  // Live query: attachments for this journal entry
  const attachments = useLiveQuery(
    async (): Promise<Attachment[]> => {
      if (!entryId) return []
      return db.attachments
        .where('parentId')
        .equals(entryId)
        .filter((a) => a.parentType === 'journal-entry' && !a.deletedAt)
        .toArray()
    },
    [entryId],
    [] as Attachment[]
  )

  // Live query: OCR texts for the current attachments
  const ocrTextsRaw = useLiveQuery(
    async (): Promise<OcrText[]> => {
      if (!entryId) return []
      const entryAttachments = await db.attachments
        .where('parentId')
        .equals(entryId)
        .filter((a) => a.parentType === 'journal-entry' && !a.deletedAt)
        .toArray()
      const attachmentIds = entryAttachments.map((a) => a.id)
      if (attachmentIds.length === 0) return []
      return db.ocrTexts
        .where('attachmentId')
        .anyOf(attachmentIds)
        .toArray()
    },
    [entryId],
    [] as OcrText[]
  )

  // Transform OCR texts into a Record keyed by attachmentId
  const ocrTexts = useMemo(() => {
    const map: Record<string, OcrText> = {}
    for (const ocr of ocrTextsRaw) {
      map[ocr.attachmentId] = ocr
    }
    return map
  }, [ocrTextsRaw])

  // Live query: reminders for this journal entry
  const reminders = useLiveQuery(
    async (): Promise<ReminderItem[]> => {
      if (!entryId) return []
      return db.reminderItems
        .where('sourceEntryId')
        .equals(entryId)
        .filter((r) => !r.deletedAt)
        .toArray()
    },
    [entryId],
    [] as ReminderItem[]
  )

  // Live query: all active reminders (for reminders view)
  const allReminders = useLiveQuery(
    async (): Promise<ReminderItem[]> => {
      return db.reminderItems
        .filter((r) => !r.deletedAt)
        .toArray()
    },
    [],
    [] as ReminderItem[]
  )

  // ── Section Editing (debounced) ──

  const updateSection = useCallback(
    (section: keyof JournalEntry['sections'], text: string) => {
      if (!entryId) return

      // Clear any existing timer for this section
      if (debounceTimers.current[section]) {
        clearTimeout(debounceTimers.current[section])
      }

      // Set a new debounced write
      debounceTimers.current[section] = setTimeout(async () => {
        try {
          await updateJournalSection(entryId, section, text)
          await autoTagEntry(entryId)
        } catch (err) {
          console.error(`Failed to update section "${section}":`, err)
        }
      }, 500)
    },
    [entryId]
  )

  // ── Photo/Attachment Actions ──

  const addPhoto = useCallback(
    async (file: File, localUri: string) => {
      if (!entryId) return
      await addAttachment(entryId, file, localUri)
    },
    [entryId]
  )

  const deletePhoto = useCallback(
    async (attachmentId: string) => {
      await deleteAttachment(attachmentId)
    },
    []
  )

  // ── OCR Actions ──

  const saveOcr = useCallback(
    async (attachmentId: string, rawText: string, confidence: number) => {
      await saveOcrResult(attachmentId, rawText, confidence)
    },
    []
  )

  const updateOcr = useCallback(
    async (ocrId: string, editedText: string) => {
      await updateOcrText(ocrId, editedText)
    },
    []
  )

  // ── Reminder Actions ──

  const starLine = useCallback(
    async (text: string, lineRef: string) => {
      if (!entryId) return
      await createReminderFromLine(entryId, text, lineRef)
    },
    [entryId]
  )

  const togglePin = useCallback(async (id: string) => {
    await togglePinReminder(id)
  }, [])

  const snoozeReminder = useCallback(async (id: string, until: string) => {
    await repoSnoozeReminder(id, until)
  }, [])

  const toggleSurface = useCallback(async (id: string) => {
    await toggleSurfaceInToday(id)
  }, [])

  const deleteReminder = useCallback(async (id: string) => {
    await repoDeleteReminder(id)
  }, [])

  return {
    isLoading,
    entry: entry ?? null,
    attachments,
    ocrTexts,
    reminders,
    updateSection,
    addPhoto,
    deletePhoto,
    saveOcr,
    updateOcr,
    starLine,
    allReminders,
    togglePin,
    snoozeReminder,
    toggleSurface,
    deleteReminder,
  }
}
