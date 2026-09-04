import React from 'react';

export interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const SeekBar: React.FC<SeekBarProps> = ({
  currentTime,
  duration,
  onSeek,
}) => {
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const handle = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    if (duration > 0) onSeek(ratio * duration);
  };

  return (
    <div
      role="slider"
      aria-valuenow={currentTime}
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      onClick={(e) => handle(e.clientX, e.currentTarget)}
      onKeyDown={(e) => {
        if (!duration) return;
        if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5));
        if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5));
      }}
      tabIndex={0}
      style={{
        height: 6,
        borderRadius: 3,
        background: 'var(--vlc-border)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: 'var(--vlc-accent)',
          borderRadius: 3,
          boxShadow: progress > 0 ? '0 0 8px var(--vlc-accent-soft)' : undefined,
        }}
      />
    </div>
  );
};
