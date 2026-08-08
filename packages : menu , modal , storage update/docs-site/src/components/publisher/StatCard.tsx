// src/components/publisher/StatCard.tsx
import React, { useEffect, useRef } from 'react';
import { DS } from './_ds';

interface Props {
  label:    string;
  value:    string | number;
  loading?: boolean;
  accent?:  string;
  icon?:    React.ReactNode;
  sublabel?: string;
  trend?:   { value: number; label: string };
}

// Animated counter hook
function useCounter(target: number, duration = 1000) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof target !== 'number') return;
    const start = performance.now();
    const frame = (now: number) => {
      const p  = Math.min((now - start) / duration, 1);
      const val = Math.floor(p * target);
      if (ref.current) ref.current.textContent = val.toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target]);
  return ref;
}

export const StatCard: React.FC<Props> = ({ label, value, loading, accent, icon, sublabel, trend }) => {
  const numVal  = typeof value === 'number' ? value : 0;
  const countRef= useCounter(numVal);

  const col = accent ?? DS.accent;

  return (
    <div style={{
      padding:       '1.5rem',
      borderRadius:  DS.radius2,
      background:    DS.surface,
      border:        `1px solid ${DS.border}`,
      position:      'relative',
      overflow:      'hidden',
      display:       'flex',
      flexDirection: 'column',
      gap:           '0.75rem',
      transition:    'border-color 0.2s',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = DS.borderHover)}
    onMouseLeave={e => (e.currentTarget.style.borderColor = DS.border)}
    >
      {/* Accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '2px', height: '100%', background: col, borderRadius: '8px 0 0 8px' }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.textMuted, fontFamily: DS.fontMono }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: col, opacity: 0.7, display: 'flex' }}>{icon}</span>
        )}
      </div>

      {/* Value */}
      <div style={{ paddingLeft: '8px' }}>
        {loading ? (
          <div style={{ width: '80px', height: '36px', borderRadius: '4px', background: DS.surface3, animation: 'ds-pulse 1.5s infinite' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span ref={countRef} style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, color: DS.text, fontFamily: DS.fontMono, fontVariantNumeric: 'tabular-nums' }}>
              {typeof value === 'number' ? '0' : value}
            </span>
            {trend && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: trend.value >= 0 ? DS.success : DS.danger, fontFamily: DS.fontMono }}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        )}
        {sublabel && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: DS.textFaint }}>{sublabel}</div>
        )}
      </div>

      {/* Corner grid decoration */}
      <div style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.06 }}>
        {[0,1,2].map(r => (
          <div key={r} style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
            {[0,1,2].map(c => (
              <div key={c} style={{ width: '3px', height: '3px', borderRadius: '1px', background: col }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};