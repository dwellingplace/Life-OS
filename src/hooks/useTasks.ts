'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Task, Project, Subtask } from '@/lib/db/schema'
import {
  createTask as repoCreateTask,
  toggleTask as repoToggleTask,
  deleteTask as repoDeleteTask,
  snoozeTask as repoSnoozeTask,
  promoteToTop3 as repoPromoteToTop3,
  demoteFromTop3 as repoDemoteFromTop3,
  getInboxTasks,
  getTodayTasks,
  getUpcomingTasks,
  getTop3Tasks,
  type CreateTaskInput,
  type SnoozeOption,
} from '@/lib/repositories/taskRepository'

// ── Date helpers ──

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string, todayStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date(todayStr + 'T00:00:00')
  const diffMs = date.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return `Tomorrow, ${weekday} ${month} ${day}`
  if (diffDays >= 7 && diffDays < 14) return `Next week \u00b7 ${weekday} ${month} ${day}`
  return `${weekday} ${month} ${day}`
}

// ── Types ──

export interface UpcomingGroup {
  date: string
  dateLabel: string
  tasks: Task[]
}

export interface TasksState {
  isLoading: boolean
  inboxTasks: Task[]
  todayTasks: Task[]
  top3Tasks: Task[]
  upcomingTasks: UpcomingGroup[]
  projects: Project[]
  subtasks: Subtask[]

  // Actions
  createTask: (input: CreateTaskInput) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  snoozeTask: (id: string, option: SnoozeOption, customDate?: string) => Promise<void>
  promoteToTop3: (id: string) => Promise<void>
  demoteFromTop3: (id: string) => Promise<void>
}

export function useTasks(): TasksState {
  const [isLoading] = useState(false)
  const todayStr = useMemo(() => getDateStr(), [])

  // ── Live Queries ──

  const inboxTasks = useLiveQuery(
    async (): Promise<Task[]> => {
      return getInboxTasks()
    },
    [],
    [] as Task[]
  )

  const todayTasks = useLiveQuery(
    async (): Promise<Task[]> => {
      return getTodayTasks(todayStr)
    },
    [todayStr],
    [] as Task[]
  )

  const top3Tasks = useLiveQuery(
    async (): Promise<Task[]> => {
      return getTop3Tasks(todayStr)
    },
    [todayStr],
    [] as Task[]
  )

  const upcomingRaw = useLiveQuery(
    async (): Promise<Task[]> => {
      return getUpcomingTasks(todayStr, 14)
    },
    [todayStr],
    [] as Task[]
  )

  const projects = useLiveQuery(
    async (): Promise<Project[]> => {
      return db.projects
        .filter((p) => !p.deletedAt && !p.isArchived)
        .toArray()
    },
    [],
    [] as Project[]
  )

  const subtasks = useLiveQuery(
    async (): Promise<Subtask[]> => {
      return db.subtasks.filter((s) => !s.deletedAt).toArray()
    },
    [],
    [] as Subtask[]
  )

  // ── Group upcoming tasks by date ──

  const upcomingTasks = useMemo((): UpcomingGroup[] => {
    const groups: Record<string, Task[]> = {}

    for (const task of upcomingRaw) {
      const taskDate = task.scheduledDate ?? task.dueDate ?? ''
      if (!taskDate) continue
      if (!groups[taskDate]) groups[taskDate] = []
      groups[taskDate].push(task)
    }

    const sortedDates = Object.keys(groups).sort()

    return sortedDates.map((date) => ({
      date,
      dateLabel: formatDateLabel(date, todayStr),
      tasks: groups[date],
    }))
  }, [upcomingRaw, todayStr])

  // ── Actions ──

  const createTask = useCallback(async (input: CreateTaskInput): Promise<void> => {
    await repoCreateTask(input)
  }, [])

  const toggleTask = useCallback(async (id: string): Promise<void> => {
    await repoToggleTask(id)
  }, [])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await repoDeleteTask(id)
  }, [])

  const snoozeTask = useCallback(
    async (id: string, option: SnoozeOption, customDate?: string): Promise<void> => {
      await repoSnoozeTask(id, option, customDate)
    },
    []
  )

  const promoteToTop3 = useCallback(
    async (id: string): Promise<void> => {
      await repoPromoteToTop3(id, todayStr)
    },
    [todayStr]
  )

  const demoteFromTop3 = useCallback(
    async (id: string): Promise<void> => {
      await repoDemoteFromTop3(id)
    },
    []
  )

  return {
    isLoading,
    inboxTasks,
    todayTasks,
    top3Tasks,
    upcomingTasks,
    projects,
    subtasks,
    createTask,
    toggleTask,
    deleteTask,
    snoozeTask,
    promoteToTop3,
    demoteFromTop3,
  }
}
