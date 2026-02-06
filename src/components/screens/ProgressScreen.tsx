'use client'

import React, { useState, useMemo, useCallback, type CSSProperties } from 'react'
import Header from '@/components/layout/Header'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassChip } from '@/components/ui/GlassChip'
import { GlassSheet } from '@/components/ui/GlassSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import {
  BarChartIcon,
  CheckIcon,
  StarIcon,
  ClockIcon,
  DumbbellIcon,
  BookIcon,
  ChevronRightIcon,
} from '@/components/ui/Icons'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Instance, Task, JournalEntry, FinanceEntry, ExerciseHistory } from '@/lib/db/schema'

// ── Types ──

type TabView = 'week' | 'review'

interface WeekRange {
  start: string
  end: string
  startDate: Date
  endDate: Date
}

interface WeeklyStats {
  tasksCompleted: number
  workoutsDone: number
  journalEntries: number
  moneyTracked: number
}

interface StreakDay {
  date: string
  label: string
  hasActivity: boolean
}

interface WorkoutStats {
  totalSets: number
  totalVolume: number
  workoutsCount: number
}

interface ModuleCompletion {
  cardType: string
  label: string
  total: number
  completed: number
  percentage: number
}

interface ReviewState {
  wins: string
  challenges: string
  nextWeek: string
}

// ── Helpers ──

function getWeekRange(): WeekRange {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const startDate = new Date(now)
  startDate.setDate(diff)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)
  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
    startDate,
    endDate,
  }
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const year = endDate.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const MODULE_LABELS: Record<string, string> = {
  workout: 'Workouts',
  mobility: 'Mobility',
  supplements: 'Supplements',
  'charisma-deck': 'Charisma',
  'work-focus': 'Work Focus',
  'audio-training': 'Audio Training',
  finance: 'Finance',
  'money-minute': 'Finance',
  'custom-module': 'Custom',
}

// ── Component ──

interface ProgressScreenProps {
  onSearchPress?: () => void
}

