import React from 'react';

export interface DiscVisualizerProps {
  playing: boolean;
  label?: string;
  size?: number;
  onToggle?: () => void;
}

/** Spinning CD / vinyl — spins only while playing; decelerates via CSS when paused. */
export const DiscVisualizer: React.FC<DiscVisualizerProps> = ({
  playing,
  label = 'M',
  size = 168,
  onToggle,
}) => {
  const initial = (label || 'M').trim().charAt(0).toUpperCase() || 'M';
  const hub = Math.round(size * 0.4);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`vlc-disc ${playing ? 'vlc-disc--spinning' : ''}`}
      aria-label={playing ? 'Pause' : 'Play'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '3px solid var(--vlc-border)',
        background: `
          radial-gradient(circle at 50% 50%, #2a2a2a 0%, #2a2a2a 28%, transparent 29%),
          repeating-conic-gradient(from 0deg, #2c2c2c 0deg 3deg, #1a1a1a 3deg 6deg)
        `,
        boxShadow:
          '0 12px 40px rgba(0,0,0,0.45), inset 0 0 0 8px #111, inset 0 0 24px rgba(255,136,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onToggle ? 'pointer' : 'default',
        padding: 0,
        position: 'relative',
      }}
    >
      {/* Groove ring highlight */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: '18%',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          width: hub,
          height: hub,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #3a3a3a, #1f1f1f)',
          border: '2px solid var(--vlc-accent-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(hub * 0.36),
          fontWeight: 700,
          color: 'var(--vlc-accent)',
          boxShadow: '0 0 20px rgba(255,136,0,0.12)',
        }}
      >
        {initial}
      </div>
    </button>
  );
};
