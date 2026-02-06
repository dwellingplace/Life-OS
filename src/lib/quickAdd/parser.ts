/* ============================================================
   Quick Add — Natural Language Parser
   Converts command-bar text into structured actions.
   ============================================================ */

// ── Types ──

export type QuickAddAction =
  | { type: 'task'; title: string; scheduledDate?: string; priority: 'p1' | 'p2' | 'p3'; tags: string[] }
  | { type: 'money'; amount: number; category: string; note: string }
  | { type: 'journal'; section: string; text: string }
  | { type: 'workout'; templateName?: string }

// ── Category keyword map for finance entries ──

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Groceries: ['groceries', 'food', 'eating'],
  Transport: ['uber', 'lyft', 'gas', 'parking', 'transit'],
  Dining: ['restaurant', 'dining', 'lunch', 'dinner', 'coffee'],
  Bills: ['rent', 'electric', 'water', 'phone', 'internet'],
}

function matchCategory(words: string[]): string {
  const lower = words.map((w) => w.toLowerCase())
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }
  return 'Other'
}

// ── Day-name helpers ──

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

function nextDayOfWeek(targetDay: number, fromDate: Date): Date {
  const current = fromDate.getDay()
  let daysAhead = targetDay - current
  if (daysAhead <= 0) daysAhead += 7
  const result = new Date(fromDate)
  result.setDate(result.getDate() + daysAhead)
  return result
}

function formatDate(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ── Date keyword parser ──

function parseDateKeyword(keyword: string): string | undefined {
  const now = new Date()
  const lower = keyword.toLowerCase().trim()

  if (lower === 'today' || lower === 'tonight') {
    return formatDate(now)
  }

  if (lower === 'tomorrow') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDate(tomorrow)
  }

  if (lower === 'next week') {
    const nextWeek = new Date(now)
    // Next Monday
    const daysUntilMonday = ((1 - now.getDay()) + 7) % 7 || 7
    nextWeek.setDate(nextWeek.getDate() + daysUntilMonday)
    return formatDate(nextWeek)
  }

  // "next monday" ... "next sunday"
  const nextDayMatch = lower.match(/^next\s+(\w+)$/)
  if (nextDayMatch) {
    const dayName = nextDayMatch[1]
    const dayIndex = DAY_NAMES.indexOf(dayName as typeof DAY_NAMES[number])
    if (dayIndex !== -1) {
      // Always go to the occurrence at least 7 days out
      const target = new Date(now)
      const current = now.getDay()
      let daysAhead = dayIndex - current
      if (daysAhead <= 0) daysAhead += 7
      // "next X" means the week after the upcoming one
      daysAhead += 7
      target.setDate(target.getDate() + daysAhead)
      return formatDate(target)
    }
  }

  // Plain day names: "monday" ... "sunday" (upcoming occurrence)
  const dayIndex = DAY_NAMES.indexOf(lower as typeof DAY_NAMES[number])
  if (dayIndex !== -1) {
    return formatDate(nextDayOfWeek(dayIndex, now))
  }

  return undefined
}

// ── Priority extraction ──

const PRIORITY_REGEX = /\b(p[123])\b/i

function extractPriority(tokens: string[]): { priority: 'p1' | 'p2' | 'p3'; remaining: string[] } {
  let priority: 'p1' | 'p2' | 'p3' = 'p2'
  const remaining: string[] = []

  for (const token of tokens) {
    const match = token.match(PRIORITY_REGEX)
    if (match) {
      priority = match[1].toLowerCase() as 'p1' | 'p2' | 'p3'
    } else {
      remaining.push(token)
    }
  }

  return { priority, remaining }
}

// ── Date extraction from token list ──

interface DateExtraction {
  scheduledDate?: string
  remaining: string[]
}

function extractDate(tokens: string[]): DateExtraction {
  // Try two-word phrases first ("next week", "next monday", etc.)
  for (let i = 0; i < tokens.length - 1; i++) {
    const twoWord = `${tokens[i]} ${tokens[i + 1]}`
    const parsed = parseDateKeyword(twoWord)
    if (parsed) {
      const remaining = [...tokens.slice(0, i), ...tokens.slice(i + 2)]
      return { scheduledDate: parsed, remaining }
    }
  }

  // Try single-word keywords
  for (let i = 0; i < tokens.length; i++) {
    const parsed = parseDateKeyword(tokens[i])
    if (parsed) {
      const remaining = [...tokens.slice(0, i), ...tokens.slice(i + 1)]
      return { scheduledDate: parsed, remaining }
    }
  }

  return { remaining: tokens }
}

