// Player chrome — Phase 5 settings + context menu + commands
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThinTopBar } from './ThinTopBar';
import { PlayerContextMenu, type CtxItem } from './PlayerContextMenu';
import { detectMediaMode, displayName, type MediaMode } from '../core/mediaKinds';
import { useMediaEngine } from '../hooks/useMediaEngine';
import { useMediaMetadata } from '../hooks/useMediaMetadata';
import { usePlaylist } from '../hooks/usePlaylist';
import { AudioStage } from '../audio/AudioStage';
import { VideoStage } from '../video/VideoStage';
import { SeekBar } from '../common/SeekBar';
import { formatTime } from '../common/formatTime';
import { PlaylistDrawer } from '../playlist/PlaylistDrawer';
import { SettingsModal } from '../settings/SettingsModal';
import { loadPrefs, savePrefs, type PlayerPrefs } from '../core/playlist/sessionStore';
import { useMediaSession } from '../hooks/useMediaSession';
import { usePlayerLifecycle } from '../hooks/usePlayerLifecycle';
import { usePlayerKeyboard } from '../hooks/usePlayerKeyboard';
import '../theme/vlcTokens.css';
import '../theme/motion.css';

export interface PlayerShellProps {
  tabId: string;
  filePath: string;
}

export const PlayerShell: React.FC<PlayerShellProps> = ({ filePath }) => {
  const [prefs, setPrefs] = useState<PlayerPrefs>(() => loadPrefs());

  const {
    playlist,
    activePath,
    selectIndex,
    next,
    prev,
    toggleShuffle,
    cycleLoop,
  } = usePlaylist(filePath);

  const mode: MediaMode = useMemo(
    () => detectMediaMode(activePath),
    [activePath],
  );
  const fileLabel = useMemo(
    () => (activePath || '').split(/[/\\]/).pop() || activePath,
    [activePath],
  );

  const { snap, togglePlay, seek, setVolume, setMuted, mediaElement, engine } =
    useMediaEngine(activePath, {
      autoplay: prefs.autoplay,
      volume: prefs.volume,
      restorePosition: prefs.restorePosition,
    });
  const { meta } = useMediaMetadata(activePath);

  const [drawerOpen, setDrawerOpen] = useState(prefs.showPlaylistOnOpen);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const endedHandled = useRef(false);

  // Apply rate when prefs change
  useEffect(() => {
    engine.current?.setRate(prefs.defaultRate);
  }, [prefs.defaultRate, engine, activePath, snap.state]);

  // Command palette bridge
  useEffect(() => {
    const onSettings = () => setSettingsOpen(true);
    const onPP = () => void togglePlay();
    const onNext = () => next();
    const onPrev = () => prev();
    document.addEventListener('ms-mediaplayer-open-settings', onSettings);
    document.addEventListener('ms-mediaplayer-play-pause', onPP);
    document.addEventListener('ms-mediaplayer-next', onNext);
    document.addEventListener('ms-mediaplayer-prev', onPrev);
    return () => {
      document.removeEventListener('ms-mediaplayer-open-settings', onSettings);
      document.removeEventListener('ms-mediaplayer-play-pause', onPP);
      document.removeEventListener('ms-mediaplayer-next', onNext);
      document.removeEventListener('ms-mediaplayer-prev', onPrev);
    };
  }, [togglePlay, next, prev]);

  // Auto-advance
  useEffect(() => {
    if (snap.state === 'ended') {
      if (endedHandled.current) return;
      endedHandled.current = true;
      if (playlist.loop === 'one') {
        seek(0);
        void togglePlay();
        endedHandled.current = false;
        return;
      }
      next();
    } else {
      endedHandled.current = false;
    }
  }, [snap.state, playlist.loop, next, seek, togglePlay]);

  const title = meta.title || displayName(activePath);
  const subtitle =
    [
      meta.artist,
      meta.album,
      playlist.tracks.length > 1
        ? `${playlist.index + 1}/${playlist.tracks.length}`
        : null,
      snap.state === 'error'
        ? snap.error
        : snap.state === 'loading'
          ? 'Loading…'
          : null,
    ]
      .filter(Boolean)
      .join(' · ') || fileLabel;

  const playing = snap.state === 'playing';
  const el = mediaElement();
  const onToggle = () => void togglePlay();
  const rootRef = useRef<HTMLDivElement>(null);

  usePlayerLifecycle(engine, snap, rootRef);
  useMediaSession({
    meta,
    snap,
    onPlay: onToggle,
    onPause: () => engine.current?.pause(),
    onNext: next,
    onPrev: prev,
    onSeek: seek,
  });
  usePlayerKeyboard(rootRef, {
    onToggle,
    onSeek: (delta) => {
      const s = snap;
      const target = s.currentTime + delta;
      if (s.duration > 0) {
        seek(Math.max(0, Math.min(s.duration, target)));
      } else {
        seek(Math.max(0, target));
      }
    },
    onMute: () => setMuted(!snap.muted),
    onNext: next,
    onPrev: prev,
  });


  const motionOff = prefs.reducedMotion || prefs.motion === 'off';

  const ctxItems: CtxItem[] = [
    {
      id: 'pp',
      label: playing ? 'Pause' : 'Play',
      onClick: onToggle,
    },
    {
      id: 'seekb',
      label: 'Seek −10s',
      onClick: () => seek(Math.max(0, snap.currentTime - 10)),
    },
    {
      id: 'seekf',
      label: 'Seek +10s',
      onClick: () =>
        seek(
          snap.duration
            ? Math.min(snap.duration, snap.currentTime + 10)
            : snap.currentTime + 10,
        ),
    },
    { id: 'prev', label: 'Previous', onClick: prev },
    { id: 'next', label: 'Next', onClick: next },
    {
      id: 'loop',
      label: `Loop: ${playlist.loop}`,
      onClick: cycleLoop,
    },
    {
      id: 'shuffle',
      label: playlist.shuffle ? 'Shuffle: On' : 'Shuffle: Off',
      onClick: toggleShuffle,
    },
    {
      id: 'playlist',
      label: 'Show playlist',
      onClick: () => setDrawerOpen(true),
    },
    {
      id: 'settings',
      label: 'Settings…',
      onClick: () => setSettingsOpen(true),
    },
    {
      id: 'copy',
      label: 'Copy path',
      onClick: () => {
        try {
          void navigator.clipboard?.writeText(activePath);
        } catch {
          /* ignore */
        }
      },
    },
  ];

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY });
  }, []);

  const loopLabel =
    playlist.loop === 'one' ? '🔁1' : playlist.loop === 'all' ? '🔁' : '➡️';

  return (
    <div
      ref={rootRef}
      className="vlc-player vlc-fade-in"
      data-mode={mode}
      data-vlc-follow-ide={prefs.followIdeTheme ? 'true' : 'false'}
      data-reduced-motion={motionOff ? 'true' : 'false'}
      style={{ position: 'relative' }}
      onContextMenu={onContextMenu}
      tabIndex={0}
      role="region"
      aria-label="Media player"
    >
      <ThinTopBar
        title={title}
        subtitle={subtitle}
        mode={mode}
        onPlaylist={() => setDrawerOpen((o) => !o)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <PlaylistDrawer
        open={drawerOpen}
        playlist={playlist}
        onClose={() => setDrawerOpen(false)}
        onSelect={(i) => {
          selectIndex(i);
          setDrawerOpen(false);
        }}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApply={(p) => {
          setPrefs(p);
          setVolume(p.volume);
          engine.current?.setRate(p.defaultRate);
        }}
      />

      {ctx && (
        <PlayerContextMenu
          x={ctx.x}
          y={ctx.y}
          items={ctxItems}
          onClose={() => setCtx(null)}
        />
      )}

      <div
        className="vlc-stage"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--vlc-bg-stage)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {mode === 'audio' && (
          <AudioStage
            title={title}
            playing={playing && !motionOff}
            onToggle={onToggle}
            artUrl={meta.artUrl}
            artist={meta.artist}
            album={meta.album}
          />
        )}

        {mode === 'video' && (
          <VideoStage
            mediaElement={el}
            playing={playing}
            currentTime={snap.currentTime}
            duration={snap.duration}
            volume={snap.volume}
            muted={snap.muted}
            onTogglePlay={onToggle}
            onSeek={seek}
            onVolume={(v) => {
              setVolume(v);
              if (v > 0 && snap.muted) setMuted(false);
            }}
            onMute={() => setMuted(!snap.muted)}
          />
        )}

        {mode === 'unknown' && (
          <p style={{ color: 'var(--vlc-text-faded)', fontSize: 13 }}>
            Unsupported media type
          </p>
        )}

        {snap.state === 'error' && mode !== 'unknown' && (
          <p
            style={{
              position: 'absolute',
              bottom: 16,
              color: 'var(--vlc-danger)',
              fontSize: 12,
              padding: '0 16px',
              textAlign: 'center',
            }}
          >
            {snap.error}
          </p>
        )}
      </div>

      {mode === 'audio' && (
        <footer
          className="vlc-transport"
          style={{
            flexShrink: 0,
            padding: '10px 14px 12px',
            background: 'var(--vlc-bg-elevated)',
            borderTop: '1px solid var(--vlc-border)',
          }}
        >
          <SeekBar
            currentTime={snap.currentTime}
            duration={snap.duration}
            onSeek={seek}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 10,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--vlc-text-faded)', minWidth: 40 }}>
              {formatTime(snap.currentTime)}
            </span>
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <TBtn title="Previous" onClick={prev}>
                ⏮
              </TBtn>
              <button
                type="button"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={onToggle}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--vlc-accent)',
                  color: '#111',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {playing ? '❚❚' : '▶'}
              </button>
              <TBtn title="Next" onClick={next}>
                ⏭
              </TBtn>
            </div>
            <span
              style={{
                fontSize: 11,
                color: 'var(--vlc-text-faded)',
                minWidth: 40,
                textAlign: 'right',
              }}
            >
              {formatTime(snap.duration)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              justifyContent: 'center',
            }}
          >
            <TBtn
              title={`Loop: ${playlist.loop}`}
              onClick={cycleLoop}
              active={playlist.loop !== 'off'}
            >
              {loopLabel}
            </TBtn>
            <TBtn
              title="Shuffle"
              onClick={toggleShuffle}
              active={playlist.shuffle}
            >
              🔀
            </TBtn>
            <button
              type="button"
              onClick={() => setMuted(!snap.muted)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 16,
                padding: 4,
              }}
            >
              {snap.muted || snap.volume === 0 ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={snap.muted ? 0 : snap.volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                savePrefs({ volume: v });
                if (v > 0 && snap.muted) setMuted(false);
              }}
              style={{ width: 100, accentColor: 'var(--vlc-accent)' }}
            />
            <TBtn title="Playlist" onClick={() => setDrawerOpen((o) => !o)}>
              ≡
            </TBtn>
            <TBtn title="Settings" onClick={() => setSettingsOpen(true)}>
              ⚙
            </TBtn>
          </div>
        </footer>
      )}
    </div>
  );
};

function TBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        border: 'none',
        background: active ? 'var(--vlc-accent-soft)' : 'transparent',
        color: active ? 'var(--vlc-accent)' : 'var(--vlc-text)',
        cursor: 'pointer',
        fontSize: 16,
        padding: '4px 8px',
        borderRadius: 4,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
