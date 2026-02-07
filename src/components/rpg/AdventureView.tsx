'use client'

import React, { useState, type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { useRpg } from '@/hooks/useRpg'
import type { RpgEncounter } from '@/lib/db/schema'
import { RpgBattleView } from './BattleView'

type RpgData = ReturnType<typeof useRpg>

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#EAB308',
  hard: '#EF4444',
  boss: '#A855F7',
}

export function RpgAdventureView({ rpg }: { rpg: RpgData }) {
  const { encounters } = rpg
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null)

  if (activeEncounterId) {
    return (
      <RpgBattleView
        encounterId={activeEncounterId}
        onExit={() => setActiveEncounterId(null)}
      />
    )
  }

  const pendingEncounters = encounters.filter((e) => e.status === 'pending' || e.status === 'active')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
        Available Encounters ({pendingEncounters.length}/3)
      </div>

      {pendingEncounters.length === 0 ? (
        <GlassCard variant="primary" padding="lg">
          <div style={{ textAlign: 'center' as const, padding: 'var(--space-6) 0' }}>
            <div style={{ fontSize: '40px', marginBottom: 'var(--space-3)' }}>&#x1F6E1;&#xFE0F;</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              No enemies in sight
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              Complete activities to spawn encounters
            </div>
          </div>
        </GlassCard>
      ) : (
        pendingEncounters.map((encounter) => (
          <EncounterCard
            key={encounter.id}
            encounter={encounter}
            onFight={() => setActiveEncounterId(encounter.id)}
          />
        ))
      )}

      {/* Info card */}
      <GlassCard variant="primary" padding="md">
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Encounters spawn when you complete activities like workouts, tasks, and journal entries.
          Max 3 at a time. They expire after 48 hours — no penalty for skipping.
        </div>
      </GlassCard>
    </div>
  )
}

function EncounterCard({ encounter, onFight }: { encounter: RpgEncounter; onFight: () => void }) {
  const diffColor = DIFFICULTY_COLORS[encounter.difficulty] ?? 'var(--text-secondary)'
  const hoursLeft = Math.max(0, Math.round((new Date(encounter.expiresAt).getTime() - Date.now()) / 3600000))

  return (
    <GlassCard variant="elevated" padding="md" onClick={onFight}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={enemyIconStyle}>
          <span style={{ fontSize: '28px' }}>{getEnemyEmoji(encounter.enemyId)}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            {encounter.enemyName}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '2px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: diffColor, fontWeight: 600, textTransform: 'capitalize' as const }}>
              {encounter.difficulty}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              &middot; {hoursLeft}h left
            </span>
          </div>
        </div>
        <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
          Fight &#x2192;
        </div>
      </div>
    </GlassCard>
  )
}

function getEnemyEmoji(enemyId: string): string {
  const map: Record<string, string> = {
    chaos_gremlin: '\uD83D\uDC79',
    fatigue_beast: '\uD83D\uDC09',
    tension_wraith: '\uD83D\uDC7B',
    budget_bandit: '\uD83E\uDD78',
    signal_goblin: '\uD83D\uDC7A',
    doubt_shade: '\uD83C\uDF11',
    procrastination_hydra: '\uD83D\uDC32',
    entropy_lord: '\uD83D\uDD25',
  }
  return map[enemyId] ?? '\u2753'
}

const enemyIconStyle: CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--glass-bg-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