export default function ProgressScreen({ onSearchPress }: ProgressScreenProps) {
  const [activeTab, setActiveTab] = useState<TabView>('week')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewStep, setReviewStep] = useState(0)
  const [reviewState, setReviewState] = useState<ReviewState>({
    wins: '',
    challenges: '',
    nextWeek: '',
  })

  const weekRange = useMemo(() => getWeekRange(), [])
  const dateRangeLabel = useMemo(
    () => formatDateRange(weekRange.startDate, weekRange.endDate),
    [weekRange]
  )

  // ── Data Queries ──

  const weekTasks = useLiveQuery(
    async (): Promise<Task[]> => {
      return await db.tasks
        .where('completedAt')
        .between(weekRange.startDate.toISOString(), weekRange.endDate.toISOString(), true, true)
        .filter((t) => !t.deletedAt)
        .toArray()
    },
    [weekRange.start],
    [] as Task[]
  )

  const weekInstances = useLiveQuery(
    async (): Promise<Instance[]> => {
      return await db.instances
        .where('instanceDate')
        .between(weekRange.start, weekRange.end, true, true)
        .filter((i) => !i.deletedAt)
        .toArray()
    },
    [weekRange.start],
    [] as Instance[]
  )

  const weekJournals = useLiveQuery(
    async (): Promise<JournalEntry[]> => {
      return await db.journalEntries
        .where('entryDate')
        .between(weekRange.start, weekRange.end, true, true)
        .filter((j) => !j.deletedAt)
        .toArray()
    },
    [weekRange.start],
    [] as JournalEntry[]
  )

  const weekFinance = useLiveQuery(
    async (): Promise<FinanceEntry[]> => {
      return await db.financeEntries
        .where('entryDate')
        .between(weekRange.start, weekRange.end, true, true)
        .filter((f) => !f.deletedAt)
        .toArray()
    },
    [weekRange.start],
    [] as FinanceEntry[]
  )

  const weekExerciseHistory = useLiveQuery(
    async (): Promise<ExerciseHistory[]> => {
      return await db.exerciseHistory
        .where('instanceDate')
        .between(weekRange.start, weekRange.end, true, true)
        .toArray()
    },
    [weekRange.start],
    [] as ExerciseHistory[]
  )

  // ── Derived Stats ──

  const weeklyStats = useMemo((): WeeklyStats => {
    const tasksCompleted = weekTasks.filter((t) => t.status === 'completed').length
    const workoutsDone = weekInstances.filter(
      (i) => i.cardType === 'workout' && i.status === 'completed'
    ).length
    const journalEntries = weekJournals.length
    const moneyTracked = weekFinance.reduce((sum, f) => sum + Math.abs(f.amount), 0)
    return { tasksCompleted, workoutsDone, journalEntries, moneyTracked }
  }, [weekTasks, weekInstances, weekJournals, weekFinance])

  const streakDays = useMemo((): StreakDay[] => {
    const days: StreakDay[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekRange.startDate)
      date.setDate(weekRange.startDate.getDate() + i)
      const dateStr = date.toISOString().slice(0, 10)

      const hasCompletedInstance = weekInstances.some(
        (inst) => inst.instanceDate === dateStr && inst.status === 'completed'
      )
      const hasCompletedTask = weekTasks.some((t) => {
        if (!t.completedAt) return false
        return t.completedAt.slice(0, 10) === dateStr
      })
      const hasJournal = weekJournals.some((j) => j.entryDate === dateStr)

      days.push({
        date: dateStr,
        label: DAY_LABELS[i],
        hasActivity: hasCompletedInstance || hasCompletedTask || hasJournal,
      })
    }
    return days
  }, [weekRange.startDate, weekInstances, weekTasks, weekJournals])

  const currentStreak = useMemo((): number => {
    const today = new Date().toISOString().slice(0, 10)
    let streak = 0
    // Count backwards from today (or end of week, whichever is earlier)
    for (let i = streakDays.length - 1; i >= 0; i--) {
      if (streakDays[i].date > today) continue
      if (streakDays[i].hasActivity) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [streakDays])

  const workoutStats = useMemo((): WorkoutStats | null => {
    if (weekExerciseHistory.length === 0) return null
    const workoutInstanceIds = new Set(weekExerciseHistory.map((e) => e.instanceId))
    const totalSets = weekExerciseHistory.reduce(
      (sum, e) => sum + e.setsData.filter((s) => s.completed).length,
      0
    )
    const totalVolume = weekExerciseHistory.reduce((sum, e) => sum + e.totalVolume, 0)
    return {
      totalSets,
      totalVolume,
      workoutsCount: workoutInstanceIds.size,
    }
  }, [weekExerciseHistory])

  const moduleCompletions = useMemo((): ModuleCompletion[] => {
    const groups: Record<string, { total: number; completed: number }> = {}
    for (const inst of weekInstances) {
      const type = inst.cardType
      if (!groups[type]) {
        groups[type] = { total: 0, completed: 0 }
      }
      groups[type].total++
      if (inst.status === 'completed') {
        groups[type].completed++
      }
    }
    return Object.entries(groups)
      .map(([cardType, data]) => ({
        cardType,
        label: MODULE_LABELS[cardType] ?? cardType,
        total: data.total,
        completed: data.completed,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [weekInstances])

  // ── Review Flow ──

  const handleStartReview = useCallback(() => {
    setReviewStep(0)
    setReviewState({ wins: '', challenges: '', nextWeek: '' })
    setReviewOpen(true)
  }, [])

  const handleCloseReview = useCallback(() => {
    setReviewOpen(false)
  }, [])

  const handleReviewNext = useCallback(() => {
    setReviewStep((prev) => Math.min(prev + 1, 2))
  }, [])

  const handleReviewBack = useCallback(() => {
    setReviewStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleCompleteReview = useCallback(() => {
    // Review completion -- not persisted to db yet, just closes the sheet
    setReviewOpen(false)
  }, [])

  const updateReviewField = useCallback(
    (field: keyof ReviewState) => (value: string) => {
      setReviewState((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // ── Loading Detection ──

  const isLoading =
    weekTasks.length === 0 &&
    weekInstances.length === 0 &&
    weekJournals.length === 0 &&
    weekFinance.length === 0

  // Since useLiveQuery with default values returns empty arrays immediately,
  // we check if data is actually loaded by tracking a simple flag
  const [hasInitialized, setHasInitialized] = useState(false)

  // Mark initialized after first render cycle with real query results
  useMemo(() => {
    if (!hasInitialized) {
      // Allow one tick for queries to resolve
      const timer = setTimeout(() => setHasInitialized(true), 300)
      return () => clearTimeout(timer)
    }
  }, [hasInitialized])

  // ── Styles ──

  const containerStyle: CSSProperties = {
    height: '100%',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'calc(var(--tabbar-height) + var(--space-8))',
  }

  const contentStyle: CSSProperties = {
    padding: '0 var(--space-4)',
  }

  const tabRowStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-1)',
  }

  const sectionGap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  }

  // ── Loading State ──

  if (!hasInitialized) {
    return (
      <div style={containerStyle}>
        <Header title="Progress" onSearchPress={onSearchPress} />
        <div style={contentStyle}>
          <div style={tabRowStyle}>
            <GlassChip label="This Week" selected />
            <GlassChip label="Review" />
          </div>
          <div style={sectionGap}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-shimmer"
                style={{
                  height: i === 1 ? '160px' : '100px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--glass-bg-primary)',
                  border: '1px solid var(--glass-border)',
                  opacity: 0,
                  animation: `settle-in var(--duration-settle) var(--ease-out) ${150 + i * 100}ms both`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ──

  return (
    <div style={containerStyle}>
      <Header title="Progress" />

      <div style={contentStyle}>
        {/* Tab Row */}
        <div style={tabRowStyle}>
          <GlassChip
            label="This Week"
            selected={activeTab === 'week'}
            onClick={() => setActiveTab('week')}
          />
          <GlassChip
            label="Review"
            selected={activeTab === 'review'}
            onClick={() => setActiveTab('review')}
          />
        </div>

        {activeTab === 'week' ? (
          <ThisWeekView
            dateRangeLabel={dateRangeLabel}
            weeklyStats={weeklyStats}
            streakDays={streakDays}
            currentStreak={currentStreak}
            workoutStats={workoutStats}
            moduleCompletions={moduleCompletions}
          />
        ) : (
          <ReviewView onStartReview={handleStartReview} />
        )}

        <div style={{ height: 'var(--space-16)' }} />
      </div>

      {/* Weekly Review Sheet */}
      <GlassSheet
        isOpen={reviewOpen}
        onClose={handleCloseReview}
        title="Weekly Review"
      >
        <ReviewFlow
          step={reviewStep}
          reviewState={reviewState}
          onUpdateField={updateReviewField}
          onNext={handleReviewNext}
          onBack={handleReviewBack}
          onComplete={handleCompleteReview}
        />
      </GlassSheet>
    </div>
  )
}

// ── This Week View ──

interface ThisWeekViewProps {
  dateRangeLabel: string
  weeklyStats: WeeklyStats
  streakDays: StreakDay[]
  currentStreak: number
  workoutStats: WorkoutStats | null
  moduleCompletions: ModuleCompletion[]
}

function ThisWeekView({
  dateRangeLabel,
  weeklyStats,
  streakDays,
  currentStreak,
  workoutStats,
  moduleCompletions,
}: ThisWeekViewProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Weekly Overview */}
      <GlassCard variant="elevated" animationDelay={100}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <BarChartIcon size={18} color="var(--accent)" />
            <span
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-semibold)' as unknown as number,
                color: 'var(--text-primary)',
              }}
            >
              This Week
            </span>
          </div>
        </div>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            margin: '0 0 var(--space-4)',
          }}
        >
          {dateRangeLabel}
        </p>

        {/* Stat Bubbles Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
          }}
        >
          <StatBubble
            icon={<CheckIcon size={16} color="var(--accent)" />}
            value={weeklyStats.tasksCompleted}
            label="Tasks done"
          />
          <StatBubble
            icon={<DumbbellIcon size={16} color="var(--accent)" />}
            value={weeklyStats.workoutsDone}
            label="Workouts"
          />
          <StatBubble
            icon={<BookIcon size={16} color="var(--accent)" />}
            value={weeklyStats.journalEntries}
            label="Journal entries"
          />
          <StatBubble
            icon={<StarIcon size={16} color="var(--accent)" />}
            value={`$${weeklyStats.moneyTracked.toLocaleString()}`}
            label="Tracked"
          />
        </div>
      </GlassCard>

      {/* Streak Dots */}
      <GlassCard animationDelay={200}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
            }}
          >
            Daily Streak
          </span>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)' as unknown as number,
              color: 'var(--accent)',
            }}
          >
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 var(--space-2)',
          }}
        >
          {streakDays.map((day) => (
            <StreakDot key={day.date} label={day.label} active={day.hasActivity} />
          ))}
        </div>
      </GlassCard>

      {/* Workout Progress (conditional) */}
      {workoutStats && (
        <GlassCard animationDelay={300}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <DumbbellIcon size={18} color="var(--accent)" />
            <span
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-semibold)' as unknown as number,
                color: 'var(--text-primary)',
              }}
            >
              Workout Progress
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 'var(--space-3)',
            }}
          >
            <WorkoutStatItem value={workoutStats.workoutsCount} label="Workouts" />
            <WorkoutStatItem value={workoutStats.totalSets} label="Total Sets" />
            <WorkoutStatItem
              value={`${(workoutStats.totalVolume / 1000).toFixed(1)}k`}
              label="Volume (lbs)"
            />
          </div>
        </GlassCard>
      )}

      {/* Module Completion */}
      {moduleCompletions.length > 0 && (
        <GlassCard animationDelay={workoutStats ? 400 : 300}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <ClockIcon size={18} color="var(--accent)" />
            <span
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-semibold)' as unknown as number,
                color: 'var(--text-primary)',
              }}
            >
              Module Completion
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            {moduleCompletions.map((mod) => (
              <ModuleBar key={mod.cardType} module={mod} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// ── Stat Bubble ──

interface StatBubbleProps {
  icon: React.ReactNode
  value: string | number
  label: string
}

function StatBubble({ icon, value, label }: StatBubbleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-subtle)',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)' as unknown as number,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

// ── Streak Dot ──

interface StreakDotProps {
  label: string
  active: boolean
}

function StreakDot({ label, active }: StreakDotProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-full)',
          background: active ? 'var(--accent)' : 'var(--glass-bg-secondary)',
          border: active ? '2px solid var(--accent)' : '2px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: `background var(--duration-normal) var(--ease-out), border-color var(--duration-normal) var(--ease-out)`,
        }}
      >
        {active && <CheckIcon size={14} color="#0f1219" />}
      </div>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)' as unknown as number,
          color: active ? 'var(--accent)' : 'var(--text-tertiary)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Workout Stat Item ──

