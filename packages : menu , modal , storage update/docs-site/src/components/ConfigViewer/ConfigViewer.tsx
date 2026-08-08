// src/components/ConfigViewer/ConfigViewer.tsx
import React, { useState } from 'react';
import type { ManifestConfiguration, ConfigProperty } from '../../types/manifest';
import './ConfigViewer.css';

interface ConfigViewerProps {
  schema: ManifestConfiguration;
}

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`cv-type cv-type--${type}`}>{type}</span>
);

const DefaultValue: React.FC<{ value: any }> = ({ value }) => {
  if (value === undefined || value === null) return null;
  const display = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return <code className="cv-default">{display}</code>;
};

const PropertyRow: React.FC<{ id: string; prop: ConfigProperty }> = ({ id, prop }) => {
  const [expanded, setExpanded] = useState(false);
  const hasEnum = prop.enum && prop.enum.length > 0;

  return (
    <div className="cv-row">
      <div className="cv-row-header" onClick={() => (hasEnum || prop.description) && setExpanded(e => !e)}>
        <div className="cv-row-left">
          <span className="cv-id">{id}</span>
          <TypeBadge type={prop.type} />
          {prop.default !== undefined && (
            <span className="cv-default-label">
              default: <DefaultValue value={prop.default} />
            </span>
          )}
        </div>
        {(hasEnum || prop.description) && (
          <svg
            className={`cv-chevron ${expanded ? 'cv-chevron--open' : ''}`}
            viewBox="0 0 16 16" fill="currentColor" width="12" height="12"
          >
            <path d="M4 6l4 4 4-4"/>
          </svg>
        )}
      </div>

      {prop.description && (
        <p className="cv-desc">{prop.description}</p>
      )}

      {expanded && hasEnum && (
        <div className="cv-enum-list">
          {prop.enum!.map((v, i) => (
            <div key={v} className="cv-enum-item">
              <code className="cv-enum-val">{v}</code>
              {prop.enumDescriptions?.[i] && (
                <span className="cv-enum-desc">{prop.enumDescriptions[i]}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ConfigViewer: React.FC<ConfigViewerProps> = ({ schema }) => {
  const entries = Object.entries(schema.properties ?? {});

  if (entries.length === 0) {
    return <p className="cv-empty">No configuration properties defined.</p>;
  }

  return (
    <div className="cv-root">
      {schema.title && <h3 className="cv-title">{schema.title}</h3>}
      <p className="cv-count">{entries.length} setting{entries.length !== 1 ? 's' : ''}</p>
      <div className="cv-list">
        {entries.map(([id, prop]) => (
          <PropertyRow key={id} id={id} prop={prop} />
        ))}
      </div>
    </div>
  );
};