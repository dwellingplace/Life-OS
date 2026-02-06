'use client';

import React, { type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DumbbellIcon, CheckIcon, ChevronRightIcon } from '@/components/ui/Icons';

export interface WorkoutCardProps {
  name: string;
  dayLabel: string;
  exerciseCount: number;
  exercises: string[];
  status: 'pending' | 'in-progress' | 'completed';
  onStart: () => void;
}

export function WorkoutCard({
  name,
  dayLabel,
  exerciseCount,
  exercises,
  status,
  onStart,
}: WorkoutCardProps) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';

  const variant = isCompleted
    ? 'completed' as const
    : isInProgress
      ? 'inProgress' as const
      : 'primary' as const;

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-3)',
  };

  const titleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: isCompleted ? 'var(--completed-text)' : 'var(--text-primary)',
    margin: 0,
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: 'var(--text-tertiary)',
    marginTop: '2px',
  };

  const previewListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    padding: 0,
    margin: 0,
    marginBottom: 'var(--space-4)',
    listStyle: 'none',
  };

  const exerciseItemStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    color: isCompleted ? 'var(--completed-text)' : 'var(--text-secondary)',
    lineHeight: 'var(--leading-normal)',
    paddingLeft: 'var(--space-2)',
  };

  const moreStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-tertiary)',
    paddingLeft: 'var(--space-2)',
  };

  const buttonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-4)',
    background: isCompleted
      ? 'var(--status-success-muted)'
      : isInProgress
        ? 'var(--accent-subtle)'
        : 'var(--accent)',
    color: isCompleted
      ? 'var(--status-success)'
      : isInProgress
        ? 'var(--accent)'
        : '#0f1219',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    cursor: isCompleted ? 'default' : 'pointer',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transition: `transform var(--duration-fast) var(--ease-out)`,
  };

  const previewExercises = exercises.slice(0, 3);
  const remainingCount = exercises.length - 3;

  const buttonLabel = isCompleted
    ? 'Completed'
    : isInProgress
      ? 'Continue Workout'
      : 'Start Workout';

  return (
    <GlassCard variant={variant}>
      <div style={headerStyle}>
        <div>
          <div style={titleRowStyle}>
            <DumbbellIcon size={18} color={isCompleted ? 'var(--completed-text)' : 'var(--accent)'} />
            <h3 style={titleStyle}>{name}</h3>
          </div>
          <div style={subtitleStyle}>
            {dayLabel} &middot; {exerciseCount} exercises
          </div>
        </div>
      </div>

      <ul style={previewListStyle}>
        {previewExercises.map((exercise, idx) => (
          <li key={idx} style={exerciseItemStyle}>
            {exercise}
          </li>
        ))}
        {remainingCount > 0 && (
          <li style={moreStyle}>and {remainingCount} more...</li>
        )}
      </ul>

      <button
        type="button"
        style={buttonStyle}
        onClick={isCompleted ? undefined : onStart}
        disabled={isCompleted}
        aria-label={buttonLabel}
      >
        {isCompleted && <CheckIcon size={16} />}
        {!isCompleted && !isInProgress && <DumbbellIcon size={16} />}
        {isInProgress && <ChevronRightIcon size={16} />}
        {buttonLabel}
      </button>
    </GlassCard>
  );
}

export default WorkoutCard;
