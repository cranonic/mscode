// src/components/publisher/ExtensionTable.tsx
import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import { DS } from './_ds';

interface Extension {
  id:        string;
  name:      string;
  version:   string;
  category:  string;
  downloads?: number;
  icon?:     string;
  file_url?: string;
}

interface Props {
  extensions: Extension[];
  loading:    boolean;
  onDelete:   (id: string, fileUrl: string) => void;
}

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const EmptyState = () => (
  <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
    <div style={{ width: '64px', height: '64px', borderRadius: DS.radius2, background: DS.surface2, border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={DS.textFaint} strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    </div>
    <div style={{ fontSize: '14px', fontWeight: 600, color: DS.textMuted, marginBottom: '6px' }}>No extensions published</div>
    <div style={{ fontSize: '12px', color: DS.textFaint, marginBottom: '1.5rem' }}>
      Your published packages will appear here.
    </div>
    <Link to="/publisher/upload" className="ds-btn ds-btn-primary">
      Publish your first extension
    </Link>
  </div>
);

const TH: React.FC<{ children: React.ReactNode; align?: string }> = ({ children, align = 'left' }) => (
  <th style={{
    padding: '10px 14px',
    textAlign: align as any,
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: DS.textMuted,
    fontFamily: DS.fontMono,
    borderBottom: `1px solid ${DS.border}`,
    background: DS.surface2,
    whiteSpace: 'nowrap',
  }}>{children}</th>
);

export const ExtensionTable: React.FC<Props> = ({ extensions, loading, onDelete }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: '52px', background: DS.surface2, borderRadius: DS.radius, marginBottom: '2px', animation: 'ds-pulse 1.5s infinite', animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );

  if (extensions.length === 0) return <EmptyState />;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <TH>Extension</TH>
            <TH>Version</TH>
            <TH>Category</TH>
            <TH align="right">Downloads</TH>
            <TH align="right">Actions</TH>
          </tr>
        </thead>
        <tbody>
          {extensions.map(ext => (
            <tr
              key={ext.id}
              onMouseEnter={() => setHovered(ext.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                borderBottom:  `1px solid ${DS.border}`,
                background:    hovered === ext.id ? DS.surface2 : 'transparent',
                transition:    'background 0.12s',
              }}
            >
              {/* Extension identity */}
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {ext.icon ? (
                    <img src={ext.icon} alt="" style={{ width: '32px', height: '32px', borderRadius: DS.radius, objectFit: 'cover', border: `1px solid ${DS.border}` }} />
                  ) : (
                    <div style={{
                      width: '32px', height: '32px', borderRadius: DS.radius,
                      background: DS.accentDim, border: `1px solid ${DS.accent}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '13px', color: DS.accent,
                      fontFamily: DS.fontMono, flexShrink: 0,
                    }}>
                      {ext.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: DS.text }}>{ext.name}</div>
                    <div style={{ fontSize: '11px', color: DS.textFaint, fontFamily: DS.fontMono, marginTop: '1px' }}>
                      {ext.id}
                    </div>
                  </div>
                </div>
              </td>

              {/* Version */}
              <td style={{ padding: '12px 14px' }}>
                <span className="ds-tag">v{ext.version}</span>
              </td>

              {/* Category */}
              <td style={{ padding: '12px 14px' }}>
                <span style={{ fontSize: '12px', color: DS.textMuted }}>{ext.category}</span>
              </td>

              {/* Downloads */}
              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontFamily: DS.fontMono, color: ext.downloads ? DS.text : DS.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                  {(ext.downloads ?? 0).toLocaleString()}
                </span>
              </td>

              {/* Actions */}
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Link to="/publisher/upload" className="ds-btn ds-btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>
                    <EditIcon /> Update
                  </Link>
                  <button
                    onClick={() => onDelete(ext.id, ext.file_url || '')}
                    className="ds-btn ds-btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    title="Delete permanently"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};