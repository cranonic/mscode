import { useEffect, useRef, useState } from 'react';
import { MediaEngine } from '../core/engine/MediaEngine';
import type { EngineSnapshot } from '../core/engine/types';
import { loadPosition, savePosition } from '../core/playlist/sessionStore';

const defaultSnap: EngineSnapshot = {
  state: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  muted: false,
  rate: 1,
  error: null,
};

export function useMediaEngine(
  filePath: string,
  opts?: { autoplay?: boolean; volume?: number; restorePosition?: boolean },
) {
  const engineRef = useRef<MediaEngine | null>(null);
  const [snap, setSnap] = useState<EngineSnapshot>(defaultSnap);
  const pathRef = useRef(filePath);
  pathRef.current = filePath;

  useEffect(() => {
    const engine = new MediaEngine();
    engineRef.current = engine;
    const unsub = engine.subscribe(setSnap);
    const startTime =
      opts?.restorePosition === false ? 0 : loadPosition(filePath);
    void engine.openFile(filePath, {
      autoplay: opts?.autoplay !== false,
      volume: opts?.volume ?? 0.85,
      startTime,
    });
    return () => {
      // Persist playhead for session resume
      const s = engine.getSnapshot();
      if (s.currentTime > 2) {
        savePosition(pathRef.current, s.currentTime, s.duration);
      }
      unsub();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  // Periodic position save while playing
  useEffect(() => {
    if (snap.state !== 'playing') return;
    const id = setInterval(() => {
      const s = engineRef.current?.getSnapshot();
      if (s && s.currentTime > 2) {
        savePosition(filePath, s.currentTime, s.duration);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [snap.state, filePath]);

  return {
    snap,
    engine: engineRef,
    togglePlay: () => engineRef.current?.togglePlay(),
    pause: () => engineRef.current?.pause(),
    seek: (t: number) => engineRef.current?.seek(t),
    setVolume: (v: number) => engineRef.current?.setVolume(v),
    setMuted: (m: boolean) => engineRef.current?.setMuted(m),
    mediaElement: () => engineRef.current?.getMediaElement() ?? null,
  };
}
