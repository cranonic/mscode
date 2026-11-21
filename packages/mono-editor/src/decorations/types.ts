/** Monaco-compatible decorations & markers (diagnostics). */

export interface IRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export type MarkerSeverity = 1 | 2 | 4 | 8; // Hint, Info, Warning, Error (Monaco values)

export const MarkerSeverity = {
  Hint: 1 as MarkerSeverity,
  Info: 2 as MarkerSeverity,
  Warning: 4 as MarkerSeverity,
  Error: 8 as MarkerSeverity,
};

export interface IMarkerData {
  severity: MarkerSeverity;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  source?: string;
  code?: string | { value: string; target?: string };
  tags?: number[];
  relatedInformation?: unknown[];
}

export interface IMarker extends IMarkerData {
  owner: string;
  resource?: string;
}

export interface IModelDecorationOptions {
  /** CSS class name (ignored on canvas; used for class-based themes later) */
  className?: string | null;
  /** Underline / squiggle */
  inlineClassName?: string | null;
  isWholeLine?: boolean;
  hoverMessage?: string | { value: string } | Array<{ value: string }>;
  overviewRuler?: { color: string; position?: number } | null;
  minimap?: { color: string; position?: number } | null;
  glyphMarginClassName?: string | null;
  linesDecorationsClassName?: string | null;
  zIndex?: number;
  /** Mono canvas: explicit underline style */
  monoUnderline?: 'none' | 'squiggle' | 'solid' | 'dots';
  monoUnderlineColor?: string;
  monoBackgroundColor?: string;
}

export interface IModelDeltaDecoration {
  range: IRange;
  options: IModelDecorationOptions;
}

export interface IModelDecoration {
  id: string;
  ownerId: number;
  range: IRange;
  options: IModelDecorationOptions;
}

export interface DecorationsRenderItem {
  range: IRange;
  underline: 'none' | 'squiggle' | 'solid' | 'dots';
  color: string;
  background?: string;
  isWholeLine?: boolean;
  severity?: MarkerSeverity;
}
