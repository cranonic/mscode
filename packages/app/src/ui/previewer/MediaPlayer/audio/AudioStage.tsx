import React from 'react';
import { DiscVisualizer } from './DiscVisualizer';

export interface AudioStageProps {
  title: string;
  playing: boolean;
  onToggle: () => void;
  artUrl?: string | null;
  artist?: string;
  album?: string;
}

/**
 * Audio-only stage — disc or album art + metadata.
 */
export const AudioStage: React.FC<AudioStageProps> = ({
  title,
  playing,
  onToggle,
  artUrl,
  artist,
  album,
}) => {
  const sub = [artist, album].filter(Boolean).join(' · ');

  return (
    <div
      className="vlc-audio-stage vlc-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '24px 16px',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-20%',
          background: artUrl
            ? `center/cover no-repeat url(${artUrl})`
            : 'radial-gradient(ellipse at 50% 40%, rgba(255,136,0,0.12), transparent 55%)',
          filter: artUrl ? 'blur(48px) brightness(0.32) saturate(1.2)' : undefined,
          opacity: 1,
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'opacity 320ms ease',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {artUrl ? (
          <div style={{ position: 'relative', width: 180, height: 180 }}>
            <img
              src={artUrl}
              alt=""
              className={playing ? 'vlc-disc--spinning' : 'vlc-disc'}
              style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--vlc-border)',
                boxShadow:
                  '0 12px 40px rgba(0,0,0,0.55), 0 0 0 6px rgba(0,0,0,0.35)',
              }}
            />
            <button
              type="button"
              onClick={onToggle}
              aria-label={playing ? 'Pause' : 'Play'}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: 'none',
                background: playing ? 'transparent' : 'rgba(0,0,0,0.28)',
                cursor: 'pointer',
              }}
            />
            {/* center spindle */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 18,
                height: 18,
                margin: '-9px 0 0 -9px',
                borderRadius: '50%',
                background: '#111',
                border: '2px solid var(--vlc-accent-dim)',
                pointerEvents: 'none',
              }}
            />
          </div>
        ) : (
          <DiscVisualizer playing={playing} label={title} onToggle={onToggle} />
        )}
      </div>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 340 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--vlc-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {sub ? (
          <div
            style={{
              fontSize: 12,
              color: 'var(--vlc-text-faded)',
              marginTop: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sub}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--vlc-text-faded)', marginTop: 6 }}>
            {playing ? 'Now playing' : 'Paused'}
          </div>
        )}
      </div>
    </div>
  );
};
