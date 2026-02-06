'use client';

import React, { type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Checkbox } from '@/components/ui/Checkbox';

export interface MobilityItem {
  id: string;
  name: string;
  duration: string;
  durationSeconds: number;
  isCompleted: boolean;
}

export interface MobilityCardProps {
  title: string;
  items: MobilityItem[];
  onToggleItem: (id: string) => void;
}

export function MobilityCard({ title, items, onToggleItem }: MobilityCardProps) {
  const completedCount = items.filter((i) => i.isCompleted).length;

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-3)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-primary)',
    margin: 0,
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: 'var(--text-tertiary)',
  };

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  };

  const itemStyle = (isCompleted: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 'var(--tap-min)',
    opacity: isCompleted ? 0.5 : 1,
    transition: `opacity var(--duration-fast) var(--ease-out)`,
  });

  const durationStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--text-tertiary)',
    background: 'var(--glass-bg-secondary)',
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    marginLeft: 'var(--space-2)',
  };

  return (
    <GlassCard>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{title}</h3>
        <span style={subtitleStyle}>
          {completedCount}/{items.length}
        </span>
      </div>

      <ul style={listStyle}>
        {items.map((item) => (
          <li key={item.id} style={itemStyle(item.isCompleted)}>
            <Checkbox
              checked={item.isCompleted}
              onChange={() => onToggleItem(item.id)}
              label={item.name}
              size="sm"
            />
            <span style={durationStyle}>{item.duration}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export default MobilityCard;
