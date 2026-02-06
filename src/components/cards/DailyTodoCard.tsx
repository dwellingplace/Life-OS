'use client';

import React, { type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Checkbox } from '@/components/ui/Checkbox';
import { ChevronRightIcon } from '@/components/ui/Icons';

export interface DailyTask {
  id: string;
  title: string;
  priority: 1 | 2 | 3;
  dueTime?: string;
  isCompleted: boolean;
}

export interface DailyTodoCardProps {
  tasks: DailyTask[];
  onToggleTask: (id: string) => void;
  onViewAll: () => void;
}

const priorityStyles: Record<1 | 2 | 3, CSSProperties> = {
  1: {
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-primary)',
  },
  2: {
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: 'var(--text-primary)',
  },
  3: {
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: 'var(--text-tertiary)',
  },
};

export function DailyTodoCard({
  tasks,
  onToggleTask,
  onViewAll,
}: DailyTodoCardProps) {
  const completedCount = tasks.filter((t) => t.isCompleted).length;

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

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 'var(--tap-min)',
  };

  const labelAreaStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  };

  const timeBadgeStyle: CSSProperties = {
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

  const viewAllStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2)',
    marginTop: 'var(--space-1)',
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

  return (
    <GlassCard>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Daily To-Do</h3>
        <span style={countStyle}>
          {completedCount}/{tasks.length}
        </span>
      </div>

      <ul style={listStyle}>
        {tasks.map((task) => {
          const taskTitleStyle: CSSProperties = {
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            ...(task.isCompleted
              ? {
                  color: 'var(--text-tertiary)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'var(--text-tertiary)',
                  fontWeight: 'var(--weight-regular)' as unknown as number,
                }
              : priorityStyles[task.priority]),
          };

          return (
            <li key={task.id} style={itemStyle}>
              <div style={labelAreaStyle}>
                <Checkbox
                  checked={task.isCompleted}
                  onChange={() => onToggleTask(task.id)}
                  size="sm"
                />
                <span style={taskTitleStyle}>{task.title}</span>
              </div>
              {task.dueTime && (
                <span style={timeBadgeStyle}>{task.dueTime}</span>
              )}
            </li>
          );
        })}
      </ul>

      <button type="button" style={viewAllStyle} onClick={onViewAll}>
        View all tasks
        <ChevronRightIcon size={14} />
      </button>
    </GlassCard>
  );
}

export default DailyTodoCard;
