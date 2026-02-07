'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef, type CSSProperties } from 'react'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckIcon,
  DumbbellIcon,
  PlusIcon,
  XIcon,
} from '@/components/ui/Icons'
import type { ExerciseSetData } from '@/lib/repositories/workoutRepository'

// ── Props ──

interface WorkoutSessionScreenProps {
  instanceId: string
  onClose: () => void
}

// ── Helpers ──

function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatLastTimeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function formatLastTimePill(sets: ExerciseSetData[]): string {
  if (sets.length === 0) return 'No history'
  const weight = sets[0].weight
  const reps = sets[0].reps
  const count = sets.length
  return `${weight} \u00d7 ${reps} \u00d7 ${count}`
}

function getDayLabel(date?: string): string {
  if (!date) return ''
  try {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long' })
  } catch {
    return ''
  }
}

// ── Styles (shared/keyframes) ──

const keyframesStyle = `
  @keyframes workoutSlideIn {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes workoutComplete {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes restGlow {
    0%, 100% {
      text-shadow: 0 0 8px var(--accent);
    }
    50% {
      text-shadow: 0 0 16px var(--accent), 0 0 24px var(--accent);
    }
  }
  .workout-number-input::-webkit-inner-spin-button,
  .workout-number-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .workout-number-input {
    -moz-appearance: textfield;
  }
  @media (prefers-reduced-motion: reduce) {
    @keyframes workoutSlideIn {
      from { opacity: 1; transform: none; }
      to { opacity: 1; transform: none; }
    }
    @keyframes workoutComplete {
      from { opacity: 1; transform: none; }
      to { opacity: 1; transform: none; }
    }
    @keyframes restGlow {
      from { text-shadow: none; }
      to { text-shadow: none; }
    }
  }
`

// ── Sub-component: RestTimer ──

interface RestTimerProps {
  isActive: boolean
  secondsRemaining: number
  defaultRestSeconds: number
  onStart: (seconds: number) => void
  onStop: () => void
}

function RestTimer({ isActive, secondsRemaining, defaultRestSeconds, onStart, onStop }: RestTimerProps) {
  if (isActive) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) 0',
        }}
      >
        <ClockIcon size={18} color="var(--accent)" />
        <span
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-semibold)' as unknown as number,
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono, var(--font-sans))',
            animation: 'restGlow 2s ease-in-out infinite',
          }}
        >
          {formatRestTime(secondsRemaining)}
        </span>
        <GlassButton variant="ghost" size="sm" onClick={onStop}>
          Stop
        </GlassButton>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) 0',
      }}
    >
      <ClockIcon size={16} color="var(--text-tertiary)" />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
        Rest: {formatRestTime(defaultRestSeconds)}
      </span>
      <GlassButton variant="ghost" size="sm" onClick={() => onStart(defaultRestSeconds)}>
        Start Rest
      </GlassButton>
    </div>
  )
}

// ── Sub-component: QuickActions ──

interface QuickActionsProps {
  templateItemId: string
  hasLastTime: boolean
  weightIncrement: number
  onCopyLastTime: (templateItemId: string) => Promise<void>
  onIncrementWeight: (templateItemId: string, increment: number) => Promise<void>
  onToggleNotes: () => void
  showingNotes: boolean
}

function QuickActions({
  templateItemId,
  hasLastTime,
  weightIncrement,
  onCopyLastTime,
  onIncrementWeight,
  onToggleNotes,
  showingNotes,
}: QuickActionsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        padding: 'var(--space-2) 0',
      }}
    >
      {hasLastTime && (
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={() => onCopyLastTime(templateItemId)}
        >
          Copy last
        </GlassButton>
      )}
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={() => onIncrementWeight(templateItemId, weightIncrement)}
      >
        +{weightIncrement} lbs
      </GlassButton>
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={onToggleNotes}
        style={showingNotes ? { color: 'var(--accent)' } : undefined}
      >
        Note
      </GlassButton>
    </div>
  )
}

// ── Sub-component: SetRow ──

interface SetRowProps {
  set: ExerciseSetData
  onWeightChange: (setNumber: number, weight: number) => void
  onRepsChange: (setNumber: number, reps: number) => void
  onToggleCompleted: (setNumber: number) => void
}

