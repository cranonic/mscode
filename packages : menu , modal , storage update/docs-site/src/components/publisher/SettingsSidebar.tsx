// src/components/publisher/SettingsSidebar.tsx
import React from 'react';
import { DS } from './_ds';

type TabId = 'profile' | 'tokens' | 'theme';

interface Props {
  activeTab:    TabId;
  setActiveTab: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 'tokens',
    label: 'Access Tokens',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    id: 'theme',
    label: 'Appearance',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
];

export const SettingsSidebar: React.FC<Props> = ({ activeTab, setActiveTab }) => (
  <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
    {/* Nav label */}
    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.textFaint, fontFamily: DS.fontMono, marginBottom: '8px', paddingLeft: '12px' }}>
      Settings
    </div>

    {tabs.map(t => {
      const isActive = activeTab === t.id;
      return (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '10px',
            padding:       '9px 12px',
            borderRadius:  DS.radius,
            border:        `1px solid ${isActive ? DS.accent + '30' : 'transparent'}`,
            background:    isActive ? DS.accentDim : 'transparent',
            color:         isActive ? DS.accent : DS.textMuted,
            fontWeight:    isActive ? 600 : 500,
            fontSize:      '13px',
            fontFamily:    DS.fontSans,
            cursor:        'pointer',
            textAlign:     'left',
            width:         '100%',
            transition:    'all 0.15s ease',
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.background = DS.surface2;
              e.currentTarget.style.color      = DS.text;
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color      = DS.textMuted;
            }
          }}
        >
          <span style={{ opacity: isActive ? 1 : 0.6 }}>{t.icon}</span>
          {t.label}
        </button>
      );
    })}
  </div>
);