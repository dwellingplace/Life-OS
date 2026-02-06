'use client';

import React, { useState, type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DollarIcon } from '@/components/ui/Icons';

const CATEGORIES = [
  'Groceries',
  'Dining',
  'Transport',
  'Bills',
  'Personal',
  'Other',
] as const;

export interface MoneyMinuteCardProps {
  onSave: (amount: number, category: string, note: string) => void;
}

export function MoneyMinuteCard({ onSave }: MoneyMinuteCardProps) {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0 && selectedCategory) {
      onSave(parsedAmount, selectedCategory, note);
      setAmount('');
      setSelectedCategory('');
      setNote('');
    }
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
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
    color: 'var(--text-primary)',
    margin: 0,
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-tertiary)',
  };

  const amountRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    marginBottom: 'var(--space-3)',
  };

  const dollarPrefixStyle: CSSProperties = {
    fontSize: 'var(--text-xl)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-secondary)',
    lineHeight: 1,
  };

  const amountInputStyle: CSSProperties = {
    flex: 1,
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--glass-border-strong)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-xl)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'textfield' as CSSProperties['MozAppearance'],
    transition: `border-color var(--duration-fast) var(--ease-out)`,
  };

  const chipsRowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-3)',
  };

  const chipStyle = (isSelected: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transition: `background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)`,
    ...(isSelected
      ? {
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
          boxShadow: '0 0 12px rgba(92, 224, 214, 0.15)',
          border: '1px solid var(--accent-muted)',
        }
      : {
          background: 'var(--glass-bg-secondary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--glass-border)',
        }),
  });

  const noteInputStyle: CSSProperties = {
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--glass-bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    marginBottom: 'var(--space-3)',
    boxSizing: 'border-box' as const,
    WebkitAppearance: 'none',
    transition: `border-color var(--duration-fast) var(--ease-out)`,
  };

  const saveBtnStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-4)',
    background: amount && selectedCategory ? 'var(--accent)' : 'var(--glass-bg-secondary)',
    color: amount && selectedCategory ? '#0f1219' : 'var(--text-tertiary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    cursor: amount && selectedCategory ? 'pointer' : 'default',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transition: `background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)`,
  };

  return (
    <GlassCard>
      <style>{`
        .money-amount-input:focus {
          border-color: var(--accent) !important;
        }
        .money-amount-input::placeholder {
          color: var(--text-tertiary);
        }
        .money-amount-input::-webkit-outer-spin-button,
        .money-amount-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .money-note-input:focus {
          border-color: var(--accent-muted) !important;
        }
        .money-note-input::placeholder {
          color: var(--text-tertiary);
        }
      `}</style>

      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <DollarIcon size={18} color="var(--accent)" />
          <h3 style={titleStyle}>Money Minute</h3>
        </div>
        <span style={subtitleStyle}>&lt; 60 sec</span>
      </div>

      <div style={amountRowStyle}>
        <span style={dollarPrefixStyle}>$</span>
        <input
          className="money-amount-input"
          type="number"
          inputMode="decimal"
          style={amountInputStyle}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          aria-label="Amount"
          min="0"
          step="0.01"
        />
      </div>

      <div style={chipsRowStyle} role="listbox" aria-label="Category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="option"
            aria-pressed={selectedCategory === cat}
            style={chipStyle(selectedCategory === cat)}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <input
        className="money-note-input"
        type="text"
        style={noteInputStyle}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        aria-label="Note"
      />

      <button
        type="button"
        style={saveBtnStyle}
        onClick={handleSave}
        disabled={!amount || !selectedCategory}
        aria-label="Save expense"
      >
        Save
      </button>
    </GlassCard>
  );
}

export default MoneyMinuteCard;
