import React, { useMemo, useState } from 'react';
import {
  loadPrefs,
  resetPrefs,
  savePrefs,
  clearAllPositions,
  type PlayerPrefs,
} from '../core/playlist/sessionStore';

type SectionId = 'playback' | 'audio' | 'video' | 'interface' | 'advanced';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'playback', label: 'Playback' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
  { id: 'interface', label: 'Interface' },
  { id: 'advanced', label: 'Advanced' },
];

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onApply?: (prefs: PlayerPrefs) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  onApply,
}) => {
  const initial = useMemo(() => loadPrefs(), [open]);
  const [prefs, setPrefs] = useState<PlayerPrefs>(initial);
  const [section, setSection] = useState<SectionId>('playback');

  if (!open) return null;

  const patch = (p: Partial<PlayerPrefs>) => setPrefs((s) => ({ ...s, ...p }));

  const apply = () => {
    const next = savePrefs(prefs);
    onApply?.(next);
    onClose();
  };

  return (
    <div
      className="vlc-settings-backdrop"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        className="vlc-settings-modal vlc-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 100%)',
          maxHeight: 'min(560px, 92%)',
          background: 'var(--vlc-bg-elevated)',
          border: '1px solid var(--vlc-border)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 14px',
            borderBottom: '1px solid var(--vlc-border)',
          }}
        >
          <strong style={{ flex: 1, fontSize: 14 }}>Media Player Settings</strong>
          <button type="button" onClick={onClose} style={ghostBtn} aria-label="Close">
            ×
          </button>
        </header>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <nav
            style={{
              width: 120,
              flexShrink: 0,
              borderRight: '1px solid var(--vlc-border)',
              padding: '8px 0',
              overflow: 'auto',
            }}
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background:
                    section === s.id ? 'var(--vlc-accent-soft)' : 'transparent',
                  color:
                    section === s.id ? 'var(--vlc-accent)' : 'var(--vlc-text)',
                  padding: '8px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: section === s.id ? 600 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1, padding: 14, overflow: 'auto', fontSize: 12.5 }}>
            {section === 'playback' && (
              <>
                <Toggle
                  label="Autoplay on open"
                  value={prefs.autoplay}
                  onChange={(v) => patch({ autoplay: v })}
                />
                <Toggle
                  label="Restore last position"
                  value={prefs.restorePosition}
                  onChange={(v) => patch({ restorePosition: v })}
                />
                <Row label="Default loop">
                  <select
                    value={prefs.loop}
                    onChange={(e) =>
                      patch({ loop: e.target.value as PlayerPrefs['loop'] })
                    }
                    style={selectStyle}
                  >
                    <option value="off">Off</option>
                    <option value="all">All</option>
                    <option value="one">One</option>
                  </select>
                </Row>
                <Toggle
                  label="Shuffle by default"
                  value={prefs.shuffle}
                  onChange={(v) => patch({ shuffle: v })}
                />
                <Row label="Playback rate">
                  <select
                    value={String(prefs.defaultRate)}
                    onChange={(e) =>
                      patch({ defaultRate: Number(e.target.value) })
                    }
                    style={selectStyle}
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <option key={r} value={r}>
                        {r}×
                      </option>
                    ))}
                  </select>
                </Row>
              </>
            )}

            {section === 'audio' && (
              <>
                <Row label="Default volume">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={prefs.volume}
                    onChange={(e) => patch({ volume: Number(e.target.value) })}
                    style={{ flex: 1, accentColor: 'var(--vlc-accent)' }}
                  />
                  <span style={{ width: 36, textAlign: 'right' }}>
                    {Math.round(prefs.volume * 100)}%
                  </span>
                </Row>
                <p style={{ color: 'var(--vlc-text-faded)', marginTop: 12 }}>
                  Equalizer & crossfade arrive in a later polish pass.
                </p>
              </>
            )}

            {section === 'video' && (
              <>
                <p style={{ color: 'var(--vlc-text-faded)' }}>
                  Fullscreen and overlay auto-hide are always available on the
                  video stage. Aspect / subtitle controls land with later
                  phases.
                </p>
              </>
            )}

            {section === 'interface' && (
              <>
                <Toggle
                  label="Follow IDE theme"
                  value={prefs.followIdeTheme}
                  onChange={(v) => patch({ followIdeTheme: v })}
                />
                <Toggle
                  label="Reduced motion"
                  value={prefs.reducedMotion}
                  onChange={(v) =>
                    patch({
                      reducedMotion: v,
                      motion: v ? 'reduced' : 'full',
                    })
                  }
                />
                <Toggle
                  label="Open playlist when player opens"
                  value={prefs.showPlaylistOnOpen}
                  onChange={(v) => patch({ showPlaylistOnOpen: v })}
                />
              </>
            )}

            {section === 'advanced' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    clearAllPositions();
                  }}
                  style={actionBtn}
                >
                  Clear saved positions
                </button>
                <button
                  type="button"
                  onClick={() => setPrefs(resetPrefs())}
                  style={{ ...actionBtn, marginTop: 8 }}
                >
                  Reset all player settings
                </button>
              </>
            )}
          </div>
        </div>

        <footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '10px 14px',
            borderTop: '1px solid var(--vlc-border)',
          }}
        >
          <button type="button" onClick={onClose} style={actionBtn}>
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            style={{
              ...actionBtn,
              background: 'var(--vlc-accent)',
              color: '#111',
              borderColor: 'var(--vlc-accent)',
              fontWeight: 600,
            }}
          >
            Apply
          </button>
        </footer>
      </div>
    </div>
  );
};

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}
    >
      <span style={{ minWidth: 120 }}>{label}</span>
      {children}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--vlc-text-faded)',
  fontSize: 18,
  cursor: 'pointer',
  lineHeight: 1,
};

const actionBtn: React.CSSProperties = {
  border: '1px solid var(--vlc-border)',
  background: 'var(--vlc-bg)',
  color: 'var(--vlc-text)',
  borderRadius: 4,
  padding: '6px 12px',
  fontSize: 12,
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  background: 'var(--vlc-bg)',
  color: 'var(--vlc-text)',
  border: '1px solid var(--vlc-border)',
  borderRadius: 4,
  padding: '4px 8px',
};
