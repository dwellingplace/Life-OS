'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';

export interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function GlassSheet({
  isOpen,
  onClose,
  children,
  title,
  className,
}: GlassSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Trap focus and manage body scroll
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus the sheet after animation starts
      const timer = setTimeout(() => {
        sheetRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 'var(--z-sheet)' as unknown as number,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    animation: 'glassSheetBackdropIn var(--duration-normal) var(--ease-out) forwards',
  };

  const sheetStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '85vh',
    background: 'var(--glass-bg-modal)',
    backdropFilter: 'blur(var(--blur-heavy))',
    WebkitBackdropFilter: 'blur(var(--blur-heavy))',
    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
    border: '1px solid var(--glass-border)',
    borderBottom: 'none',
    boxShadow: 'var(--glass-inner-glow), 0 -8px 40px rgba(0, 0, 0, 0.3)',
    paddingBottom: 'calc(var(--space-6) + var(--safe-area-bottom))',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    outline: 'none',
    animation: 'glassSheetSlideUp var(--duration-slow) var(--ease-out) forwards',
  };

  const handleStyle: CSSProperties = {
    width: '36px',
    height: '4px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--glass-border-strong)',
    margin: 'var(--space-3) auto var(--space-2)',
    flexShrink: 0,
  };

  const headerStyle: CSSProperties = {
    padding: '0 var(--space-5) var(--space-4)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    lineHeight: 'var(--leading-tight)',
  };

  const contentStyle: CSSProperties = {
    padding: '0 var(--space-5)',
  };

  return (
    <>
      <style>{`
        @keyframes glassSheetBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glassSheetSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes glassSheetBackdropIn {
            from { opacity: 1; }
            to { opacity: 1; }
          }
          @keyframes glassSheetSlideUp {
            from { transform: none; opacity: 1; }
            to { transform: none; opacity: 1; }
          }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
        style={backdropStyle}
        onClick={handleBackdropClick}
      >
        <div
          ref={sheetRef}
          className={className}
          style={sheetStyle}
          tabIndex={-1}
        >
          {/* Drag handle indicator */}
          <div style={handleStyle} aria-hidden="true" />

          {title && <div style={headerStyle}>{title}</div>}

          <div style={contentStyle}>{children}</div>
        </div>
      </div>
    </>
  );
}

export default GlassSheet;
