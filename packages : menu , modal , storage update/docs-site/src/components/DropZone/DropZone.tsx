// src/components/DropZone/DropZone.tsx
import React, { useRef, useState, useCallback } from 'react';
import './DropZone.css';

interface DropZoneProps {
  onFile: (file: File) => void;
  loading?: boolean;
  error?: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFile, loading, error }) => {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!/\.(msxt|zip)$/i.test(file.name)) return;
    onFile(file);
  }, [onFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`dz-root${drag ? ' dz-root--drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => !loading && inputRef.current?.click()}
    >
      <input
        ref={inputRef} type="file" accept=".msxt,.zip"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Upload icon */}
      <div className="dz-icon">
        {loading ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite"/>
            </path>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V8m0 0-3 3m3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.59 13A8 8 0 1 0 4 13" strokeLinecap="round"/>
            <path d="M8 16h8a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2z"/>
          </svg>
        )}
      </div>

      <p className="dz-title">{loading ? 'Reading archive…' : 'Drop your extension here'}</p>
      <p className="dz-sub">or <span className="dz-link">browse file</span> &nbsp;·&nbsp; <code>.msxt</code> or <code>.zip</code> &nbsp;·&nbsp; max 15 MB</p>

      {error && <p className="dz-error">{error}</p>}
    </div>
  );
};