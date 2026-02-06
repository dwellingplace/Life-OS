'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Instance, Task, TemplateItem, CharismaReminder, AppSettings } from '@/lib/db/schema'
import { generateToday, getDateStr, getTodayInstances } from '@/lib/engine/todayGenerator'
import { seedDatabase } from '@/lib/db/seed'

interface TodayData {
  isLoading: boolean
  isSeeded: boolean
  dateStr: string
  instances: Instance[]
  tasks: Task[]
  top3Tasks: Task[]
  templateItems: Record<string, TemplateItem[]> // keyed by templateId
  selectedCharisma: CharismaReminder | null
  settings: AppSettings | null
  busyDay: boolean
  setBusyDay: (val: boolean) => void
  toggleTask: (taskId: string) => void
  toggleTemplateItem: (instanceId: string, templateItemId: string) => void
}

export function useToday(): TodayData {
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeded, setIsSeeded] = useState(false)
  const [busyDay, setBusyDay] = useState(false)
  const dateStr = useMemo(() => getDateStr(), [])

  // Seed + Generate on mount
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        await seedDatabase()
        if (cancelled) return
        setIsSeeded(true)
        await generateToday(dateStr)
        if (cancelled) return
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize today:', err)
        if (!cancelled) setIsLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [dateStr])

  // Live query: today's instances
  const instances = useLiveQuery(
    async (): Promise<Instance[]> => {
      if (!isSeeded) return []
      return getTodayInstances(dateStr)
    },
    [dateStr, isSeeded],
    [] as Instance[]
  )

  // Live query: today's tasks
  const allTasks = useLiveQuery(
    async (): Promise<Task[]> => {
      if (!isSeeded) return []
      const tasks = await db.tasks.toArray()
      return tasks.filter(t => !t.deletedAt)
    },
    [isSeeded],
    [] as Task[]
  )

  const todayTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (t.status === 'completed') return false
      if (t.scheduledDate === dateStr) return true
      if (t.dueDate === dateStr) return true
      if (t.dueDate && t.dueDate < dateStr) return true // overdue
      return false
    })
  }, [allTasks, dateStr])

  const top3Tasks = useMemo(() => {
    return allTasks.filter(t => t.isTop3 && t.top3Date === dateStr && t.status !== 'completed')
  }, [allTasks, dateStr])

  // Live query: template items (for checklist cards)
  const templateItemsRaw = useLiveQuery(
    async (): Promise<TemplateItem[]> => {
      if (!isSeeded) return []
      return db.templateItems.filter(ti => !ti.deletedAt).toArray()
    },
    [isSeeded],
    [] as TemplateItem[]
  )

  const templateItems = useMemo(() => {
    const map: Record<string, TemplateItem[]> = {}
    for (const item of templateItemsRaw) {
      if (!map[item.templateId]) map[item.templateId] = []
      map[item.templateId].push(item)
    }
    // Sort each group by sortOrder
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return map
  }, [templateItemsRaw])

  // Live query: selected charisma reminder
  const charismaInstance = useMemo(
    () => instances.find(i => i.cardType === 'charisma'),
    [instances]
  )

  const selectedCharismaId = charismaInstance?.configOverride?.selectedReminderId as string | undefined

  const selectedCharisma = useLiveQuery(
    async (): Promise<CharismaReminder | undefined> => {
      if (!selectedCharismaId) return undefined
      return db.charismaReminders.get(selectedCharismaId)
    },
    [selectedCharismaId],
    undefined as CharismaReminder | undefined
  )

  // Live query: settings
  const settings = useLiveQuery(
    async (): Promise<AppSettings | undefined> => {
      if (!isSeeded) return undefined
      return db.appSettings.get('user-settings')
    },
    [isSeeded],
    undefined as AppSettings | undefined
  )

  // ── Actions ──

  const toggleTask = useCallback(async (taskId: string) => {
    const task = await db.tasks.get(taskId)
    if (!task) return
    if (task.status === 'completed') {
      await db.tasks.update(taskId, {
        status: 'active' as const,
        completedAt: undefined,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await db.tasks.update(taskId, {
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }, [])

  const toggleTemplateItem = useCallback(async (instanceId: string, templateItemId: string) => {
    // Find or create an instance entry for this item
    const existing = await db.instanceEntries
      .where('instanceId')
      .equals(instanceId)
      .filter(e => e.templateItemId === templateItemId && !e.deletedAt)
      .first()

    const now = new Date().toISOString()

    if (existing) {
      // Toggle completion
      const isCompleted = (existing.data as Record<string, unknown>).completed
      await db.instanceEntries.update(existing.id, {
        data: { ...existing.data, completed: !isCompleted, completedAt: !isCompleted ? now : undefined },
        updatedAt: now,
      })
    } else {
      // Create new checked entry
      const { v4: uuid } = await import('uuid')
      await db.instanceEntries.add({
        id: uuid(),
        instanceId,
        templateItemId,
        entryType: 'check',
        data: { completed: true, completedAt: now },
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
    }
  }, [])

  return {
    isLoading,
    isSeeded,
    dateStr,
    instances: instances ?? [],
    tasks: todayTasks,
    top3Tasks,
    templateItems,
    selectedCharisma: selectedCharisma ?? null,
    settings: settings ?? null,
    busyDay,
    setBusyDay,
    toggleTask,
    toggleTemplateItem,
  }
}
