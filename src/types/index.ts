/* ============================================================
   LIFE OS — Core Type Definitions
   ============================================================ */

// ── Time Blocks ──
export type TimeBlock = 'morning' | 'midday' | 'workout' | 'evening'

// ── Card Types ──
export type CardType =
  | 'workout'
  | 'exercise'
  | 'mobility'
  | 'supplements'
  | 'task'
  | 'daily-todo'
  | 'journal'
  | 'charisma'
  | 'work-focus'
  | 'money-minute'
  | 'audio-training'
  | 'reminder'
  | 'custom-module'

// ── Card Status ──
export type CardStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'skipped'
  | 'disabled'

// ── Priority ──
export type Priority = 'p1' | 'p2' | 'p3'

// ── Task Status ──
export type TaskStatus = 'inbox' | 'active' | 'completed'

// ── Goal Status ──
export type GoalStatus = 'on-track' | 'at-risk' | 'blocked' | 'completed'

// ── Edit Scope (Edit Ladder) ──
export type EditScope = 'today' | 'this-week' | 'template'

// ── Snooze Option ──
export type SnoozeOption =
  | 'tonight'
  | 'tomorrow'
  | 'next-workday'
  | 'next-week'
  | 'pick-date'

// ── Today Card Instance ──
export interface TodayCard {
  id: string
  type: CardType
  title: string
  subtitle?: string
  timeBlock: TimeBlock
  status: CardStatus
  sortOrder: number
  templateId?: string
  isCustomized?: boolean
  data?: Record<string, unknown>
}

// ── Task ──
export interface Task {
  id: string
  title: string
  notes?: string
  scheduledDate?: string
  dueDate?: string
  dueTime?: string
  durationMinutes?: number
  priority: Priority
  projectId?: string
  isTop3: boolean
  top3Date?: string
  status: TaskStatus
  completedAt?: string
  subtasks: Subtask[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Subtask {
  id: string
  title: string
  isCompleted: boolean
  completedAt?: string
}

// ── Journal Entry ──
export interface JournalEntry {
  id: string
  entryDate: string
  sections: {
    prayer?: string
    leadership?: string
    gratitude?: string
    freeNotes?: string
  }
  tags: string[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  fileName: string
  fileType: string
  localUri?: string
  thumbnailUri?: string
  ocrText?: string
}

// ── Reminder Item ──
export interface ReminderItem {
  id: string
  text: string
  sourceEntryId?: string
  isPinned: boolean
  pinOrder?: number
  snoozeUntil?: string
  surfaceInToday: boolean
  surfaceTimeBlock?: TimeBlock
  isFavorited: boolean
  createdAt: string
}

// ── Workout Types ──
export interface WorkoutTemplate {
  id: string
  name: string
  exercises: ExerciseTemplate[]
}

export interface ExerciseTemplate {
  id: string
  name: string
  normalizedId: string
  variant?: string
  defaultSets: number
  defaultReps: number
  defaultWeight?: number
  weightUnit: 'lbs' | 'kg'
  isOptional: boolean
  sortOrder: number
}

export interface ExerciseSet {
  setNumber: number
  weight: number
  reps: number
  completed: boolean
}

export interface ExerciseInstance {
  exerciseId: string
  name: string
  normalizedId: string
  sets: ExerciseSet[]
  lastTime?: {
    sets: ExerciseSet[]
    date: string
  }
  notes?: string
  restSeconds: number
}

// ── Charisma Reminder ──
export interface CharismaReminder {
  id: string
  text: string
  theme: string
  isFavorited: boolean
  lastShownAt?: string
  snoozeUntil?: string
  pinUntil?: string
}

// ── Work Focus ──
export interface Department {
  id: string
  name: string
  goals: DepartmentGoal[]
  weeklyFocus: string[]
  sortOrder: number
}

export interface DepartmentGoal {
  id: string
  title: string
  status: GoalStatus
  dueDate?: string
  notes?: string
}

// ── Finance Entry ──
export interface FinanceEntry {
  id: string
  entryDate: string
  amount: number
  category: string
  note?: string
}

// ── Supplement Item ──
export interface SupplementItem {
  id: string
  name: string
  dosage: string
  timing?: string
  isChecked: boolean
}

// ── Mobility Item ──
export interface MobilityItem {
  id: string
  name: string
  duration: string
  durationSeconds: number
  isCompleted: boolean
}

// ── Tab Type ──
export type TabId = 'today' | 'plan' | 'tasks' | 'journal' | 'progress' | 'rpg'

export interface TabConfig {
  id: TabId
  label: string
  icon: string
}
