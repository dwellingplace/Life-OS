'use client'

import React, { useState, useCallback, type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { useRpg } from '@/hooks/useRpg'
import { SKILL_TREES, STAT_COLORS, type SkillTreeDefinition, type PerkDefinition } from '@/lib/rpg/engine'
import type { SkillTreeId } from '@/lib/db/schema'

type RpgData = ReturnType<typeof useRpg>

export function RpgSkillTreeView({ rpg }: { rpg: RpgData }) {
  const { perkPoints, unlockedPerks, unlockPerk, character, statNumbers } = rpg
  const [selectedTree, setSelectedTree] = useState<SkillTreeId>('warrior')

  const tree = SKILL_TREES.find((t) => t.id === selectedTree)
  if (!tree) return null

  const unlockedSet = new Set(
    unlockedPerks
      .filter((p) => p.treeId === selectedTree)
      .map((p) => p.perkNumber),
  )

  const canAfford = (perkPoints?.available ?? 0) > 0

  const handleUnlock = useCallback(
    async (perkNumber: number) => {
      if (!canAfford) return
      await unlockPerk(selectedTree, perkNumber)
    },
    [selectedTree, canAfford, unlockPerk],
  )

  const isPerkAvailable = (perk: PerkDefinition): boolean => {
    if (unlockedSet.has(perk.number)) return false
    // Check prereq perks
    if (perk.prereqPerks.length > 0 && !perk.prereqPerks.every((p) => unlockedSet.has(p))) return false
    // Check prereq level
    if (perk.prereqLevel && (character?.level ?? 1) < perk.prereqLevel) return false
    // Check prereq stats
    if (perk.prereqStats && statNumbers) {
      for (const [stat, req] of Object.entries(perk.prereqStats)) {
        if ((statNumbers[stat as keyof typeof statNumbers] ?? 0) < (req ?? 0)) return false
      }
    }
    return true
  }

  const treeColor = STAT_COLORS[tree.stats[0]]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Perk points */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          Skill Trees
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: canAfford ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 600 }}>
          {perkPoints?.available ?? 0} Perk Points
        </span>
      </div>

      {/* Tree selector */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', overflowX: 'auto' as const, paddingBottom: 'var(--space-1)' }}>
        {SKILL_TREES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTree(t.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: selectedTree === t.id ? STAT_COLORS[t.stats[0]] + '30' : 'var(--glass-bg-secondary)',
              border: `1px solid ${selectedTree === t.id ? STAT_COLORS[t.stats[0]] : 'var(--glass-border)'}`,
              color: selectedTree === t.id ? STAT_COLORS[t.stats[0]] : 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontWeight: selectedTree === t.id ? 600 : 400,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Perks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {tree.perks.map((perk) => {
          const isUnlocked = unlockedSet.has(perk.number)
          const isAvailable = isPerkAvailable(perk)

          return (
            <GlassCard
              key={perk.number}
              variant={isUnlocked ? 'completed' : 'primary'}
              padding="sm"
              onClick={isAvailable && canAfford ? () => handleUnlock(perk.number) : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isUnlocked ? treeColor : isAvailable ? treeColor + '30' : 'var(--glass-bg-secondary)',
                  color: isUnlocked ? '#fff' : isAvailable ? treeColor : 'var(--text-tertiary)',
                  border: `2px solid ${isUnlocked ? treeColor : isAvailable ? treeColor : 'var(--glass-border)'}`,
                }}>
                  {isUnlocked ? '\u2713' : perk.number}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: isUnlocked ? 'var(--completed-text)' : 'var(--text-primary)' }}>
                    {perk.name}
                    {perk.type === 'skill' && <span style={{ color: treeColor, marginLeft: '4px', fontSize: 'var(--text-xs)' }}>SKILL</span>}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: isUnlocked ? 'var(--completed-text)' : 'var(--text-tertiary)', marginTop: '1px' }}>
                    {perk.effect}
                  </div>
                </div>
                {isAvailable && canAfford && !isUnlocked && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>
                    Unlock
                  </span>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