interface WorkoutStatItemProps {
  value: string | number
  label: string
}

function WorkoutStatItem({ value, label }: WorkoutStatItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-bold)' as unknown as number,
          color: 'var(--text-primary)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Module Completion Bar ──

interface ModuleBarProps {
  module: ModuleCompletion
}

function ModuleBar({ module }: ModuleBarProps) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-1)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)' as unknown as number,
            color: 'var(--text-primary)',
          }}
        >
          {module.label}
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
          {module.completed}/{module.total} ({module.percentage}%)
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--glass-bg-secondary)',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${module.percentage}%`,
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent)',
            transition: `width var(--duration-settle) var(--ease-out)`,
          }}
        />
      </div>
    </div>
  )
}

// ── Review View ──

interface ReviewViewProps {
  onStartReview: () => void
}

function ReviewView({ onStartReview }: ReviewViewProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <GlassCard variant="elevated" animationDelay={100}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: 'var(--space-4) 0',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-muted)',
            }}
          >
            <StarIcon size={28} color="var(--accent)" />
          </div>

          <div>
            <h3
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-semibold)' as unknown as number,
                color: 'var(--text-primary)',
                margin: '0 0 var(--space-2)',
              }}
            >
              Weekly Review
            </h3>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
                maxWidth: '280px',
                lineHeight: 1.5,
              }}
            >
              Reflect on your week, celebrate wins, and set intentions for the week ahead.
            </p>
          </div>

          <GlassButton
            onClick={onStartReview}
            icon={<ChevronRightIcon size={16} />}
          >
            Start Weekly Review
          </GlassButton>
        </div>
      </GlassCard>

      {/* Tips card */}
      <GlassCard animationDelay={200}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
            }}
          >
            Review Tips
          </span>
          <ReviewTip number={1} text="Be honest with yourself about what worked and what didn't." />
          <ReviewTip number={2} text="Celebrate small wins -- consistency matters more than perfection." />
          <ReviewTip number={3} text="Set 1-2 concrete focus areas for next week, not a laundry list." />
        </div>
      </GlassCard>
    </div>
  )
}

