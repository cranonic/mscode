import React from 'react';
import { SeekBar } from '../common/SeekBar';
import { formatTime } from '../common/formatTime';

export interface VideoOverlayControlsProps {
  visible: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onVolume: (v: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
}

/** Cinema overlay — auto-hidden by parent when idle. */
export const VideoOverlayControls: React.FC<VideoOverlayControlsProps> = ({
  visible,
  playing,
  currentTime,
  duration,
  volume,
  muted,
  onTogglePlay,
  onSeek,
  onVolume,
  onMute,
  onFullscreen,
}) => {
  return (
    <div
      className="vlc-video-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: visible
          ? 'linear-gradient(transparent 40%, rgba(0,0,0,0.75) 100%)'
          : 'transparent',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
        pointerEvents: visible ? 'auto' : 'none',
        padding: '12px 14px 14px',
        zIndex: 2,
      }}
    >
      {/* Center play affordance */}
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={onTogglePlay}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2px solid var(--vlc-accent)',
          background: 'rgba(0,0,0,0.45)',
          color: 'var(--vlc-accent)',
          fontSize: 18,
          cursor: 'pointer',
          opacity: visible && !playing ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: visible && !playing ? 'auto' : 'none',
        }}
      >
        ▶
      </button>

      <SeekBar currentTime={currentTime} duration={duration} onSeek={onSeek} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 10,
        }}
      >
        <button type="button" onClick={onTogglePlay} style={btn}>
          {playing ? '❚❚' : '▶'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--vlc-text)', minWidth: 88 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onMute} style={btn} title="Mute">
          {muted || volume === 0 ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          style={{ width: 80, accentColor: 'var(--vlc-accent)' }}
        />
        <button type="button" onClick={onFullscreen} style={btn} title="Fullscreen">
          ⛶
        </button>
      </div>
    </div>
  );
};

const btn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--vlc-text)',
  cursor: 'pointer',
  fontSize: 14,
  padding: '4px 6px',
  lineHeight: 1,
};
