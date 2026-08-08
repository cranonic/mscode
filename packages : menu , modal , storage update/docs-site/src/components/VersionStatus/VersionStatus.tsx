// src/components/VersionStatus/VersionStatus.tsx
import React from 'react';
import type { VersionCheckResult } from '../../types/manifest';
import './VersionStatus.css';

interface VersionStatusProps {
  result:  VersionCheckResult | null;
  loading: boolean;
}

export const VersionStatus: React.FC<VersionStatusProps> = ({ result, loading }) => {
  if (loading) {
    return <span className="vs-badge vs-badge--checking">Checking registry…</span>;
  }
  if (!result) return null;

  if (result.status === 'new') {
    return <span className="vs-badge vs-badge--new">✦ New extension</span>;
  }
  if (result.status === 'ok') {
    return (
      <span className="vs-badge vs-badge--ok">
        ✓ Update: {result.existingVersion} → new
      </span>
    );
  }
  // conflict
  return (
    <span className="vs-badge vs-badge--conflict" title={result.message}>
      ✕ Version conflict — must be &gt; {result.existingVersion}
    </span>
  );
};