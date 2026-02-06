import { db } from '@/lib/db'
import type {
  Task,
  JournalEntry,
  ReminderItem,
  CharismaReminder,
  FinanceEntry,
  Template,
} from '@/lib/db/schema'

// ── Types ──

export type SearchResultType =
  | 'task'
  | 'journal'
  | 'reminder'
  | 'charisma'
  | 'finance'
  | 'template'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  date?: string
  matchContext?: string
}

// ── Internal helpers ──

const DEFAULT_LIMIT = 50
const CONTEXT_RADIUS = 40

/** Score a result by where the match was found: title > subtitle > body. */
type RelevanceBucket = 0 | 1 | 2

interface ScoredResult extends SearchResult {
  relevance: RelevanceBucket
}

/**
 * Extract a snippet of roughly `CONTEXT_RADIUS` chars on each side of the
 * first occurrence of `query` within `text`. Returns `undefined` when the
 * query is not found.
 */
function extractMatchContext(text: string, query: string): string | undefined {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query)
  if (idx === -1) return undefined

  const start = Math.max(0, idx - CONTEXT_RADIUS)
  const end = Math.min(text.length, idx + query.length + CONTEXT_RADIUS)

  let snippet = text.slice(start, end).trim()
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'

  return snippet
}

/**
 * Determine the relevance bucket for a result and build the `matchContext`.
 * Returns `null` when the query matches none of the provided fields (should
 * not normally happen, but acts as a safety check).
 */
function scoreResult(
  query: string,
  title: string,
  subtitle: string | undefined,
  body: string | undefined,
): { relevance: RelevanceBucket; matchContext?: string } | null {
  const lowerTitle = title.toLowerCase()
  const lowerSubtitle = subtitle?.toLowerCase()
  const lowerBody = body?.toLowerCase()

  if (lowerTitle.includes(query)) {
    return { relevance: 0, matchContext: extractMatchContext(title, query) }
  }
  if (lowerSubtitle?.includes(query)) {
    return { relevance: 1, matchContext: extractMatchContext(subtitle!, query) }
  }
  if (lowerBody?.includes(query)) {
    return { relevance: 2, matchContext: extractMatchContext(body!, query) }
  }
  return null
}

// ── Per-table search functions ──

async function searchTasks(query: string): Promise<ScoredResult[]> {
  const rows = await db.tasks
    .filter((t: Task) => {
      if (t.deletedAt) return false
      const lTitle = t.title.toLowerCase()
      const lNotes = t.notes?.toLowerCase() ?? ''
      return lTitle.includes(query) || lNotes.includes(query)
    })
    .toArray()

  const results: ScoredResult[] = []
  for (const t of rows) {
    const scored = scoreResult(query, t.title, undefined, t.notes)
    if (!scored) continue
    results.push({
      id: t.id,
      type: 'task',
      title: t.title,
      subtitle: t.notes,
      date: t.scheduledDate ?? t.dueDate,
      matchContext: scored.matchContext,
      relevance: scored.relevance,
    })
  }
  return results
}

async function searchJournalEntries(query: string): Promise<ScoredResult[]> {
  const rows = await db.journalEntries
    .filter((j: JournalEntry) => {
      if (j.deletedAt) return false
      return j.fullText.toLowerCase().includes(query)
    })
    .toArray()

  const results: ScoredResult[] = []
  for (const j of rows) {
    const title = `Journal — ${j.entryDate}`
    const scored = scoreResult(query, title, undefined, j.fullText)
    if (!scored) continue
    results.push({
      id: j.id,
      type: 'journal',
      title,
      subtitle: j.fullText.slice(0, 120),
      date: j.entryDate,
      matchContext: scored.matchContext,
      relevance: scored.relevance,
    })
  }
  return results
}

async function searchReminderItems(query: string): Promise<ScoredResult[]> {
  const rows = await db.reminderItems
    .filter((r: ReminderItem) => {
      if (r.deletedAt) return false
      return r.text.toLowerCase().includes(query)
    })
    .toArray()

  const results: ScoredResult[] = []
  for (const r of rows) {
    const scored = scoreResult(query, r.text, undefined, undefined)
    if (!scored) continue
    results.push({
      id: r.id,
      type: 'reminder',
      title: r.text,
      date: r.createdAt,
      matchContext: scored.matchContext,
      relevance: scored.relevance,
    })
  }
  return results
}

