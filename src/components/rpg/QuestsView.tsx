'use client'

import React, { useState, type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { useRpg } from '@/hooks/useRpg'
import type { RpgQuest } from '@/lib/db/schema'

type RpgData = ReturnType<typeof useRpg>

export function RpgQuestsView({ rpg }: { rpg: RpgData }) {
  const [filter, setFilter] = useState<'daily' | 'weekly'>('daily')
  const { dailyQuests, weeklyQuests, completedDailyCount, totalDailyCount, questlines } = rpg

  const quests = filter === 'daily' ? dailyQuests : weeklyQuests
  const completedCount = quests.filter((q) => q.status === 'completed').length
  const totalCount = quests.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <FilterChip label="Daily" active={filter === 'daily'} onClick={() => setFilter('daily')} />
        <FilterChip label="Weekly" active={filter === 'weekly'} onClick={() => setFilter('weekly')} />
      </div>

      {/* Quest count */}
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
        {filter === 'daily' ? "Today's" : 'This Week\'s'} Quests ({completedCount}/{totalCount})
      </div>

      {/* Quest list */}
      {quests.length === 0 ? (
        <GlassCard variant="primary" padding="md">
          <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center' as const, padding: 'var(--space-4)' }}>
            {filter === 'daily' ? 'Daily quests will appear when you start using Life OS modules' : 'Weekly quests generate each Monday'}
          </div>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {quests.map((quest) => (
            <QuestItem key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      {/* Questlines */}
      {questlines.length > 0 && (
        <>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 'var(--space-2)' }}>
            Active Questlines
          </div>
          {questlines.map((ql) => {
            const percent = Math.round((ql.currentStep / ql.totalSteps) * 100)
            return (
              <GlassCard key={ql.id} variant="elevated" padding="md">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: '16px' }}>&#x2694;&#xFE0F;</span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{ql.name}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>({ql.currentStep}/{ql.totalSteps})</span>
                </div>
                <div style={progressBarBgStyle}>
                  <div style={{ ...progressBarFillStyle, width: `${percent}%` }} />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                  {percent}% complete
                </div>
              </GlassCard>
            )
          })}
        </>
      )}
    </div>
  )
}

function QuestItem({ quest }: { quest: RpgQuest }) {
  const isComplete = quest.status === 'completed'
  const xpText = Object.entries(quest.xpReward)
    .map(([stat, xp]) => `${xp} ${stat}`)
    .join(' + ')

  return (
    <GlassCard variant={isComplete ? 'completed' : 'primary'} padding="sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ fontSize: '18px', opacity: isComplete ? 0.5 : 1 }}>
          {isComplete ? '\u2705' : '\u2B1C'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: isComplete ? 'var(--completed-text)' : 'var(--text-primary)', textDecoration: isComplete ? 'line-through' : 'none' }}>
            {quest.name}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: isComplete ? 'var(--completed-text)' : 'var(--text-tertiary)', marginTop: '1px' }}>
            {quest.description} &middot; {xpText}
          </div>
        </div>
        {quest.type === 'weekly' && !isComplete && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {quest.currentCount}/{quest.targetCount}
          </span>
        )}
      </div>
    </GlassCard>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: 'var(--radius-full)',
        background: active ? 'var(--accent)' : 'var(--glass-bg-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--glass-border)'}`,
        color: active ? 'var(--text-on-accent)' : 'var(--text-secondary)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

const progressBarBgStyle: CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  background: 'var(--glass-bg-secondary)',
  overflow: 'hidden',
}

const progressBarFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  background: 'var(--accent)',
  transition: 'width var(--duration-normal) var(--ease-out)',
}