const numberInputStyle: CSSProperties = {
  width: '48px',
  height: '36px',
  textAlign: 'center',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--weight-medium)' as unknown as number,
  color: 'var(--text-primary)',
  background: 'var(--glass-bg-secondary)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  padding: 0,
  WebkitAppearance: 'none' as React.CSSProperties['WebkitAppearance'],
  MozAppearance: 'textfield' as React.CSSProperties['MozAppearance'],
}

function SetRow({ set, onWeightChange, onRepsChange, onToggleCompleted }: SetRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 1fr 44px',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-1) 0',
        opacity: set.completed ? 0.6 : 1,
        transition: 'opacity var(--duration-fast) var(--ease-out)',
      }}
    >
      {/* Set number */}
      <span
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          fontWeight: 'var(--weight-medium)' as unknown as number,
        }}
      >
        {set.setNumber}
      </span>

      {/* Weight input */}
      <input
        type="number"
        className="workout-number-input"
        value={set.weight}
        onChange={(e) => onWeightChange(set.setNumber, Number(e.target.value) || 0)}
        style={{
          ...numberInputStyle,
          width: '100%',
          textDecoration: set.completed ? 'line-through' : 'none',
        }}
        aria-label={`Set ${set.setNumber} weight`}
        inputMode="numeric"
      />

      {/* Reps input */}
      <input
        type="number"
        className="workout-number-input"
        value={set.reps}
        onChange={(e) => onRepsChange(set.setNumber, Number(e.target.value) || 0)}
        style={{
          ...numberInputStyle,
          width: '100%',
          textDecoration: set.completed ? 'line-through' : 'none',
        }}
        aria-label={`Set ${set.setNumber} reps`}
        inputMode="numeric"
      />

      {/* Completed checkbox */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Checkbox
          checked={set.completed}
          onChange={() => onToggleCompleted(set.setNumber)}
          size="sm"
        />
      </div>
    </div>
  )
}

// ── Sub-component: ExerciseCard ──

interface ExerciseCardProps {
  exercise: {
    templateItem: { id: string; label: string }
    sets: ExerciseSetData[]
    lastTime: { sets: ExerciseSetData[]; date: string } | null
    notes: string
    isCompleted: boolean
  }
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onLogSet: (templateItemId: string, setData: ExerciseSetData) => Promise<void>
  onToggleSet: (templateItemId: string, setNumber: number) => Promise<void>
  onAddNote: (templateItemId: string, note: string) => Promise<void>
  onCopyLastTime: (templateItemId: string) => Promise<void>
  onIncrementWeight: (templateItemId: string, increment: number) => Promise<void>
  weightIncrement: number
  restTimerActive: boolean
  restSecondsRemaining: number
  onStartRest: (seconds: number) => void
  onStopRest: () => void
  defaultRestSeconds: number
}

