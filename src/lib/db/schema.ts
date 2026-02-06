import Dexie, { type EntityTable } from 'dexie'

/* ============================================================
   LIFE OS — IndexedDB Schema (Dexie)
   Single source of truth for local-first database.
   ============================================================ */

// ── Enums as string unions ──

export type TimeBlock = 'morning' | 'midday' | 'workout' | 'evening'
export type CardStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'disabled'
export type Priority = 'p1' | 'p2' | 'p3'
export type TaskStatus = 'inbox' | 'active' | 'completed'
export type GoalStatus = 'on-track' | 'at-risk' | 'blocked' | 'completed'
export type EditScope = 'today' | 'this-week' | 'template'
export type TemplateType =
  | 'workout'
  | 'mobility'
  | 'supplements'
  | 'charisma-deck'
  | 'work-focus'
  | 'audio-training'
  | 'finance'
  | 'custom-module'
export type RepeatType = 'daily' | 'specific-days' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
export type SyncStatus = 'pending' | 'in-flight' | 'synced' | 'failed'

// ── Core Entities ──

export interface Template {
  id: string
  type: TemplateType
  name: string
  icon?: string
  description?: string
  isActive: boolean
  disabledAt?: string
  config: Record<string, unknown>
  version: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface ScheduleRule {
  id: string
  templateId: string
  daysOfWeek: number[] // 0=Sun, 1=Mon ... 6=Sat
  timeBlock: TimeBlock
  timeHint?: string
  repeatType: RepeatType
  repeatConfig?: Record<string, unknown>
  effectiveFrom: string
  effectiveUntil?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface TemplateItem {
  id: string
  templateId: string
  label: string
  itemType: string
  config: Record<string, unknown>
  sortOrder: number
  isOptional: boolean
  variant?: string
  normalizedExerciseId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Instance {
  id: string
  templateId?: string
  instanceDate: string // YYYY-MM-DD
  timeBlock: TimeBlock
  status: CardStatus
  isCustomized: boolean
  sortOrder: number
  completedAt?: string
  configOverride?: Record<string, unknown>
  weekOverrideId?: string
  cardType: string // maps to card component type
  title: string
  subtitle?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface InstanceEntry {
  id: string
  instanceId: string
  templateItemId?: string
  entryType: string
  data: Record<string, unknown>
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface ExerciseHistory {
  id: string
  normalizedExerciseId: string
  variant?: string
  templateId?: string
  instanceId: string
  instanceDate: string
  setsData: Array<{ set: number; weight: number; reps: number; completed: boolean }>
  bestSet?: { weight: number; reps: number }
  totalVolume: number
  notes?: string
  createdAt: string
}

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
  repeatRuleId?: string
  sortOrder: number
  tags: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  isCompleted: boolean
  completedAt?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color?: string
  sortOrder: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface JournalEntry {
  id: string
  entryDate: string // YYYY-MM-DD
  sections: {
    prayer?: string
    leadership?: string
    gratitude?: string
    freeNotes?: string
  }
  fullText: string
  tags: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Attachment {
  id: string
  parentType: string
  parentId: string
  fileName: string
  fileType: string
  fileSize: number
  storageKey: string
  localUri?: string
  thumbnailUri?: string
  uploadStatus: 'pending' | 'uploaded' | 'failed'
  createdAt: string
  deletedAt?: string
}

export interface OcrText {
  id: string
  attachmentId: string
  rawText: string
  editedText: string
  confidence?: number
  engine: string
  createdAt: string
  updatedAt: string
}

export interface ReminderItem {
  id: string
  text: string
  sourceEntryId?: string
  sourceLineRef?: string
  isPinned: boolean
  pinOrder?: number
  snoozeUntil?: string
  surfaceInToday: boolean
  surfaceTimeBlock?: TimeBlock
  isFavorited: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CharismaReminder {
  id: string
  text: string
  theme: string
  isDefault: boolean
  isCustom: boolean
  isFavorited: boolean
  lastShownAt?: string
  snoozeUntil?: string
  pinUntil?: string
  createdAt: string
  deletedAt?: string
}

export interface Department {
  id: string
  name: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface DepartmentGoal {
  id: string
  departmentId: string
  title: string
  status: GoalStatus
  dueDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface WeeklyFocus {
  id: string
  departmentId: string
  weekStart: string
  items: Array<{ text: string; completed: boolean }>
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface KeyRhythm {
  id: string
  departmentId: string
  title: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
  lastCompletedAt?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface FinanceEntry {
  id: string
  entryDate: string
  amount: number
  category: string
  note?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Tag {
  id: string
  name: string
  isDefault: boolean
  keywords: string[]
  color?: string
  createdAt: string
  deletedAt?: string
}

export interface Taggable {
  id: string
  tagId: string
  taggableType: string
  taggableId: string
  autoAssigned: boolean
  createdAt: string
}

export interface SyncOutbox {
  id: string
  clientEventId: string
  entityType: string
  entityId: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  status: SyncStatus
  retryCount: number
  createdAt: string
  syncedAt?: string
}

export interface AppSettings {
  id: string // always 'user-settings'
  notificationPrefs: {
    amAnchorTime: string
    pmAnchorTime: string
    quietHoursStart: string
    quietHoursEnd: string
    taskReminders: boolean
  }
  workoutPrefs: {
    autoPrefillLastTime: boolean
    defaultRestSeconds: number
    weightIncrement: number
    weightUnit: 'lbs' | 'kg'
  }
  todayPrefs: {
    preset: 'minimal' | 'standard' | 'full'
    busyDayActive: boolean
  }
  beginnerMode: boolean
  onboardingComplete: boolean
  onboardingPreset: 'john-starter' | 'minimal' | 'empty'
  updatedAt: string
}

// ── Database Class ──

export class LifeOSDatabase extends Dexie {
  templates!: EntityTable<Template, 'id'>
  scheduleRules!: EntityTable<ScheduleRule, 'id'>
  templateItems!: EntityTable<TemplateItem, 'id'>
  instances!: EntityTable<Instance, 'id'>
  instanceEntries!: EntityTable<InstanceEntry, 'id'>
  exerciseHistory!: EntityTable<ExerciseHistory, 'id'>
  tasks!: EntityTable<Task, 'id'>
  subtasks!: EntityTable<Subtask, 'id'>
  projects!: EntityTable<Project, 'id'>
  journalEntries!: EntityTable<JournalEntry, 'id'>
  attachments!: EntityTable<Attachment, 'id'>
  ocrTexts!: EntityTable<OcrText, 'id'>
  reminderItems!: EntityTable<ReminderItem, 'id'>
  charismaReminders!: EntityTable<CharismaReminder, 'id'>
  departments!: EntityTable<Department, 'id'>
  departmentGoals!: EntityTable<DepartmentGoal, 'id'>
  weeklyFocus!: EntityTable<WeeklyFocus, 'id'>
  keyRhythms!: EntityTable<KeyRhythm, 'id'>
  financeEntries!: EntityTable<FinanceEntry, 'id'>
  tags!: EntityTable<Tag, 'id'>
  taggables!: EntityTable<Taggable, 'id'>
  syncOutbox!: EntityTable<SyncOutbox, 'id'>
  appSettings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('LifeOS')

    this.version(1).stores({
      templates: 'id, type, isActive, sortOrder, deletedAt',
      scheduleRules: 'id, templateId, deletedAt',
      templateItems: 'id, templateId, normalizedExerciseId, sortOrder, deletedAt',
      instances: 'id, templateId, instanceDate, timeBlock, status, cardType, deletedAt',
      instanceEntries: 'id, instanceId, templateItemId, deletedAt',
      exerciseHistory: 'id, normalizedExerciseId, instanceDate, templateId',
      tasks: 'id, scheduledDate, dueDate, status, projectId, isTop3, deletedAt',
      subtasks: 'id, taskId, deletedAt',
      projects: 'id, isArchived, deletedAt',
      journalEntries: 'id, entryDate, deletedAt',
      attachments: 'id, parentType, parentId, deletedAt',
      ocrTexts: 'id, attachmentId',
      reminderItems: 'id, sourceEntryId, isPinned, surfaceInToday, deletedAt',
      charismaReminders: 'id, lastShownAt, deletedAt',
      departments: 'id, sortOrder, deletedAt',
      departmentGoals: 'id, departmentId, deletedAt',
      weeklyFocus: 'id, departmentId, weekStart, deletedAt',
      keyRhythms: 'id, departmentId, deletedAt',
      financeEntries: 'id, entryDate, deletedAt',
      tags: 'id, name, isDefault, deletedAt',
      taggables: 'id, tagId, taggableType, taggableId',
      syncOutbox: 'id, clientEventId, status, entityType',
      appSettings: 'id',
    })
  }
}
