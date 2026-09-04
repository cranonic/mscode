// Thin VLC-style top chrome
import React from 'react';
import { Icon } from '@/ui/components/Icon/IconRegistry';
import type { MediaMode } from '../core/mediaKinds';

export interface ThinTopBarProps {
  title: string;
  subtitle?: string;
  mode: MediaMode;
  onOpenSettings?: () => void;
  onPlaylist?: () => void;
  onMore?: (e: React.MouseEvent) => void;
}

export const ThinTopBar: React.FC<ThinTopBarProps> = ({
  title,
  subtitle,
  mode,
  onOpenSettings,
  onPlaylist,
  onMore,
}) => {
  return (
    <header
      className="vlc-topbar"
      style={{
        height: 'var(--vlc-topbar-h)',
        minHeight: 'var(--vlc-topbar-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 10px 0 12px',
        background: 'var(--vlc-bg-elevated)',
        borderBottom: '1px solid var(--vlc-border)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: 4,
          background: 'var(--vlc-accent-soft)',
          color: 'var(--vlc-accent)',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <Icon name={mode === 'video' ? 'file' : 'file'} size={14} />
      </span>

      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'more',
            color: 'var(--vlc-text)',
          }}
          title={title}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--vlc-text-faded)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'more',
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {mode !== 'unknown' && (
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: 0.06,
            padding: '2px 7px',
            borderRadius: 3,
            border: '1px solid var(--vlc-border)',
            color: 'var(--vlc-accent)',
            background: 'var(--vlc-bg)',
            flexShrink: 0,
          }}
        >
          {mode === 'audio' ? 'AUDIO' : 'VIDEO'}
        </span>
      )}

      {onPlaylist && (
        <button
          type="button"
          className="vlc-icon-btn"
          title="Playlist"
          onClick={onPlaylist}
          style={iconBtnStyle}
        >
          <Icon name="menu" size={15} />
        </button>
      )}
      <button
        type="button"
        className="vlc-icon-btn"
        title="Settings"
        onClick={onOpenSettings}
        style={iconBtnStyle}
      >
        <Icon name="settings" size={15} />
      </button>
      <button
        type="button"
        className="vlc-icon-btn"
        title="More"
        onClick={onMore}
        style={iconBtnStyle}
      >
        <Icon name="more" size={15} />
      </button>
    </header>
  );
};

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: 'var(--vlc-text-faded)',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
};
