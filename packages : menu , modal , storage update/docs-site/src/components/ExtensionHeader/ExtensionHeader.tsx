// src/components/ExtensionHeader/ExtensionHeader.tsx
import React from 'react';
import { ExtensionIcon }      from '../ExtensionIcon/ExtensionIcon';
import { VersionStatus }      from '../VersionStatus/VersionStatus';
import type { ExtractedExtension }  from '../../types/manifest';
import type { VersionCheckResult }  from '../../types/manifest';
import './ExtensionHeader.css';

interface ExtensionHeaderProps {
  ext:            ExtractedExtension;
  versionResult:  VersionCheckResult | null;
  versionLoading: boolean;
  onBack:         () => void;
}

export const ExtensionHeader: React.FC<ExtensionHeaderProps> = ({
  ext, versionResult, versionLoading, onBack
}) => {
  const { manifest, iconSource } = ext;

  return (
    <div className="eh-root">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="eh-topbar">
        <button className="eh-back" onClick={onBack}>
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M7.5 3L3 8l4.5 5M3 8h10"/>
          </svg>
          Choose another file
        </button>

        <div className="eh-version-area">
          <span className="eh-version-label">v{manifest.version}</span>
          <VersionStatus result={versionResult} loading={versionLoading} />
        </div>
      </div>

      {/* ── Main header ──────────────────────────────────────────────────── */}
      <div className="eh-body">
        <ExtensionIcon
          source={iconSource}
          name={manifest.name}
          iconColor={manifest.iconColor}
          size={96}
        />

        <div className="eh-info">
          <h1 className="eh-name">{manifest.name}</h1>

          <div className="eh-meta">
            <span className="eh-publisher">{manifest.publisher}</span>
            {manifest.category && (
              <><span className="eh-dot">·</span><span className="eh-category">{manifest.category}</span></>
            )}
            <span className="eh-dot">·</span>
            <span className="eh-id">{manifest.id}</span>
          </div>

          {manifest.description && (
            <p className="eh-description">{manifest.description}</p>
          )}

          {manifest.tags && manifest.tags.length > 0 && (
            <div className="eh-tags">
              {manifest.tags.map(tag => (
                <span key={tag} className="eh-tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Activates badges */}
          {manifest.activates && manifest.activates.length > 0 && (
            <div className="eh-activates">
              <span className="eh-activates-label">Activates on:</span>
              {manifest.activates.map(a => (
                <span key={a} className="eh-activate-badge">{a}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};