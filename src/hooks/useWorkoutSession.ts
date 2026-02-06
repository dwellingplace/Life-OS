'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Instance } from '@/lib/db/schema'
import {
  getWorkoutInstance,
  getExercisesForInstance,
  logSet as repoLogSet,
  toggleSetCompletion,
  addNoteToExercise,
  copyLastTime as repoCopyLastTime,
  incrementWeight as repoIncrementWeight,
  completeWorkout as repoCompleteWorkout,
} from '@/lib/repositories/workoutRepository'
import type { ExerciseSessionData, ExerciseSetData } from '@/lib/repositories/workoutRepository'

// ── Types ──

export interface WorkoutSessionState {
  isLoading: boolean
  instance: Instance | null
  exercises: ExerciseSessionData[]
  activeExerciseIndex: number
  setActiveExercise: (index: number) => void
  completedCount: number
  totalCount: number

  // Actions
  logSet: (templateItemId: string, setData: ExerciseSetData) => Promise<void>
  toggleSet: (templateItemId: string, setNumber: number) => Promise<void>
  addNote: (templateItemId: string, note: string) => Promise<void>
  copyLastTime: (templateItemId: string) => Promise<void>
  incrementWeight: (templateItemId: string, increment: number) => Promise<void>
  completeWorkout: () => Promise<void>

  // Rest timer
  restTimerActive: boolean
  restSecondsRemaining: number
  startRestTimer: (seconds: number) => void
  stopRestTimer: () => void
}

// ── Hook ──

export function useWorkoutSession(instanceId: string): WorkoutSessionState {
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)

  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false)
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Live query: workout instance
  const instance = useLiveQuery(
    async (): Promise<Instance | undefined> => {
      if (!instanceId) return undefined
      return getWorkoutInstance(instanceId)
    },
    [instanceId],
    undefined as Instance | undefined,
  )

  // Live query: exercises for this instance
  // Re-queries whenever instanceEntries or exerciseHistory tables change
  const exercises = useLiveQuery(
    async (): Promise<ExerciseSessionData[]> => {
      if (!instanceId) return []
      return getExercisesForInstance(instanceId)
    },
    [instanceId],
    [] as ExerciseSessionData[],
  )

  const isLoading = instance === undefined

  // Derived counts
  const totalCount = exercises.length
  const completedCount = exercises.filter((e) => {
    // An exercise is considered completed when all its sets are completed
    return e.sets.length > 0 && e.sets.every((s) => s.completed)
  }).length

  // ── Rest Timer ──

  const stopRestTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRestTimerActive(false)
    setRestSecondsRemaining(0)
  }, [])

  const startRestTimer = useCallback(
    (seconds: number) => {
      // Stop any existing timer
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setRestSecondsRemaining(seconds)
      setRestTimerActive(true)

      timerRef.current = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer complete
            if (timerRef.current !== null) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            setRestTimerActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [],
  )

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // ── Actions ──

  const logSet = useCallback(
    async (templateItemId: string, setData: ExerciseSetData) => {
      await repoLogSet(instanceId, templateItemId, setData)
    },
    [instanceId],
  )

  const toggleSet = useCallback(
    async (templateItemId: string, setNumber: number) => {
      await toggleSetCompletion(instanceId, templateItemId, setNumber)
    },
    [instanceId],
  )

  const addNote = useCallback(
    async (templateItemId: string, note: string) => {
      await addNoteToExercise(instanceId, templateItemId, note)
    },
    [instanceId],
  )

  const copyLastTime = useCallback(
    async (templateItemId: string) => {
      await repoCopyLastTime(instanceId, templateItemId)
    },
    [instanceId],
  )

  const incrementWeight = useCallback(
    async (templateItemId: string, increment: number) => {
      await repoIncrementWeight(instanceId, templateItemId, increment)
    },
    [instanceId],
  )

  const completeWorkout = useCallback(async () => {
    await repoCompleteWorkout(instanceId)
  }, [instanceId])

  // ── Clamp activeExerciseIndex if exercises shrink ──

  useEffect(() => {
    if (exercises.length > 0 && activeExerciseIndex >= exercises.length) {
      setActiveExerciseIndex(exercises.length - 1)
    }
  }, [exercises.length, activeExerciseIndex])

  return {
    isLoading,
    instance: instance ?? null,
    exercises,
    activeExerciseIndex,
    setActiveExercise: setActiveExerciseIndex,
    completedCount,
    totalCount,

    logSet,
    toggleSet,
    addNote,
    copyLastTime,
    incrementWeight,
    completeWorkout,

    restTimerActive,
    restSecondsRemaining,
    startRestTimer,
    stopRestTimer,
  }
}
