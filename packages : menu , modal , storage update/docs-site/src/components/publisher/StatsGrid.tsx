// src/components/publisher/StatsGrid.tsx
import React from 'react';
import Link from '@docusaurus/Link';
import { StatCard } from './StatCard';
import { DS } from './_ds';

interface Props {
  totalExtensions: number;
  totalDownloads:  number;
  loading:         boolean;
}

const PackageIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const DownloadIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ArrowIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

export const StatsGrid: React.FC<Props> = ({ totalExtensions, totalDownloads, loading }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
    <StatCard
      label="Published"
      value={totalExtensions}
      loading={loading}
      accent={DS.accent}
      icon={PackageIcon}
      sublabel="extensions in registry"
    />

    <StatCard
      label="Downloads"
      value={totalDownloads}
      loading={loading}
      accent={DS.success}
      icon={DownloadIcon}
      sublabel="total installs"
    />

    {/* CTA card */}
    <div style={{
      padding:       '1.5rem',
      borderRadius:  DS.radius2,
      background:    DS.surface,
      border:        `1px solid ${DS.border}`,
      display:       'flex',
      flexDirection: 'column',
      justifyContent:'space-between',
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${DS.border} 1px, transparent 1px), linear-gradient(90deg, ${DS.border} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        opacity: 0.4,
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.textMuted, fontFamily: DS.fontMono, marginBottom: '8px' }}>
          Dev Resources
        </div>
        <p style={{ fontSize: '13px', color: DS.textMuted, margin: 0, lineHeight: 1.6 }}>
          Build powerful extensions with the full API reference and starter templates.
        </p>
      </div>

      <Link to="/docs/intro" className="ds-btn ds-btn-ghost" style={{ position: 'relative', marginTop: '1rem', width: 'fit-content', borderColor: DS.borderBright, color: DS.text }}>
        Read Docs {ArrowIcon}
      </Link>
    </div>
  </div>
);