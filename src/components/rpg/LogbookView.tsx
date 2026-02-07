'use client'

import React, { type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { useRpg } from '@/hooks/useRpg'
import type { RpgLogEntry } from '@/lib/db/schema'

type RpgData = ReturnType<typeof useRpg>

const TYPE_ICONS: Record<string, string> = {
  level_up: '\u2B06\uFE0F',
  stat_up: '\uD83D\uDCC8',
  quest_complete: '\uD83D\uDCDC',
  battle: '\u2694\uFE0F',
  achievement: '\uD83C\uDFC6',
  loot: '\uD83C\uDF81',
  perk: '\u2728',
}

const TYPE_COLORS: Record<string, string> = {
  level_up: '#F59E0B',
  stat_up: '#22C55E',
  quest_complete: '#3B82F6',
  battle: '#EF4444',
  achievement: '#A855F7',
  loot: '#EAB308',
  perk: '#14B8A6',
}

export function RpgLogbookView({ rpg }: { rpg: RpgData }) {
  const { logEntries } = rpg

  // Group entries by date
  const grouped = groupByDate(logEntries)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
        Adventure Log
      </div>

      {logEntries.length === 0 ? (
        <GlassCard variant="primary" padding="lg">
          <div style={{ textAlign: 'center' as const, padding: 'var(--space-4) 0' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>&#x1F4D6;</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              Your story begins here
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              Complete activities to fill your logbook
            </div>
          </div>
        </GlassCard>
      ) : (
        Object.entries(grouped).map(([dateLabel, entries]) => (
          <div key={dateLabel}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 'var(--space-2)', letterSpacing: '0.05em' }}>
              {dateLabel}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {entries.map((entry) => (
                <LogItem key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function LogItem({ entry }: { entry: RpgLogEntry }) {
  const icon = TYPE_ICONS[entry.type] ?? '\u2022'
  const color = TYPE_COLORS[entry.type] ?? 'var(--text-secondary)'
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <div style={logItemStyle}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
          {entry.title}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {entry.description}
        </div>
      </div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
        {time}
      </span>
    </div>
  )
}

function groupByDate(entries: RpgLogEntry[]): Record<string, RpgLogEntry[]> {
  const groups: Record<string, RpgLogEntry[]> = {}
  const todayStr = new Date().toISOString().slice(0, 10)
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10)

  for (const entry of entries) {
    const dateStr = entry.timestamp.slice(0, 10)
    let label: string
    if (dateStr === todayStr) label = 'Today'
    else if (dateStr === yesterdayStr) label = 'Yesterday'
    else label = new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  }
  return groups
}

const logItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--glass-bg-primary)',
  border: '1px solid var(--glass-border)',
}
