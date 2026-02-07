'use client'

import React, { useEffect, type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useRpgBattle } from '@/hooks/useRpgBattle'
import type { BattleAction } from '@/lib/db/schema'

interface BattleViewProps {
  encounterId: string
  onExit: () => void
}

export function RpgBattleView({ encounterId, onExit }: BattleViewProps) {
  const { encounter, turns, isProcessing, lastResult, start, executeAction } = useRpgBattle(encounterId)

  // Auto-start if pending
  useEffect(() => {
    if (encounter?.status === 'pending') {
      start()
    }
  }, [encounter?.status, start])

  if (!encounter) {
    return (
      <div style={{ textAlign: 'center' as const, padding: 'var(--space-6)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading encounter...</p>
      </div>
    )
  }

  const isOver = encounter.status === 'victory' || encounter.status === 'defeat'

  // Victory / Defeat screen
  if (isOver) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', paddingTop: 'var(--space-6)' }}>
        <div style={{ fontSize: '64px', animation: 'settle-in var(--duration-settle) var(--ease-out)' }}>
          {encounter.status === 'victory' ? '\uD83C\uDF1F' : '\uD83D\uDCA8'}
        </div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: encounter.status === 'victory' ? '#F59E0B' : '#EF4444' }}>
          {encounter.status === 'victory' ? 'Victory!' : 'Defeated'}
        </div>
        {encounter.status === 'victory' && (
          <GlassCard variant="elevated" padding="md">
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Battle Rewards
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {encounter.loot.map((loot, i) => (
                  <div key={i} style={{ fontSize: 'var(--text-sm)', color: '#F59E0B' }}>
                    {loot.amount && `+${loot.amount} `}{loot.stat ?? ''} {loot.type.replace('_', ' ')}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {encounter.turnsElapsed} turns
        </div>
        <button onClick={onExit} style={returnButtonStyle}>
          Return to Adventure
        </button>
      </div>
    )
  }

  const playerHpPct = Math.max(0, Math.round((encounter.playerHp / encounter.playerMaxHp) * 100))
  const enemyHpPct = Math.max(0, Math.round((encounter.enemyHp / encounter.enemyMaxHp) * 100))
  const energyPct = Math.max(0, Math.round((encounter.playerEnergy / encounter.playerMaxEnergy) * 100))

  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Back button */}
      <button onClick={onExit} style={backButtonStyle}>
        &#x2190; Flee (no penalty)
      </button>

      {/* Enemy */}
      <GlassCard variant="elevated" padding="md">
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>
            {getEnemyEmoji(encounter.enemyId)}
          </div>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            {encounter.enemyName}
          </div>
          <div style={{ marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
              <span>HP</span>
              <span>{encounter.enemyHp}/{encounter.enemyMaxHp}</span>
            </div>
            <div style={hpBarBgStyle}>
              <div style={{ ...hpBarFillStyle, width: `${enemyHpPct}%`, background: '#EF4444' }} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Battle Log (last action) */}
      {lastTurn && (
        <div style={battleLogStyle}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            You used <strong>{lastTurn.playerAction}</strong>
            {lastTurn.playerDamageDealt > 0 && ` for ${lastTurn.playerDamageDealt} damage`}
            {lastTurn.isCrit && <span style={{ color: '#F59E0B' }}> CRIT!</span>}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Enemy used <strong>{lastTurn.enemyAction}</strong>
            {lastTurn.enemyDamageDealt > 0 && ` for ${lastTurn.enemyDamageDealt} damage`}
          </div>
        </div>
      )}

      {/* Player */}
      <GlassCard variant="primary" padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>You</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Turn {encounter.turnsElapsed}</span>
        </div>
        {/* HP Bar */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
            <span>HP</span>
            <span>{encounter.playerHp}/{encounter.playerMaxHp}</span>
          </div>
          <div style={hpBarBgStyle}>
            <div style={{ ...hpBarFillStyle, width: `${playerHpPct}%`, background: playerHpPct > 30 ? '#22C55E' : '#EF4444' }} />
          </div>
        </div>
        {/* Energy Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
            <span>Energy</span>
            <span>{encounter.playerEnergy}/{encounter.playerMaxEnergy}</span>
          </div>
          <div style={hpBarBgStyle}>
            <div style={{ ...hpBarFillStyle, width: `${energyPct}%`, background: '#14B8A6' }} />
          </div>
        </div>
      </GlassCard>

      {/* Action Buttons */}
      <div style={actionGridStyle}>
        <ActionButton label="Attack" description="Basic attack" onClick={() => executeAction('attack')} disabled={isProcessing} color="var(--accent)" />
        <ActionButton label="Defend" description="-50% damage, +5 EN" onClick={() => executeAction('defend')} disabled={isProcessing} color="#6B7280" />
        <ActionButton label="Skill" description="Stat×2, 15 EN" onClick={() => executeAction('skill')} disabled={isProcessing || encounter.playerEnergy < 15} color="#7C3AED" />
        <ActionButton label="Truth" description="WIS attack + heal" onClick={() => executeAction('truth')} disabled={isProcessing} color="#EAB308" />
      </div>
    </div>
  )
}

function ActionButton({ label, description, onClick, disabled, color }: {
  label: string; description: string; onClick: () => void; disabled: boolean; color: string
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...actionButtonStyle, borderColor: disabled ? 'var(--glass-border)' : color, opacity: disabled ? 0.4 : 1 }}>
      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: disabled ? 'var(--text-tertiary)' : color }}>{label}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{description}</span>
    </button>
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

const backButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-tertiary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
  padding: 'var(--space-2)',
  textAlign: 'left' as const,
  WebkitTapHighlightColor: 'transparent',
}

const battleLogStyle: CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--glass-bg-secondary)',
  border: '1px solid var(--glass-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const hpBarBgStyle: CSSProperties = {
  width: '100%',
  height: '8px',
  borderRadius: '4px',
  background: 'var(--glass-bg-secondary)',
  overflow: 'hidden',
}

const hpBarFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width var(--duration-normal) var(--ease-out)',
}

const actionGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-2)',
}

const actionButtonStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--glass-bg-primary)',
  border: '1px solid',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  minHeight: 'var(--tap-min)',
  WebkitTapHighlightColor: 'transparent',
  transition: 'opacity var(--duration-fast) var(--ease-smooth)',
}

const returnButtonStyle: CSSProperties = {
  padding: 'var(--space-3) var(--space-6)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--accent)',
  border: 'none',
  color: 'var(--text-on-accent)',
  fontWeight: 600,
  fontSize: 'var(--text-base)',
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
  marginTop: 'var(--space-4)',
  WebkitTapHighlightColor: 'transparent',
}