async function searchCharismaReminders(query: string): Promise<ScoredResult[]> {
  const rows = await db.charismaReminders
    .filter((c: CharismaReminder) => {
      if (c.deletedAt) return false
      return c.text.toLowerCase().includes(query)
    })
    .toArray()

  const results: ScoredResult[] = []
  for (const c of rows) {
    const scored = scoreResult(query, c.text, c.theme, undefined)
    if (!scored) continue
    results.push({
      id: c.id,
      type: 'charisma',
      title: c.text,
      subtitle: c.theme,
      date: c.createdAt,
      matchContext: scored.matchContext,
      relevance: scored.relevance,
    })
  }
  return results
}

async function searchFinanceEntries(query: string): Promise<ScoredResult[]> {
  const rows = await db.financeEntries
    .filter((f: FinanceEntry) => {
      if (f.deletedAt) return false
      const lCategory = f.category.toLowerCase()
      const lNote = f.note?.toLowerCase() ?? ''
      return lCategory.includes(query) || lNote.includes(query)
    })
    .toArray()

  const results: ScoredResult[] = []
  for (const f of rows) {
    const title = `${f.category} — $${f.amount}`
    const scored = scoreResult(query, f.category, f.note, undefined)
    if (!scored) continue
    results.push({
      id: f.id,
      type: 'finance',
      title,
      subtitle: f.note,
      date: f.entryDate,
      matchContext: scored.matchContext,
      relevance: scored.relevance,
    })
  }
  return results
}

async function searchTemplates(query: string): Promise<ScoredResult[]> {
  const rows = await db.templates
    .filter((t: Template) => {
      if (t.deletedAt) return false
      const lName = t.name.toLowerCase()
      const lDesc = t.description?.toLowerCase() ?? ''
      return lName.includes(query) || lDesc.includes(query)
    })
    .toArray()

  const results: ScoredResult[] = []
  for (const t of rows) {
    const scored = scoreResult(query, t.name, t.description, undefined)
    if (!scored) continue
    results.push({
      id: t.id,
      type: 'template',
      title: t.name,
      subtitle: t.description,
      date: t.createdAt,
      matchContext: scored.matchContext,
      relevance: scored.relevance,
    })
  }
  return results
}

// ── Searcher registry ──

const searchers: Record<SearchResultType, (q: string) => Promise<ScoredResult[]>> = {
  task: searchTasks,
  journal: searchJournalEntries,
  reminder: searchReminderItems,
  charisma: searchCharismaReminders,
  finance: searchFinanceEntries,
  template: searchTemplates,
}

const ALL_TYPES: SearchResultType[] = [
  'task',
  'journal',
  'reminder',
  'charisma',
  'finance',
  'template',
]

// ── Public API ──

/**
 * Search across all Life OS tables and return a unified, ranked list of
 * results.
 *
 * @param query   - The user's search text (minimum 2 characters).
 * @param filters - Optional list of result types to include. Omit to search
 *                  all types.
 * @param limit   - Maximum number of results to return (default 50).
 */
export async function globalSearch(
  query: string,
  filters?: SearchResultType[],
  limit: number = DEFAULT_LIMIT,
): Promise<SearchResult[]> {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length < 2) return []

  const typesToSearch = filters && filters.length > 0 ? filters : ALL_TYPES

  // Run all applicable searches in parallel
  const batches = await Promise.all(
    typesToSearch.map((type) => searchers[type](trimmed)),
  )

  const all: ScoredResult[] = batches.flat()

  // Sort: relevance bucket ascending (0 = title match, best), then date
  // descending (most recent first). Entries without a date sort last.
  all.sort((a, b) => {
    if (a.relevance !== b.relevance) return a.relevance - b.relevance
    // Both dates present — descending
    if (a.date && b.date) return b.date.localeCompare(a.date)
    // Push missing dates to the end
    if (a.date && !b.date) return -1
    if (!a.date && b.date) return 1
    return 0
  })

  // Strip internal scoring field before returning
  return all.slice(0, limit).map(({ relevance: _relevance, ...rest }) => rest)
}
