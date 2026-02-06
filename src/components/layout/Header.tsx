'use client'

import React from 'react'
import { SearchIcon, SettingsIcon } from '@/components/ui/Icons'

interface HeaderProps {
  title: string
  subtitle?: string
  syncStatus?: 'synced' | 'syncing' | 'offline'
  onSearchPress?: () => void
  onSettingsPress?: () => void
}

const syncConfig = {
  synced: { label: 'Synced', color: 'var(--status-success)', dot: true },
  syncing: { label: 'Syncing...', color: 'var(--accent)', dot: true },
  offline: { label: 'Offline', color: 'var(--text-tertiary)', dot: false },
} as const

export default function Header({
  title,
  subtitle,
  syncStatus = 'synced',
  onSearchPress,
  onSettingsPress,
}: HeaderProps) {
  const sync = syncConfig[syncStatus]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)' as unknown as number,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `var(--space-3) var(--space-5)`,
        minHeight: 'var(--header-height)',
        background: 'rgba(15, 18, 25, 0.6)',
        backdropFilter: 'blur(var(--blur-medium))',
        WebkitBackdropFilter: 'blur(var(--blur-medium))',
        borderBottom: '1px solid var(--glass-border)',
      }}
    >
      {/* Left: Title + Sync */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <h1
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {title}
          </h1>
          {/* Sync Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--glass-bg-secondary)',
              border: '1px solid var(--glass-border)',
              fontSize: 'var(--text-xs)',
              color: sync.color,
              lineHeight: 1,
            }}
            role="status"
            aria-label={`Sync status: ${sync.label}`}
          >
            {sync.dot && (
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: sync.color,
                  ...(syncStatus === 'syncing'
                    ? { animation: 'glow-pulse 1.5s ease-in-out infinite' }
                    : {}),
                }}
                aria-hidden="true"
              />
            )}
            {sync.label}
          </div>
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        {onSearchPress && (
          <button
            onClick={onSearchPress}
            aria-label="Search"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'var(--tap-min)',
              height: 'var(--tap-min)',
              borderRadius: 'var(--radius-md)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <SearchIcon size={20} />
          </button>
        )}
        {onSettingsPress && (
          <button
            onClick={onSettingsPress}
            aria-label="Settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'var(--tap-min)',
              height: 'var(--tap-min)',
              borderRadius: 'var(--radius-md)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <SettingsIcon size={20} />
          </button>
        )}
      </div>
    </header>
  )
}
