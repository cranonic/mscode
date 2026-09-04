import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VideoOverlayControls } from './VideoOverlayControls';

const HIDE_MS = 2500;

export interface VideoStageProps {
  mediaElement: HTMLMediaElement | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onVolume: (v: number) => void;
  onMute: () => void;
}

/**
 * Video-only cinema stage — no audio disc chrome.
 * Overlay controls auto-hide while playing after idle.
 */
export const VideoStage: React.FC<VideoStageProps> = ({
  mediaElement,
  playing,
  currentTime,
  duration,
  volume,
  muted,
  onTogglePlay,
  onSeek,
  onVolume,
  onMute,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpOverlay = useCallback(() => {
    setOverlay(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setOverlay(false), HIDE_MS);
    }
  }, [playing]);

  useEffect(() => {
    bumpOverlay();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [playing, bumpOverlay]);

  // Attach <video> node into host
  useEffect(() => {
    const host = hostRef.current;
    const el = mediaElement;
    if (!host || !el || el.tagName !== 'VIDEO') return;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'contain';
    el.style.background = '#000';
    el.style.display = 'block';
    if (el.parentElement !== host) {
      host.innerHTML = '';
      host.appendChild(el);
    }
  }, [mediaElement, playing]);

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (!document.fullscreenElement) {
        await shell.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* unsupported */
    }
  };

  return (
    <div
      ref={shellRef}
      className="vlc-video-stage vlc-fade-in"
      onMouseMove={bumpOverlay}
      onMouseLeave={() => playing && setOverlay(false)}
      onClick={bumpOverlay}
      onTouchStart={bumpOverlay}
      style={{
        width: 'min(100%, 960px)',
        aspectRatio: '16 / 9',
        maxHeight: '78%',
        margin: '0 12px',
        borderRadius: 'var(--vlc-radius)',
        background: '#000',
        border: '1px solid var(--vlc-border)',
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        position: 'relative',
        cursor: overlay ? 'default' : 'none',
      }}
    >
      <div
        ref={hostRef}
        onDoubleClick={() => void onTogglePlay()}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      />
      <VideoOverlayControls
        visible={overlay || !playing}
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        muted={muted}
        onTogglePlay={onTogglePlay}
        onSeek={onSeek}
        onVolume={onVolume}
        onMute={onMute}
        onFullscreen={() => void toggleFullscreen()}
      />
    </div>
  );
};