function ExerciseCard({
  exercise,
  index,
  isExpanded,
  onToggleExpand,
  onLogSet,
  onToggleSet,
  onAddNote,
  onCopyLastTime,
  onIncrementWeight,
  weightIncrement,
  restTimerActive,
  restSecondsRemaining,
  onStartRest,
  onStopRest,
  defaultRestSeconds,
}: ExerciseCardProps) {
  const [showNotes, setShowNotes] = useState(!!exercise.notes)
  const [noteValue, setNoteValue] = useState(exercise.notes)
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync notes from external changes
  useEffect(() => {
    setNoteValue(exercise.notes)
    if (exercise.notes) setShowNotes(true)
  }, [exercise.notes])

  const templateItemId = exercise.templateItem.id

  const allCompleted =
    exercise.sets.length > 0 && exercise.sets.every((s) => s.completed)

  const handleWeightChange = useCallback(
    (setNumber: number, weight: number) => {
      const existingSet = exercise.sets.find((s) => s.setNumber === setNumber)
      if (!existingSet) return
      onLogSet(templateItemId, { ...existingSet, weight })
    },
    [exercise.sets, onLogSet, templateItemId],
  )

  const handleRepsChange = useCallback(
    (setNumber: number, reps: number) => {
      const existingSet = exercise.sets.find((s) => s.setNumber === setNumber)
      if (!existingSet) return
      onLogSet(templateItemId, { ...existingSet, reps })
    },
    [exercise.sets, onLogSet, templateItemId],
  )

  const handleToggleCompleted = useCallback(
    (setNumber: number) => {
      onToggleSet(templateItemId, setNumber)
    },
    [onToggleSet, templateItemId],
  )

  const handleAddSet = useCallback(() => {
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const newSetNumber = lastSet ? lastSet.setNumber + 1 : 1
    const newSet: ExerciseSetData = {
      setNumber: newSetNumber,
      weight: lastSet?.weight ?? 0,
      reps: lastSet?.reps ?? 10,
      completed: false,
    }
    onLogSet(templateItemId, newSet)
  }, [exercise.sets, onLogSet, templateItemId])

  const handleNoteChange = useCallback(
    (value: string) => {
      setNoteValue(value)
      // Debounce note save
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
      noteTimerRef.current = setTimeout(() => {
        onAddNote(templateItemId, value)
      }, 500)
    },
    [onAddNote, templateItemId],
  )

  const handleToggleNotes = useCallback(() => {
    setShowNotes((prev) => !prev)
  }, [])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
    }
  }, [])

  const lastTimePill = exercise.lastTime
    ? `Last: ${formatLastTimePill(exercise.lastTime.sets)}`
    : 'No history'

  // ── Collapsed view ──

  if (!isExpanded) {
    return (
      <GlassCard
        variant={allCompleted ? 'completed' : 'primary'}
        padding="sm"
        onClick={onToggleExpand}
        animationDelay={100 + index * 60}
        style={{ marginBottom: 'var(--space-2)' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <ChevronRightIcon size={16} color="var(--text-tertiary)" />
          <span
            style={{
              flex: 1,
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-medium)' as unknown as number,
              color: allCompleted ? 'var(--completed-text)' : 'var(--text-primary)',
              textDecoration: allCompleted ? 'line-through' : 'none',
              textDecorationColor: allCompleted ? 'var(--text-tertiary)' : undefined,
            }}
          >
            {exercise.templateItem.label}
          </span>

          {/* Last time pill */}
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              background: 'var(--glass-bg-secondary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {lastTimePill}
          </span>

          {allCompleted && (
            <CheckIcon size={16} color="var(--accent)" />
          )}
        </div>
      </GlassCard>
    )
  }

  // ── Expanded view ──

  return (
    <GlassCard
      variant="inProgress"
      padding="md"
      animationDelay={100 + index * 60}
      style={{ marginBottom: 'var(--space-2)' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
          cursor: 'pointer',
        }}
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleExpand()
          }
        }}
      >
        <ChevronDownIcon size={16} color="var(--text-tertiary)" />
        <span
          style={{
            flex: 1,
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-semibold)' as unknown as number,
            color: 'var(--text-primary)',
          }}
        >
          {exercise.templateItem.label}
        </span>
        {allCompleted && <CheckIcon size={16} color="var(--accent)" />}
      </div>

      {/* Last time info */}
      {exercise.lastTime && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            margin: '0 0 var(--space-3) 0',
          }}
        >
          Last time: {formatLastTimePill(exercise.lastTime.sets)} &mdash;{' '}
          {formatLastTimeDate(exercise.lastTime.date)}
        </p>
      )}

      {/* Sets Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 1fr 44px',
          gap: 'var(--space-2)',
          padding: '0 0 var(--space-1) 0',
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: 'var(--space-1)',
        }}
      >
        <span style={tableHeaderStyle}>Set</span>
        <span style={tableHeaderStyle}>lbs</span>
        <span style={tableHeaderStyle}>Reps</span>
        <span style={{ ...tableHeaderStyle, textAlign: 'center' }}>
          <CheckIcon size={12} color="var(--text-tertiary)" />
        </span>
      </div>

      {/* Set rows */}
      {exercise.sets.map((set) => (
        <SetRow
          key={set.setNumber}
          set={set}
          onWeightChange={handleWeightChange}
          onRepsChange={handleRepsChange}
          onToggleCompleted={handleToggleCompleted}
        />
      ))}

      {/* Add Set button */}
      <button
        onClick={handleAddSet}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          marginTop: 'var(--space-2)',
          background: 'none',
          border: '1px dashed var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          width: '100%',
          justifyContent: 'center',
          transition: 'color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
        }}
        aria-label="Add set"
      >
        <PlusIcon size={14} color="var(--text-tertiary)" />
        Add Set
      </button>

      {/* Quick Actions */}
      <QuickActions
        templateItemId={templateItemId}
        hasLastTime={!!exercise.lastTime}
        weightIncrement={weightIncrement}
        onCopyLastTime={onCopyLastTime}
        onIncrementWeight={onIncrementWeight}
        onToggleNotes={handleToggleNotes}
        showingNotes={showNotes}
      />

      {/* Notes */}
      {showNotes && (
        <div style={{ padding: 'var(--space-1) 0 var(--space-2)' }}>
          <textarea
            value={noteValue}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            style={{
              width: '100%',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
              background: 'var(--glass-bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2) var(--space-3)',
              resize: 'vertical',
              outline: 'none',
              minHeight: '48px',
              lineHeight: 'var(--leading-normal)',
              boxSizing: 'border-box',
            }}
            aria-label={`Notes for ${exercise.templateItem.label}`}
          />
        </div>
      )}

      {/* Rest Timer */}
      <RestTimer
        isActive={restTimerActive}
        secondsRemaining={restSecondsRemaining}
        defaultRestSeconds={defaultRestSeconds}
        onStart={onStartRest}
        onStop={onStopRest}
      />
    </GlassCard>
  )
}

