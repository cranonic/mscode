// src/features/editor/components/Teardrops/components/TeardropsShapes.tsx
import React from 'react';

export const ACCENT = 'var(--ms-accent-color, #007acc)';
export const DROP_W = 32;
export const DROP_H = 38;
export const CARET_H = 22;
export const CARET_W = 2;

export const CursorDropSVG = ({ style = {} as React.CSSProperties }) => (
  <svg
    width={DROP_W}
    height={DROP_H}
    viewBox="0 0 24 32"
    style={{ display: 'block', ...style }}
  >
    <path
      d="M12 0
         C18 6, 24 12, 24 18
         A12 12 0 1 1 0 18
         C0 12, 6 6, 12 0 Z"
      fill={ACCENT}
    />
  </svg>
);

export const StartDropSVG = () => (
  <CursorDropSVG
    style={{
      transform: 'rotate(45deg)',
      transformOrigin: '60% 50%',
    }}
  />
);

export const EndDropSVG = () => (
  <CursorDropSVG
    style={{
      transform: 'rotate(-45deg)',
      transformOrigin: '40% 60%',
    }}
  />
);

export type CaretAlign = 'start' | 'end' | 'center';

/**
 * Solid white caret on teardrop tip — no blink, no animation.
 * Align:
 * - start → right: 0%
 * - end   → left: 0%
 * - center→ left: 50%
 */
export const HandleCaret: React.FC<{
  visible?: boolean;
  align?: CaretAlign;
}> = ({ visible = true, align = 'center' }) => {
  if (!visible) return null;

  const horiz: React.CSSProperties =
    align === 'start'
      ? { left: 'auto', right: 0, marginLeft: 0 }
      : align === 'end'
        ? { left: 0, right: 'auto', marginLeft: 0 }
        : { left: '50%', right: 'auto', marginLeft: -CARET_W / 2 };

  return (
    <div
      className="ms-teardrop-caret"
      style={{
        position: 'absolute',
        top: -CARET_H + 4,
        width: CARET_W,
        height: CARET_H,
        background: '#ffffff',
        borderRadius: 1,
        pointerEvents: 'none',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
        opacity: 1,
        animation: 'none',
        ...horiz,
      }}
    />
  );
};
