import type { IMarker, IMarkerData, MarkerSeverity } from './types';
import { MarkerSeverity as Sev } from './types';
import type { DecorationsRenderItem } from './types';

/**
 * Monaco MarkerService subset: setModelMarkers / getModelMarkers by owner.
 */
export class MarkerService {
  /** owner → markers */
  private byOwner = new Map<string, IMarker[]>();

  setModelMarkers(owner: string, markers: IMarkerData[]): void {
    const list: IMarker[] = markers.map((m) => ({
      ...m,
      owner,
    }));
    if (list.length === 0) this.byOwner.delete(owner);
    else this.byOwner.set(owner, list);
  }

  getModelMarkers(filter?: {
    owner?: string;
    take?: number;
  }): IMarker[] {
    let out: IMarker[] = [];
    if (filter?.owner) {
      out = [...(this.byOwner.get(filter.owner) ?? [])];
    } else {
      for (const list of this.byOwner.values()) out.push(...list);
    }
    if (filter?.take != null) out = out.slice(0, filter.take);
    return out;
  }

  clear(owner?: string): void {
    if (owner) this.byOwner.delete(owner);
    else this.byOwner.clear();
  }

  toRenderItems(): DecorationsRenderItem[] {
    const items: DecorationsRenderItem[] = [];
    for (const m of this.getModelMarkers()) {
      const color =
        m.severity >= Sev.Error
          ? '#f14c4c'
          : m.severity >= Sev.Warning
            ? '#cca700'
            : m.severity >= Sev.Info
              ? '#3794ff'
              : '#b0b0b0';
      items.push({
        range: {
          startLineNumber: m.startLineNumber,
          startColumn: m.startColumn,
          endLineNumber: m.endLineNumber,
          endColumn: m.endColumn,
        },
        underline: m.severity >= Sev.Hint && m.severity < Sev.Info ? 'dots' : 'squiggle',
        color,
        background: m.severity >= Sev.Error
          ? 'rgba(241,76,76,0.18)'
          : m.severity >= Sev.Warning
            ? 'rgba(204,167,0,0.15)'
            : 'rgba(55,148,255,0.12)',
        severity: m.severity,
      });
    }
    return items;
  }
}