const tableHeaderStyle: CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 'var(--weight-medium)' as unknown as number,
  textAlign: 'center',
}

// ── Main Component ──

export default function WorkoutSessionScreen({
  instanceId,
  onClose,
}: WorkoutSessionScreenProps) {
  const session = useWorkoutSession(instanceId)
  const [isCompleting, setIsCompleting] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Settings defaults
  const defaultRestSeconds = 90
  const weightIncrement = 5

  const hasCompletedSet = useMemo(() => {
    return session.exercises.some((ex) =>
      ex.sets.some((s) => s.completed),
    )
  }, [session.exercises])

  const progressPercent = useMemo(() => {
    if (session.totalCount === 0) return 0
    return Math.round((session.completedCount / session.totalCount) * 100)
  }, [session.completedCount, session.totalCount])

  const handleToggleExpand = useCallback(
    (index: number) => {
      session.setActiveExercise(
        session.activeExerciseIndex === index ? -1 : index,
      )
    },
    [session],
  )

  const handleFinishWorkout = useCallback(async () => {
    if (!hasCompletedSet || isCompleting) return
    setIsCompleting(true)
    try {
      await session.completeWorkout()
      // Brief pause for completion animation
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch {
      setIsCompleting(false)
    }
  }, [hasCompletedSet, isCompleting, session, onClose])

  const workoutName = session.instance?.title ?? 'Workout'
  const dayLabel = session.instance
    ? getDayLabel(session.instance.instanceDate)
    : ''

  // ── Completion overlay ──
  if (isCompleting) {
    return (
      <>
        <style>{keyframesStyle}</style>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'var(--glass-bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              animation: 'workoutComplete 0.6s var(--ease-out) forwards',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 32px var(--accent)',
              }}
            >
              <CheckIcon size={32} color="#0f1219" />
            </div>
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)' as unknown as number,
                color: 'var(--text-primary)',
                margin: 0,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Workout Complete!
            </h2>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {session.completedCount} of {session.totalCount} exercises
            </p>
          </div>
        </div>
      </>
    )
  }

  // ── Loading state ──
  if (session.isLoading) {
    return (
      <>
        <style>{keyframesStyle}</style>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'workoutSlideIn 0.3s var(--ease-out) forwards',
          }}
        >
          {/* Skeleton header */}
          <div style={headerBarStyle}>
            <button onClick={onClose} style={closeButtonStyle} aria-label="Close workout">
              <XIcon size={20} color="var(--text-secondary)" />
            </button>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  width: '120px',
                  height: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--glass-bg-secondary)',
                }}
              />
              <div
                style={{
                  width: '80px',
                  height: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--glass-bg-secondary)',
                  marginTop: '6px',
                }}
              />
            </div>
          </div>

          {/* Skeleton cards */}
          <div style={{ flex: 1, padding: 'var(--space-4)', overflow: 'auto' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: '56px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--glass-bg-primary)',
                  border: '1px solid var(--glass-border)',
                  marginBottom: 'var(--space-2)',
                  opacity: 0,
                  animation: `settle-in var(--duration-settle) var(--ease-out) ${200 + i * 100}ms both`,
                }}
              />
            ))}
          </div>
        </div>
      </>
    )
  }

  // ── Empty state ──
  if (session.exercises.length === 0) {
    return (
      <>
        <style>{keyframesStyle}</style>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'workoutSlideIn 0.3s var(--ease-out) forwards',
          }}
        >
          <div style={headerBarStyle}>
            <button onClick={onClose} style={closeButtonStyle} aria-label="Close workout">
              <XIcon size={20} color="var(--text-secondary)" />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={headerTitleStyle}>{workoutName}</h1>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-8)',
            }}
          >
            <DumbbellIcon size={48} color="var(--text-tertiary)" />
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'var(--font-sans)',
              }}
            >
              No exercises in this workout template.
            </p>
            <GlassButton variant="secondary" onClick={onClose}>
              Go Back
            </GlassButton>
          </div>
        </div>
      </>
    )
  }

  // ── Main session view ──

  return (
    <>
      <style>{keyframesStyle}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'workoutSlideIn 0.3s var(--ease-out) forwards',
        }}
      >
        {/* ── Progress bar ── */}
        <div
          style={{
            height: '3px',
            background: 'var(--glass-bg-secondary)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'var(--accent)',
              borderRadius: '0 2px 2px 0',
              transition: 'width 0.4s var(--ease-out)',
              boxShadow: progressPercent > 0 ? '0 0 8px var(--accent)' : 'none',
            }}
          />
        </div>

        {/* ── Header ── */}
        <div style={headerBarStyle}>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close workout">
            <XIcon size={20} color="var(--text-secondary)" />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <h1 style={headerTitleStyle}>{workoutName}</h1>
              {dayLabel && (
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                    flexShrink: 0,
                  }}
                >
                  {dayLabel}
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: '2px 0 0',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {session.completedCount} of {session.totalCount} exercises done
            </p>
          </div>

          {/* Header rest timer badge */}
          {session.restTimerActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--glass-bg-secondary)',
                border: '1px solid var(--glass-border)',
                flexShrink: 0,
              }}
            >
              <ClockIcon size={14} color="var(--accent)" />
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)' as unknown as number,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono, var(--font-sans))',
                  animation: 'restGlow 2s ease-in-out infinite',
                }}
              >
                {formatRestTime(session.restSecondsRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* ── Exercise List ── */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: 'var(--space-3) var(--space-4)',
          }}
        >
          {session.exercises.map((exercise, i) => (
            <ExerciseCard
              key={exercise.templateItem.id}
              exercise={exercise}
              index={i}
              isExpanded={session.activeExerciseIndex === i}
              onToggleExpand={() => handleToggleExpand(i)}
              onLogSet={session.logSet}
              onToggleSet={session.toggleSet}
              onAddNote={session.addNote}
              onCopyLastTime={session.copyLastTime}
              onIncrementWeight={session.incrementWeight}
              weightIncrement={weightIncrement}
              restTimerActive={session.restTimerActive}
              restSecondsRemaining={session.restSecondsRemaining}
              onStartRest={session.startRestTimer}
              onStopRest={session.stopRestTimer}
              defaultRestSeconds={defaultRestSeconds}
            />
          ))}

          {/* Bottom spacer for footer */}
          <div style={{ height: 'var(--space-20, 80px)' }} />
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            flexShrink: 0,
            padding: 'var(--space-3) var(--space-4)',
            paddingBottom: 'calc(var(--space-3) + env(safe-area-inset-bottom, 0px))',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--glass-bg-primary)',
            backdropFilter: 'blur(var(--blur-heavy, 24px))',
            WebkitBackdropFilter: 'blur(var(--blur-heavy, 24px))',
          }}
        >
          <GlassButton
            variant="primary"
            size="lg"
            fullWidth
            disabled={!hasCompletedSet}
            onClick={handleFinishWorkout}
            icon={<CheckIcon size={18} />}
          >
            Finish Workout
          </GlassButton>
        </div>
      </div>
    </>
  )
}

// ── Shared layout styles ──

const headerBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  paddingTop: 'calc(var(--space-3) + env(safe-area-inset-top, 0px))',
  flexShrink: 0,
  borderBottom: '1px solid var(--glass-border)',
  background: 'var(--glass-bg-primary)',
  backdropFilter: 'blur(var(--blur-heavy, 24px))',
  WebkitBackdropFilter: 'blur(var(--blur-heavy, 24px))',
}

const closeButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: 'var(--radius-md)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
  WebkitTapHighlightColor: 'transparent',
}

const headerTitleStyle: CSSProperties = {
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  color: 'var(--text-primary)',
  margin: 0,
  fontFamily: 'var(--font-sans)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