// ── Tag extraction (#tag syntax) ──

function extractTags(tokens: string[]): { tags: string[]; remaining: string[] } {
  const tags: string[] = []
  const remaining: string[] = []

  for (const token of tokens) {
    if (token.startsWith('#') && token.length > 1) {
      tags.push(token.slice(1))
    } else {
      remaining.push(token)
    }
  }

  return { tags, remaining }
}

// ── Main parser ──

export function parseQuickAdd(input: string): QuickAddAction {
  const trimmed = input.trim()

  // --- Journal prefix: "journal:" or "j:" ---
  const journalMatch = trimmed.match(/^(?:journal|j):\s*(.*)$/i)
  if (journalMatch) {
    return {
      type: 'journal',
      section: 'freeNotes',
      text: journalMatch[1].trim(),
    }
  }

  // --- Workout prefix: "/workout" or "/w" ---
  const workoutMatch = trimmed.match(/^\/(?:workout|w)(?:\s+(.*))?$/i)
  if (workoutMatch) {
    const templateName = workoutMatch[1]?.trim() || undefined
    return {
      type: 'workout',
      templateName,
    }
  }

  // --- Money prefix: "$<number>" ---
  const moneyMatch = trimmed.match(/^\$(\d+(?:\.\d{1,2})?)\s*(.*)$/i)
  if (moneyMatch) {
    const amount = parseFloat(moneyMatch[1])
    const rest = moneyMatch[2].trim()
    const words = rest ? rest.split(/\s+/) : []
    const category = matchCategory(words)

    // First word that matched a category keyword becomes the category;
    // remaining words form the note. If nothing matched, everything is the note.
    const categoryKeywordsFlat = Object.values(CATEGORY_KEYWORDS).flat()
    const noteWords = words.filter((w) => !categoryKeywordsFlat.includes(w.toLowerCase()))
    const note = noteWords.join(' ')

    return {
      type: 'money',
      amount,
      category,
      note,
    }
  }

  // --- Default: task creation ---
  const tokens = trimmed.split(/\s+/)

  const { priority, remaining: afterPriority } = extractPriority(tokens)
  const { tags, remaining: afterTags } = extractTags(afterPriority)
  const { scheduledDate, remaining: afterDate } = extractDate(afterTags)

  const title = afterDate.join(' ').trim()

  return {
    type: 'task',
    title,
    scheduledDate,
    priority,
    tags,
  }
}

// ── Typeahead suggestions ──

export function getQuickAddSuggestions(input: string): string[] {
  const trimmed = input.trim().toLowerCase()
  const suggestions: string[] = []

  if (!trimmed) {
    return [
      'Type a task, e.g. "buy groceries tomorrow p1"',
      '$amount for expenses, e.g. "$45 groceries lunch"',
      'journal: for a journal entry',
      '/workout for a workout session',
    ]
  }

  // Journal prefix hints
  if ('journal:'.startsWith(trimmed) || 'j:'.startsWith(trimmed)) {
    suggestions.push('journal: <your note>')
  }

  // Workout prefix hints
  if ('/workout'.startsWith(trimmed) || '/w'.startsWith(trimmed)) {
    suggestions.push('/workout push', '/workout pull', '/workout legs')
  }

  // Money prefix hints
  if (trimmed.startsWith('$')) {
    suggestions.push('$<amount> <category> <note>')
  }

  // Priority hints
  if (trimmed.includes(' p') && !trimmed.match(/p[123]/)) {
    suggestions.push('Add p1, p2, or p3 for priority')
  }

  // Date keyword hints — offer completions for partial day names
  const lastToken = trimmed.split(/\s+/).pop() ?? ''
  const dateKeywords = ['today', 'tomorrow', 'tonight', 'next week', ...DAY_NAMES]
  for (const kw of dateKeywords) {
    if (kw.startsWith(lastToken) && kw !== lastToken) {
      suggestions.push(`...${kw}`)
    }
  }

  return suggestions
}
