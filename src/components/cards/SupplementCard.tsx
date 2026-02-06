'use client';

import React, { type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Checkbox } from '@/components/ui/Checkbox';

export interface SupplementItem {
  id: string;
  name: string;
  dosage: string;
  timing?: string;
  isChecked: boolean;
}

export interface SupplementCardProps {
  title: string;
  items: SupplementItem[];
  onToggleItem: (id: string) => void;
}

export function SupplementCard({
  title,
  items,
  onToggleItem,
}: SupplementCardProps) {
  const checkedCount = items.filter((i) => i.isChecked).length;

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

  const countStyle: CSSProperties = {
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

  const itemStyle = (isChecked: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 'var(--tap-min)',
    transition: `opacity var(--duration-fast) var(--ease-out)`,
  });

  const labelAreaStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  };

  const nameStyle = (isChecked: boolean): CSSProperties => ({
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    color: isChecked ? 'var(--text-tertiary)' : 'var(--text-primary)',
    textDecoration: isChecked ? 'line-through' : 'none',
    textDecorationColor: 'var(--text-tertiary)',
    transition: `color var(--duration-fast) var(--ease-out)`,
  });

  const dosageStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-tertiary)',
    marginLeft: 'var(--space-2)',
    flexShrink: 0,
  };

  const timingStyle: CSSProperties = {
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
        <span style={countStyle}>
          {checkedCount}/{items.length}
        </span>
      </div>

      <ul style={listStyle}>
        {items.map((item) => (
          <li key={item.id} style={itemStyle(item.isChecked)}>
            <div style={labelAreaStyle}>
              <Checkbox
                checked={item.isChecked}
                onChange={() => onToggleItem(item.id)}
                size="sm"
              />
              <span style={nameStyle(item.isChecked)}>{item.name}</span>
              <span style={dosageStyle}>{item.dosage}</span>
            </div>
            {item.timing && <span style={timingStyle}>{item.timing}</span>}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export default SupplementCard;
