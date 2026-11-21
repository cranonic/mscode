import type {
  IModelDecoration,
  IModelDeltaDecoration,
  DecorationsRenderItem,
} from './types';

/**
 * Monaco `deltaDecorations` store — opaque string ids.
 */
export class DecorationsCollection {
  private nextId = 1;
  private map = new Map<string, IModelDecoration>();

  deltaDecorations(
    oldDecorations: string[],
    newDecorations: IModelDeltaDecoration[],
  ): string[] {
    for (const id of oldDecorations) {
      this.map.delete(id);
    }
    const ids: string[] = [];
    for (const d of newDecorations) {
      const id = `d${this.nextId++}`;
      this.map.set(id, {
        id,
        ownerId: 0,
        range: { ...d.range },
        options: { ...d.options },
      });
      ids.push(id);
    }
    return ids;
  }

  getDecoration(id: string): IModelDecoration | undefined {
    return this.map.get(id);
  }

  getAll(): IModelDecoration[] {
    return Array.from(this.map.values());
  }

  clear(): void {
    this.map.clear();
  }

  /** Flatten for canvas paint */
  toRenderItems(): DecorationsRenderItem[] {
    const items: DecorationsRenderItem[] = [];
    for (const d of this.map.values()) {
      const o = d.options;
      let underline: DecorationsRenderItem['underline'] = o.monoUnderline ?? 'none';
      let color = o.monoUnderlineColor ?? '#cccccc';
      if (underline === 'none' && o.inlineClassName) {
        // Heuristic class names
        const c = o.inlineClassName;
        if (/error|squiggle-error/i.test(c)) {
          underline = 'squiggle';
          color = '#f14c4c';
        } else if (/warn/i.test(c)) {
          underline = 'squiggle';
          color = '#cca700';
        } else if (/info/i.test(c)) {
          underline = 'squiggle';
          color = '#3794ff';
        } else if (/hint/i.test(c)) {
          underline = 'dots';
          color = '#b0b0b0';
        }
      }
      items.push({
        range: d.range,
        underline,
        color,
        background: o.monoBackgroundColor,
        isWholeLine: o.isWholeLine,
      });
    }
    return items;
  }
}
