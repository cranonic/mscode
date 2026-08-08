// src/components/UploadButton/UploadButton.tsx
import React from 'react';
import type { VersionCheckResult } from '../../types/manifest';
import type { UploadStatus }       from '../../hooks/useUpload';
import './UploadButton.css';

interface UploadButtonProps {
  uploadStatus:   UploadStatus;
  versionResult:  VersionCheckResult | null;
  versionLoading: boolean;
  fileName:       string | null;
  error:          string | null;
  onUpload:       () => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  uploadStatus, versionResult, versionLoading, fileName, error, onUpload
}) => {
  const isConflict  = versionResult?.status === 'conflict';
  const isUploading = uploadStatus === 'uploading';
  const isSuccess   = uploadStatus === 'success';
  const disabled    = isConflict || isUploading || isSuccess || versionLoading;

  return (
    <div className="ub-root">
      {/* Status messages */}
      {error && (
        <div className="ub-message ub-message--error">
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5h1.5v5h-1.5v-5zm0 6h1.5v1.5h-1.5V10.5z"/>
          </svg>
          {error}
        </div>
      )}
      {isSuccess && fileName && (
        <div className="ub-message ub-message--success">
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.4 5.1-4.1 4.1-2-2 .9-.9 1.1 1.1 3.2-3.2.9.9z"/>
          </svg>
          Successfully published: <strong>{fileName}</strong>
        </div>
      )}
      {isConflict && (
        <div className="ub-message ub-message--conflict">
          Upload blocked: version must be greater than {versionResult?.existingVersion}.
          Please bump the version in <code>manifest.json</code>.
        </div>
      )}

      <button
        className="ub-btn"
        disabled={disabled}
        onClick={onUpload}
      >
        {isUploading ? (
          <>
            <svg className="ub-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
            Uploading…
          </>
        ) : isSuccess ? (
          <>✓ Published</>
        ) : (
          <>
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M13 10v2.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10H2v2.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V10h-1zM8 2.5l3.5 3.5H9.5V9h-3V6H4.5L8 2.5z"/>
            </svg>
            Publish Extension
          </>
        )}
      </button>
    </div>
  );
};