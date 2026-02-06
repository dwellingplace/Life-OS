'use client';

import React, {
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';

export type GlassCardVariant = 'primary' | 'elevated' | 'completed' | 'inProgress';
export type GlassCardPadding = 'sm' | 'md' | 'lg';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: GlassCardVariant;
  padding?: GlassCardPadding;
  onClick?: () => void;
  onLongPress?: () => void;
  animationDelay?: number;
  style?: CSSProperties;
}

const LONG_PRESS_THRESHOLD = 500;

const paddingMap: Record<GlassCardPadding, string> = {
  sm: 'var(--space-3)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
};

const variantStyles: Record<GlassCardVariant, CSSProperties> = {
  primary: {
    background: 'var(--glass-bg-primary)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-inner-glow)',
  },
  elevated: {
    background: 'var(--glass-bg-elevated)',
    border: '1px solid var(--glass-border-strong)',
    boxShadow: 'var(--glass-inner-glow), 0 4px 24px rgba(0, 0, 0, 0.2)',
  },
  completed: {
    background: 'var(--completed-bg)',
    border: '1px solid var(--completed-border)',
    boxShadow: 'var(--glass-inner-glow)',
    color: 'var(--completed-text)',
  },
  inProgress: {
    background: 'var(--glass-bg-primary)',
    border: '1px solid var(--glass-border)',
    borderLeft: '3px solid var(--accent)',
    boxShadow: 'var(--glass-inner-glow)',
  },
};

export function GlassCard({
  children,
  className,
  variant = 'primary',
  padding = 'md',
  onClick,
  onLongPress,
  animationDelay,
  style,
}: GlassCardProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    if (!onLongPress) return;
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, LONG_PRESS_THRESHOLD);
  }, [onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isLongPress.current) return;
    onClick?.();
  }, [onClick]);

  const isInteractive = !!(onClick || onLongPress);

  const baseStyle: CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    backdropFilter: 'blur(var(--blur-light))',
    WebkitBackdropFilter: 'blur(var(--blur-light))',
    padding: paddingMap[padding],
    minHeight: 'var(--tap-min)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    position: 'relative',
    transition: `transform var(--duration-normal) var(--ease-out), box-shadow var(--duration-normal) var(--ease-out), opacity var(--duration-settle) var(--ease-out)`,
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    ...(isInteractive
      ? { cursor: 'pointer' }
      : {}),
    ...(animationDelay !== undefined
      ? {
          opacity: 0,
          transform: 'translateY(8px)',
          animation: `glassCardSettle var(--duration-settle) var(--ease-out) ${animationDelay}ms forwards`,
        }
      : {}),
    ...variantStyles[variant],
    ...style,
  };

  return (
    <>
      <style>{`
        @keyframes glassCardSettle {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes glassCardSettle {
            from { opacity: 1; transform: none; }
            to { opacity: 1; transform: none; }
          }
        }
      `}</style>
      <div
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={isInteractive ? undefined : undefined}
        className={className}
        style={baseStyle}
        onClick={isInteractive ? handleClick : undefined}
        onTouchStart={onLongPress ? handleTouchStart : undefined}
        onTouchEnd={onLongPress ? handleTouchEnd : undefined}
        onTouchMove={onLongPress ? handleTouchMove : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
      >
        {children}
      </div>
    </>
  );
}

export default GlassCard;
