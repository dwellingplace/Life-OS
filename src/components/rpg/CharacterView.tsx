'use client'

import React, { type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { useRpg } from '@/hooks/useRpg'
import { statLevelFromXp } from '@/lib/rpg/engine'

type RpgData = ReturnType<typeof useRpg>

export function RpgCharacterView({ rpg }: { rpg: RpgData }) {
  const { character, levelInfo, statLevels, statNumbers, secondaryStats, equippedTruths, STAT_COLORS, STAT_NAMES, ALL_STATS } = rpg

  if (!character || !statNumbers || !statLevels) return null

  const xpPercent = levelInfo.nextLevelXp > 0
    ? Math.round((levelInfo.currentLevelXp / levelInfo.nextLevelXp) * 100)
    : 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Avatar + Level */}
      <GlassCard variant="elevated" padding="lg">
        <div style={avatarSectionStyle}>
          <div style={{ ...avatarCircleStyle, borderColor: character.auraColor, boxShadow: `0 0 20px ${character.auraColor}40` }}>
            <span style={{ fontSize: '32px' }}>&#x2694;&#xFE0F;</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Level {character.level}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {character.title}
            </div>
          </div>
          {/* XP Bar */}
          <div style={xpBarContainerStyle}>
            <div style={{ ...xpBarFillStyle, width: `${xpPercent}%` }} />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            {levelInfo.currentLevelXp.toLocaleString()} / {levelInfo.nextLevelXp.toLocaleString()} XP to Level {character.level + 1}
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <GlassCard variant="primary" padding="md">
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
          Stats
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {ALL_STATS.map((stat) => {
            const level = statNumbers[stat] ?? 1
            const sl = statLevels[stat]
            const info = sl ? statLevelFromXp(sl.totalXp) : { currentXp: 0, nextXp: 100 }
            const percent = info.nextXp > 0 ? Math.round((info.currentXp / info.nextXp) * 100) : 100
            return (
              <div key={stat} style={statRowStyle}>
                <span style={{ color: STAT_COLORS[stat], fontWeight: 600, fontSize: 'var(--text-sm)', width: '32px' }}>
                  {stat}
                </span>
                <div style={statBarBgStyle}>
                  <div style={{ ...statBarFillStyle, width: `${Math.min(100, (level / 50) * 100)}%`, background: STAT_COLORS[stat] }} />
                </div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--text-sm)', width: '24px', textAlign: 'right' as const }}>
                  {level}
                </span>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* Secondary Stats */}
      {secondaryStats && (
        <GlassCard variant="primary" padding="md">
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
            Combat Stats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <SecondaryStatItem label="HP" value={secondaryStats.hp} color="#EF4444" />
            <SecondaryStatItem label="Energy" value={secondaryStats.energy} color="#14B8A6" />
            <SecondaryStatItem label="Crit %" value={`${secondaryStats.crit.toFixed(1)}%`} color="#F59E0B" />
            <SecondaryStatItem label="Resistance" value={secondaryStats.resistance} color="#7C3AED" />
          </div>
        </GlassCard>
      )}

      {/* Equipped Truths */}
      <GlassCard variant="primary" padding="md">
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
          Equipped Truths
        </div>
        {equippedTruths.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
            Star journal insights to collect truths you can equip
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {equippedTruths.map((truth, i) => (
              <div key={truth.id} style={truthSlotStyle}>
                <span style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)' }}>{i + 1}.</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', flex: 1 }}>
                  &quot;{truth.text}&quot;
                </span>
              </div>
            ))}
            {Array.from({ length: 3 - equippedTruths.length }).map((_, i) => (
              <div key={`empty-${i}`} style={truthSlotStyle}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{equippedTruths.length + i + 1}.</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>Empty Slot</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function SecondaryStatItem({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg-secondary)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{label}</span>
      <span style={{ color, fontWeight: 600, fontSize: 'var(--text-sm)' }}>{value}</span>
    </div>
  )
}

const avatarSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
}

const avatarCircleStyle: CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  border: '3px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--glass-bg-elevated)',
}

const xpBarContainerStyle: CSSProperties = {
  width: '100%',
  height: '8px',
  borderRadius: '4px',
  background: 'var(--glass-bg-secondary)',
  overflow: 'hidden',
}

const xpBarFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  background: '#3B82F6',
  transition: 'width var(--duration-normal) var(--ease-out)',
}

const statRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
}

const statBarBgStyle: CSSProperties = {
  flex: 1,
  height: '6px',
  borderRadius: '3px',
  background: 'var(--glass-bg-secondary)',
  overflow: 'hidden',
}

const statBarFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  transition: 'width var(--duration-normal) var(--ease-out)',
}

const truthSlotStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  padding: 'var(--space-2)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--glass-bg-secondary)',
}
