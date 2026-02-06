'use client';

import React, { type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Checkbox } from '@/components/ui/Checkbox';
import { StarIcon } from '@/components/ui/Icons';

export interface Top3Task {
  id: string;
  title: string;
  priority: 1 | 2 | 3;
  dueTime?: string;
  isCompleted: boolean;
}

export interface Top3CardProps {
  tasks: Top3Task[];
  onToggleTask: (id: string) => void;
}

export function Top3Card({ tasks, onToggleTask }: Top3CardProps) {
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-3)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-bold)' as unknown as number,
    color: 'var(--text-primary)',
    margin: 0,
  };

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  };

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    minHeight: 'var(--tap-min)',
  };

  const taskTitleStyle = (isCompleted: boolean): CSSProperties => ({
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
    textDecoration: isCompleted ? 'line-through' : 'none',
    textDecorationColor: 'var(--text-tertiary)',
    opacity: isCompleted ? 0.6 : 1,
    transition: `color var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out)`,
  });

  const displayTasks = tasks.slice(0, 3);

  return (
    <GlassCard variant="elevated">
      <div style={headerStyle}>
        <StarIcon size={18} color="var(--accent)" />
        <h3 style={titleStyle}>Top 3</h3>
      </div>

      <ul style={listStyle}>
        {displayTasks.map((task) => (
          <li key={task.id} style={itemStyle}>
            <Checkbox
              checked={task.isCompleted}
              onChange={() => onToggleTask(task.id)}
              size="md"
            />
            <span style={taskTitleStyle(task.isCompleted)}>{task.title}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export default Top3Card;
