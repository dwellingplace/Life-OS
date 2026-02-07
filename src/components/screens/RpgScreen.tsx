'use client'

import React, { useState, type CSSProperties } from 'react'
import { useRpg } from '@/hooks/useRpg'
import Header from '@/components/layout/Header'
import { RpgCharacterView } from '@/components/rpg/CharacterView'
import { RpgQuestsView } from '@/components/rpg/QuestsView'
import { RpgAdventureView } from '@/components/rpg/AdventureView'
import { RpgLogbookView } from '@/components/rpg/LogbookView'
import { RpgSkillTreeView } from '@/components/rpg/SkillTreeView'

type RpgSubTab = 'character' | 'quests' | 'adventure' | 'skills' | 'logbook'

interface RpgScreenProps {
  onSearchPress?: () => void
}

export default function RpgScreen({ onSearchPress }: RpgScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<RpgSubTab>('character')
  const rpg = useRpg()

  if (!rpg.character) {
    return (
      <div style={containerStyle}>
        <Header title="Life Quest" onSearchPress={onSearchPress} />
        <div style={loadingStyle}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
            Initializing your adventure...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <Header title="Life Quest" onSearchPress={onSearchPress} />

      {/* Sub-tab navigation */}
      <div style={subTabBarStyle}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              ...subTabStyle,
              color: activeSubTab === tab.id ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: activeSubTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeSubTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div style={contentStyle}>
        {activeSubTab === 'character' && <RpgCharacterView rpg={rpg} />}
        {activeSubTab === 'quests' && <RpgQuestsView rpg={rpg} />}
        {activeSubTab === 'adventure' && <RpgAdventureView rpg={rpg} />}
        {activeSubTab === 'skills' && <RpgSkillTreeView rpg={rpg} />}
        {activeSubTab === 'logbook' && <RpgLogbookView rpg={rpg} />}
      </div>
    </div>
  )
}

const SUB_TABS: { id: RpgSubTab; label: string }[] = [
  { id: 'character', label: 'Character' },
  { id: 'quests', label: 'Quests' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'skills', label: 'Skills' },
  { id: 'logbook', label: 'Log' },
]

const containerStyle: CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const loadingStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const subTabBarStyle: CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid var(--glass-border)',
  paddingLeft: 'var(--space-2)',
  paddingRight: 'var(--space-2)',
  background: 'rgba(15, 18, 25, 0.5)',
  backdropFilter: 'blur(var(--blur-light))',
  flexShrink: 0,
}

const subTabStyle: CSSProperties = {
  flex: 1,
  padding: 'var(--space-3) var(--space-2)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-sans)',
  transition: 'color var(--duration-fast) var(--ease-smooth)',
  WebkitTapHighlightColor: 'transparent',
}

const contentStyle: CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 'var(--space-4)',
  paddingBottom: 'calc(var(--space-4) + 80px)',
}
