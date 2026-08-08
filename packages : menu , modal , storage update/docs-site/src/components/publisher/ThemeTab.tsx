// src/components/publisher/ThemeTab.tsx
import React from 'react';
import { DS } from './_ds';
import { useColorMode } from '@docusaurus/theme-common';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SystemIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

export const ThemeTab: React.FC = () => {
  const { colorMode, setColorMode } = useColorMode();

  const modes = [
    { id: 'light',  label: 'Light',  icon: <SunIcon /> },
    { id: 'dark',   label: 'Dark',   icon: <MoonIcon /> },
  ] as const;

  return (
    <div className="ds-animate-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Appearance</h2>
        <p style={{ fontSize: '13px', color: DS.textMuted, margin: 0 }}>
          Choose how the Publisher Hub looks to you.
        </p>
      </div>

      <div>
        <label className="ds-label">Color Mode</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {modes.map(m => {
            const isActive = colorMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setColorMode(m.id)}
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  alignItems:    'center',
                  gap:           '10px',
                  padding:       '1.25rem 2rem',
                  borderRadius:  DS.radius2,
                  border:        `1px solid ${isActive ? DS.accent : DS.border}`,
                  background:    isActive ? DS.accentDim : DS.surface,
                  color:         isActive ? DS.accent : DS.textMuted,
                  cursor:        'pointer',
                  transition:    'all 0.15s ease',
                  fontFamily:    DS.fontSans,
                  fontWeight:    600,
                  fontSize:      '13px',
                }}
              >
                {m.icon}
                {m.label}
                {isActive && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: DS.accent, display: 'block' }} />
                )}
              </button>
            );
          })}
        </div>

        <p style={{ marginTop: '1rem', fontSize: '12px', color: DS.textFaint }}>
          You can also toggle the theme using the button in the top navigation bar.
        </p>
      </div>

      {/* Font info */}
      <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: DS.surface2, borderRadius: DS.radius, border: `1px solid ${DS.border}` }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.textMuted, fontFamily: DS.fontMono, marginBottom: '8px' }}>
          Interface
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: DS.textMuted }}>
          <span>Dashboard font</span>
          <span style={{ fontFamily: DS.fontMono, color: DS.textFaint }}>JetBrains Mono + Inter</span>
        </div>
      </div>
    </div>
  );
};