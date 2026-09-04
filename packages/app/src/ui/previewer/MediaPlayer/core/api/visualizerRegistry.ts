/**
 * Registry for custom audio visualizers.
 * The built-in DiscVisualizer remains the default (id: "mscode.disc").
 * Extensions register React components that receive VisualizerProps.
 */
import type React from 'react';

export interface VisualizerProps {
  playing: boolean;
  /** Track title / file label for monogram fallback */
  label?: string;
  /** Preferred size in CSS px */
  size?: number;
  /** Album art object URL if available */
  artUrl?: string | null;
  /** Click → play/pause */
  onToggle?: () => void;
  /** Live engine time (optional; for reactive visualizers) */
  currentTime?: number;
  duration?: number;
}

export interface VisualizerContribution {
  id: string;
  /** Display name in settings / picker */
  name: string;
  /** Higher wins as default when multiple registered */
  priority: number;
  component: React.FC<VisualizerProps>;
}

const visualizers: VisualizerContribution[] = [];
let preferredId: string | null = null;

export function registerVisualizer(contrib: VisualizerContribution): () => void {
  const idx = visualizers.findIndex((v) => v.id === contrib.id);
  if (idx >= 0) visualizers.splice(idx, 1);
  visualizers.push(contrib);
  visualizers.sort((a, b) => b.priority - a.priority);
  return () => {
    const i = visualizers.findIndex((v) => v.id === contrib.id);
    if (i >= 0) visualizers.splice(i, 1);
    if (preferredId === contrib.id) preferredId = null;
  };
}

export function unregisterVisualizer(id: string): void {
  const i = visualizers.findIndex((v) => v.id === id);
  if (i >= 0) visualizers.splice(i, 1);
  if (preferredId === id) preferredId = null;
}

/** Force a specific visualizer id (from settings). null = auto highest priority. */
export function setPreferredVisualizer(id: string | null): void {
  preferredId = id;
}

export function getPreferredVisualizerId(): string | null {
  return preferredId;
}

export function resolveVisualizer(): VisualizerContribution | null {
  if (preferredId) {
    const preferred = visualizers.find((v) => v.id === preferredId);
    if (preferred) return preferred;
  }
  return visualizers[0] ?? null;
}

export function listVisualizers(): ReadonlyArray<VisualizerContribution> {
  return visualizers.slice();
}
