'use client';

import React, { type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { BriefcaseIcon, ChevronRightIcon } from '@/components/ui/Icons';

export interface WorkFocusCardProps {
  items: string[];
  onViewAll: () => void;
}

export function WorkFocusCard({ items, onViewAll }: WorkFocusCardProps) {
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-3)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-primary)',
    margin: 0,
  };

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  };

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    lineHeight: 'var(--leading-normal)',
  };

  const bulletStyle: CSSProperties = {
    width: 5,
    height: 5,
    borderRadius: 'var(--radius-full)',
    background: 'var(--accent)',
    flexShrink: 0,
    marginTop: '7px',
  };

  const viewAllStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2)',
    marginTop: 'var(--space-2)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--accent)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    transition: `color var(--duration-fast) var(--ease-out)`,
  };

  const displayItems = items.slice(0, 3);

  return (
    <GlassCard>
      <div style={headerStyle}>
        <BriefcaseIcon size={18} color="var(--accent)" />
        <h3 style={titleStyle}>Work Focus</h3>
      </div>

      <ul style={listStyle}>
        {displayItems.map((item, idx) => (
          <li key={idx} style={itemStyle}>
            <span style={bulletStyle} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <button type="button" style={viewAllStyle} onClick={onViewAll}>
        View all
        <ChevronRightIcon size={14} />
      </button>
    </GlassCard>
  );
}

export default WorkFocusCard;
