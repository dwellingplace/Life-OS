'use client'

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { FinanceEntry } from '@/lib/db/schema'
import {
  markCharismaGotIt,
  toggleCharismaFavorite,
  pinCharismaReminder,
  swapCharismaReminder,
  snoozeCharismaReminder,
  saveFinanceEntry,
  deleteFinanceEntry,
  getCurrentWeekFocusItems,
} from '@/lib/repositories/supportingRepository'

export interface SupportingModulesData {
  // Finance
  todayFinanceEntries: FinanceEntry[]
  saveMoney: (amount: number, category: string, note: string) => Promise<void>
  deleteFinance: (id: string) => Promise<void>

  // Work Focus
  workFocusItems: string[]

  // Charisma actions
  charismaGotIt: (reminderId: string, instanceId: string) => Promise<void>
  charismaFavorite: (reminderId: string) => Promise<void>
  charismaPin: (reminderId: string, days: number) => Promise<void>
  charismaSwap: (instanceId: string, currentReminderId: string) => Promise<void>
  charismaSnooze: (reminderId: string, until: string) => Promise<void>
}

export function useSupportingModules(dateStr: string): SupportingModulesData {
  // ── Finance: live query for today's entries ──

  const todayFinanceEntries = useLiveQuery(
    async (): Promise<FinanceEntry[]> => {
      const entries = await db.financeEntries
        .where('entryDate')
        .equals(dateStr)
        .filter((e) => !e.deletedAt)
        .toArray()
      return entries.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    },
    [dateStr],
    [] as FinanceEntry[]
  )

  // ── Work Focus: live query for current week's focus items ──

  const workFocusItems = useLiveQuery(
    async (): Promise<string[]> => {
      return getCurrentWeekFocusItems()
    },
    [dateStr],
    [] as string[]
  )

  // ── Finance actions ──

  const saveMoney = useCallback(
    async (amount: number, category: string, note: string): Promise<void> => {
      await saveFinanceEntry(dateStr, amount, category, note)
    },
    [dateStr]
  )

  const deleteFinance = useCallback(
    async (id: string): Promise<void> => {
      await deleteFinanceEntry(id)
    },
    []
  )

  // ── Charisma actions ──

  const charismaGotIt = useCallback(
    async (reminderId: string, instanceId: string): Promise<void> => {
      await markCharismaGotIt(reminderId, instanceId)
    },
    []
  )

  const charismaFavorite = useCallback(
    async (reminderId: string): Promise<void> => {
      await toggleCharismaFavorite(reminderId)
    },
    []
  )

  const charismaPin = useCallback(
    async (reminderId: string, days: number): Promise<void> => {
      await pinCharismaReminder(reminderId, days)
    },
    []
  )

  const charismaSwap = useCallback(
    async (instanceId: string, currentReminderId: string): Promise<void> => {
      await swapCharismaReminder(instanceId, currentReminderId)
    },
    []
  )

  const charismaSnooze = useCallback(
    async (reminderId: string, until: string): Promise<void> => {
      await snoozeCharismaReminder(reminderId, until)
    },
    []
  )

  return {
    todayFinanceEntries,
    saveMoney,
    deleteFinance,
    workFocusItems,
    charismaGotIt,
    charismaFavorite,
    charismaPin,
    charismaSwap,
    charismaSnooze,
  }
}
