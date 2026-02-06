'use client'

import React from 'react'
import Header from '@/components/layout/Header'

interface PlaceholderScreenProps {
  title: string
  subtitle: string
  icon: string
  description: string
}

export default function PlaceholderScreen({
  title,
  subtitle,
  icon,
  description,
}: PlaceholderScreenProps) {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Header title={title} subtitle={subtitle} syncStatus="synced" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-16) var(--space-6)',
          textAlign: 'center',
          minHeight: '60vh',
        }}
      >
        <span
          style={{
            fontSize: '48px',
            marginBottom: 'var(--space-4)',
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
          }}
        >
          {icon}
        </span>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-semibold)' as unknown as number,
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-2)',
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            margin: 0,
            maxWidth: '280px',
            lineHeight: 'var(--leading-relaxed)',
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 400ms both',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
