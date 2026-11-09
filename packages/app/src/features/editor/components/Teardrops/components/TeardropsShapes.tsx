// src/features/editor/components/Teardrops/components/TeardropsShapes.tsx
import React from 'react';

export const ACCENT = 'var(--ms-accent-color, #007acc)';
export const DROP_W = 32;
export const DROP_H = 36;
/** Caret height sitting on top of the teardrop tip (SPCK-style) */
export const CARET_H = 22;
export const CARET_W = 2;

export const CursorDropSVG = ({ style = {} as React.CSSProperties }) => (
  <svg
    width={DROP_W}
    height={DROP_H}
    viewBox="0 0 24 32"
    style={{ display: 'block', transform: 'translateX(1px)', ...style }}
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

/**
 * Thin caret drawn ABOVE the teardrop tip.
 * "পুকুর ছাড়া জল হয় না — cursor ছাড়া teardrop হয় না"
 */
export const HandleCaret: React.FC<{ visible?: boolean; blinking?: boolean }> = ({
  visible = true,
  blinking = true,
}) => {
  if (!visible) return null;
  return (
    <div
      className={blinking ? 'ms-teardrop-caret ms-teardrop-caret--blink' : 'ms-teardrop-caret'}
      style={{
        position: 'absolute',
        left: '50%',
        top: -CARET_H + 2,
        width: CARET_W,
        height: CARET_H,
        marginLeft: -CARET_W / 2,
        background: ACCENT,
        borderRadius: 1,
        pointerEvents: 'none',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
      }}
    />
  );
};
