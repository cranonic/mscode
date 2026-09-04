import React from 'react';
import type { PlaylistState } from '../core/playlist/PlaylistModel';

export interface PlaylistDrawerProps {
  open: boolean;
  playlist: PlaylistState;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  open,
  playlist,
  onClose,
  onSelect,
}) => {
  if (!open) return null;

  return (
    <div
      className="vlc-playlist-drawer vlc-fade-in"
      style={{
        position: 'absolute',
        top: 'var(--vlc-topbar-h)',
        right: 0,
        bottom: 0,
        width: 'min(320px, 92%)',
        background: 'var(--vlc-bg-elevated)',
        borderLeft: '1px solid var(--vlc-border)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid var(--vlc-border)',
          gap: 8,
        }}
      >
        <strong style={{ flex: 1, fontSize: 13 }}>Playlist</strong>
        <span style={{ fontSize: 11, color: 'var(--vlc-text-faded)' }}>
          {playlist.tracks.length} tracks
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--vlc-text-faded)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
          aria-label="Close playlist"
        >
          ×
        </button>
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '6px 0',
          overflow: 'auto',
          flex: 1,
        }}
      >
        {playlist.tracks.map((t, i) => {
          const active = i === playlist.index;
          return (
            <li key={t.path + i}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: active ? 'var(--vlc-accent-soft)' : 'transparent',
                  color: active ? 'var(--vlc-accent)' : 'var(--vlc-text)',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    minWidth: 18,
                    color: 'var(--vlc-text-faded)',
                    fontSize: 11,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
