// src/components/publisher/_ds.ts
// ─── Mono Studio Dashboard Design System ─────────────────────────────────────

export const DS = {
  // Surface
  bg:        '#07070e',
  surface:   '#0d0d18',
  surface2:  '#12121f',
  surface3:  '#18182a',

  // Borders
  border:    '#1c1c30',
  borderBright: '#28284a',
  borderHover: '#3a3a6a',

  // Text
  text:      '#ddddf0',
  textMuted: '#6868a0',
  textFaint: '#32325a',

  // Accent (electric violet)
  accent:    '#7c6dff',
  accentDim: 'rgba(124, 109, 255, 0.12)',
  accentGlow:'rgba(124, 109, 255, 0.25)',

  // Semantic
  success:   '#1fd4a8',
  successDim:'rgba(31, 212, 168, 0.1)',
  danger:    '#f04560',
  dangerDim: 'rgba(240, 69, 96, 0.12)',
  warning:   '#f5a623',
  warningDim:'rgba(245, 166, 35, 0.1)',

  // Typography
  fontMono: `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`,
  fontSans: `'Inter', 'SF Pro Display', -apple-system, sans-serif`,

  // Radii
  radius:  '4px',
  radius2: '8px',
  radius3: '12px',

  // Shadows
  shadow:  '0 1px 3px rgba(0,0,0,0.5)',
  shadow2: '0 4px 16px rgba(0,0,0,0.6)',
  shadowAccent: '0 0 24px rgba(124, 109, 255, 0.2)',
};

// ─── Global style injection (call once in page-level component) ───────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --ds-bg: ${DS.bg};
    --ds-surface: ${DS.surface};
    --ds-surface2: ${DS.surface2};
    --ds-border: ${DS.border};
    --ds-accent: ${DS.accent};
    --ds-text: ${DS.text};
    --ds-text-muted: ${DS.textMuted};
    --ds-success: ${DS.success};
    --ds-danger: ${DS.danger};
  }

  .ds-page {
    background: ${DS.bg};
    min-height: 100vh;
    color: ${DS.text};
    font-family: ${DS.fontSans};
  }

  .ds-page * {
    box-sizing: border-box;
  }

  .ds-hover-row:hover {
    background: ${DS.surface3} !important;
    border-color: ${DS.borderHover} !important;
  }

  .ds-card-hover {
    transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }

  .ds-card-hover:hover {
    border-color: ${DS.accent} !important;
    transform: translateY(-2px);
    box-shadow: ${DS.shadowAccent};
  }

  .ds-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: ${DS.radius};
    font-size: 13px;
    font-weight: 600;
    font-family: ${DS.fontSans};
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease;
    white-space: nowrap;
    text-decoration: none;
  }

  .ds-btn-primary {
    background: ${DS.accent};
    color: #fff;
    border-color: ${DS.accent};
  }

  .ds-btn-primary:hover {
    background: #8f82ff;
    color: #fff;
    text-decoration: none;
  }

  .ds-btn-ghost {
    background: transparent;
    color: ${DS.textMuted};
    border-color: ${DS.border};
  }

  .ds-btn-ghost:hover {
    background: ${DS.surface3};
    color: ${DS.text};
    border-color: ${DS.borderBright};
    text-decoration: none;
  }

  .ds-btn-danger {
    background: ${DS.dangerDim};
    color: ${DS.danger};
    border-color: ${DS.danger}40;
  }

  .ds-btn-danger:hover {
    background: ${DS.danger};
    color: #fff;
    text-decoration: none;
  }

  .ds-input {
    background: ${DS.surface};
    border: 1px solid ${DS.border};
    color: ${DS.text};
    padding: 9px 12px;
    border-radius: ${DS.radius};
    font-family: ${DS.fontSans};
    font-size: 13px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .ds-input:focus {
    border-color: ${DS.accent};
  }

  .ds-input::placeholder {
    color: ${DS.textFaint};
  }

  .ds-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${DS.textMuted};
    margin-bottom: 6px;
  }

  .ds-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    font-family: ${DS.fontMono};
    background: ${DS.surface3};
    color: ${DS.textMuted};
    border: 1px solid ${DS.border};
  }

  .ds-tag-accent {
    background: ${DS.accentDim};
    color: ${DS.accent};
    border-color: ${DS.accent}30;
  }

  .ds-tag-success {
    background: ${DS.successDim};
    color: ${DS.success};
    border-color: ${DS.success}30;
  }

  .ds-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
  }

  .ds-scan-line {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255,255,255,0.012) 2px,
      rgba(255,255,255,0.012) 4px
    );
    pointer-events: none;
    border-radius: inherit;
  }

  @keyframes ds-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes ds-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes ds-slide-in {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .ds-animate-in {
    animation: ds-fade-in 0.3s ease forwards;
  }

  .ds-slide-in {
    animation: ds-slide-in 0.25s ease forwards;
  }
`;