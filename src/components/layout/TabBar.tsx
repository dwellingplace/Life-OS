'use client'

import React, { useCallback } from 'react'
import {
  SunIcon,
  LayersIcon,
  CheckSquareIcon,
  BookIcon,
  BarChartIcon,
  SwordIcon,
} from '@/components/ui/Icons'
import type { TabId } from '@/types'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: 'today', label: 'Today', Icon: SunIcon },
  { id: 'plan', label: 'Plan', Icon: LayersIcon },
  { id: 'tasks', label: 'Tasks', Icon: CheckSquareIcon },
  { id: 'journal', label: 'Journal', Icon: BookIcon },
  { id: 'rpg', label: 'Quest', Icon: SwordIcon },
]

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-tabbar)' as unknown as number,
        background: 'rgba(15, 18, 25, 0.75)',
        backdropFilter: 'blur(var(--blur-heavy))',
        WebkitBackdropFilter: 'blur(var(--blur-heavy))',
        borderTop: '1px solid var(--glass-border)',
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 -8px 32px rgba(0,0,0,0.3)',
        paddingBottom: 'var(--safe-area-bottom)',
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '56px',
          maxWidth: '500px',
          margin: '0 auto',
          padding: '0 var(--space-2)',
        }}
      >
        {tabs.map(({ id, label, Icon }) => (
          <TabButton
            key={id}
            id={id}
            label={label}
            Icon={Icon}
            isActive={activeTab === id}
            onPress={onTabChange}
          />
        ))}
      </div>
    </nav>
  )
}

interface TabButtonProps {
  id: TabId
  label: string
  Icon: React.ComponentType<{ size?: number; color?: string }>
  isActive: boolean
  onPress: (tab: TabId) => void
}

const TabButton = React.memo(function TabButton({
  id,
  label,
  Icon,
  isActive,
  onPress,
}: TabButtonProps) {
  const handleClick = useCallback(() => onPress(id), [id, onPress])

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-label={label}
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        minWidth: 'var(--tap-min)',
        minHeight: 'var(--tap-min)',
        padding: 'var(--space-1) var(--space-2)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: `color var(--duration-fast) var(--ease-smooth)`,
        color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
        position: 'relative',
      }}
    >
      {isActive && (
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '2px',
            borderRadius: '1px',
            background: 'var(--accent)',
            opacity: 0.8,
          }}
          aria-hidden="true"
        />
      )}
      <Icon size={22} />
      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: isActive ? 'var(--weight-semibold)' as unknown as number : 'var(--weight-regular)' as unknown as number,
          lineHeight: 1,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </span>
    </button>
  )
})
