// src/components/ExtensionIcon/ExtensionIcon.tsx
import React, { useState } from 'react';
import type { IconSource } from '../../types/manifest';
import './ExtensionIcon.css';

interface ExtensionIconProps {
  source:    IconSource;
  name:      string;
  iconColor?: string;
  size?:     number;
}

export const ExtensionIcon: React.FC<ExtensionIconProps> = ({ source, name, iconColor, size = 96 }) => {
  const [imgError, setImgError] = useState(false);

  const showImage = !imgError && (source.type === 'url' || source.type === 'blob');

  if (showImage) {
    return (
      <img
        className="ext-icon-img"
        src={(source as any).value}
        alt={name}
        width={size} height={size}
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
      />
    );
  }

  // Placeholder — puzzle piece like VS Code's default
  const initials = name.slice(0, 2).toUpperCase();
  const bg = iconColor ?? '#252526';

  return (
    <div
      className="ext-icon-placeholder"
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.34) }}
      title={name}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '55%', height: '55%', opacity: .55 }}>
        <path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5A2.5 2.5 0 0 0 10.5 1h-.01A2.5 2.5 0 0 0 8 3.5V5H4a2 2 0 0 0-2 2v4h1.5a2.5 2.5 0 0 1 0 5H2v4a2 2 0 0 0 2 2h4v-1.5a2.5 2.5 0 0 1 5 0V21h4a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/>
      </svg>
      <span className="ext-icon-initials">{initials}</span>
    </div>
  );
};