// ── Review Tip ──

interface ReviewTipProps {
  number: number
  text: string
}

function ReviewTip({ number, text }: ReviewTipProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-subtle)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-semibold)' as unknown as number,
          color: 'var(--accent)',
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <span
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  )
}

// ── Review Flow (inside GlassSheet) ──

interface ReviewFlowProps {
  step: number
  reviewState: ReviewState
  onUpdateField: (field: keyof ReviewState) => (value: string) => void
  onNext: () => void
  onBack: () => void
  onComplete: () => void
}

const REVIEW_STEPS: Array<{
  field: keyof ReviewState
  title: string
  prompt: string
  placeholder: string
}> = [
  {
    field: 'wins',
    title: 'Step 1: Wins',
    prompt: 'What went well this week?',
    placeholder: 'I completed all my workouts, stayed consistent with journaling...',
  },
  {
    field: 'challenges',
    title: 'Step 2: Challenges',
    prompt: 'What was challenging?',
    placeholder: 'I struggled with time management on Wednesday, skipped mobility...',
  },
  {
    field: 'nextWeek',
    title: 'Step 3: Next Week',
    prompt: "What's your focus for next week?",
    placeholder: 'Focus on morning routine consistency, hit 4 workouts...',
  },
]

function ReviewFlow({
  step,
  reviewState,
  onUpdateField,
  onNext,
  onBack,
  onComplete,
}: ReviewFlowProps) {
  const currentStep = REVIEW_STEPS[step]
  const isLastStep = step === REVIEW_STEPS.length - 1

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
      }}
    >
      {/* Progress Indicator */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          alignItems: 'center',
        }}
      >
        {REVIEW_STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '3px',
              borderRadius: 'var(--radius-full)',
              background: i <= step ? 'var(--accent)' : 'var(--glass-bg-secondary)',
              transition: `background var(--duration-normal) var(--ease-out)`,
            }}
          />
        ))}
      </div>

      {/* Step Content */}
      <div>
        <h4
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-semibold)' as unknown as number,
            color: 'var(--accent)',
            margin: '0 0 var(--space-1)',
          }}
        >
          {currentStep.title}
        </h4>
        <p
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-medium)' as unknown as number,
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-4)',
          }}
        >
          {currentStep.prompt}
        </p>

        <GlassInput
          value={reviewState[currentStep.field]}
          onChange={onUpdateField(currentStep.field)}
          placeholder={currentStep.placeholder}
          multiline
          rows={5}
        />
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          justifyContent: 'space-between',
        }}
      >
        {step > 0 ? (
          <GlassButton variant="secondary" onClick={onBack}>
            Back
          </GlassButton>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <GlassButton onClick={onComplete}>
            Complete Review
          </GlassButton>
        ) : (
          <GlassButton onClick={onNext}>
            Next
          </GlassButton>
        )}
      </div>
    </div>
  )
}
