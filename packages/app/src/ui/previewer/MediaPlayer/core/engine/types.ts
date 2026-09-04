export type EngineState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

export interface EngineSnapshot {
  state: EngineState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  rate: number;
  error: string | null;
}

export type EngineListener = (snap: EngineSnapshot) => void;

export interface MediaBackend {
  readonly element: HTMLMediaElement;
  load(url: string, mimeHint?: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  setVolume(v: number): void;
  setMuted(m: boolean): void;
  setRate(r: number): void;
  destroy(): void;
}
