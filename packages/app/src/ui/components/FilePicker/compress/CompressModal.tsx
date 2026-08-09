// src/ui/components/FilePicker/compress/CompressModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../Modal/Modal';
import { Icon } from '../../Icon/IconRegistry';
import { Button } from '../../Button/Button';
import { InputBox } from '../../InputBox/InputBox';
import { Select } from '../../Select/Select';
import {
  ARCHIVE_FORMAT_OPTIONS,
  LEVEL_OPTIONS,
  METHOD_OPTIONS,
  defaultCompressOptions,
  ensureArchiveExtension,
  type ArchiveFormat,
  type CompressOptions,
  type CompressSource,
  type CompressionLevel,
  type CompressionMethod,
} from './compressTypes';
import { prepareCompress, type CompressPlan } from './compressService';
import './CompressModal.css';

export interface CompressModalProps {
  isOpen: boolean;
  sources: CompressSource[];
  /** Directory where the archive will be written */
  outputDir: string;
  onClose: () => void;
  /**
   * Called with the prepared plan after user confirms.
   * Host decides how to run shellCommand (terminal, native, …).
   */
  onConfirm: (plan: CompressPlan) => void | Promise<void>;
}

export const CompressModal: React.FC<CompressModalProps> = ({
  isOpen,
  sources,
  outputDir,
  onClose,
  onConfirm,
}) => {
  const [opts, setOpts] = useState<CompressOptions>(() =>
    defaultCompressOptions(sources, outputDir),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOpts(defaultCompressOptions(sources, outputDir));
      setError(null);
      setBusy(false);
    }
  }, [isOpen, sources, outputDir]);

  const previewName = useMemo(
    () => ensureArchiveExtension(opts.archiveName || 'archive', opts.format),
    [opts.archiveName, opts.format],
  );

  const set = <K extends keyof CompressOptions>(key: K, value: CompressOptions[K]) => {
    setOpts((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormat = (v: string) => {
    const format = v as ArchiveFormat;
    setOpts((prev) => {
      let method: CompressionMethod = prev.method;
      if (format === 'zip') method = prev.level === 0 ? 'store' : 'deflate';
      if (format === 'tar') method = 'store';
      if (format === 'tar.gz') method = 'deflate';
      if (format === 'tar.bz2') method = 'bzip2';
      if (format === 'tar.xz' || format === '7z') method = 'lzma';
      return { ...prev, format, method };
    });
  };

  const handleSubmit = async () => {
    if (!opts.archiveName.trim()) {
      setError('Archive name is required.');
      return;
    }
    if (!sources.length) {
      setError('No files selected.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const plan = await prepareCompress({ ...opts, sources, outputDir });
      await onConfirm(plan);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to prepare archive.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      type="modal"
      title="Compress"
      iconName="file-zip"
      onClose={onClose}
      footerActions={
        <>
          <Button variant="type2" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="type1" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Working…' : 'Compress'}
          </Button>
        </>
      }
    >
      <div className="ms-compress-body">
        <section className="ms-compress-section">
          <div className="ms-compress-label">Items ({sources.length})</div>
          <ul className="ms-compress-sources">
            {sources.slice(0, 8).map((s) => (
              <li key={s.path}>
                <Icon name={s.isDirectory ? 'folder' : 'file'} size={14} />
                <span title={s.path}>{s.name}</span>
              </li>
            ))}
            {sources.length > 8 && (
              <li className="ms-compress-more">+{sources.length - 8} more</li>
            )}
          </ul>
        </section>

        <section className="ms-compress-section">
          <div className="ms-compress-label">Archive name</div>
          <InputBox
            value={opts.archiveName}
            onChange={(v) => set('archiveName', v)}
            placeholder="archive"
          />
          <div className="ms-compress-hint">
            Output: <code>{previewName}</code>
            <span className="ms-compress-hint-dir"> → {outputDir}</span>
          </div>
        </section>

        <section className="ms-compress-row">
          <div className="ms-compress-field">
            <div className="ms-compress-label">Format</div>
            <Select
              value={opts.format}
              onChange={handleFormat}
              options={ARCHIVE_FORMAT_OPTIONS.map((f) => ({
                value: f.value,
                label: f.label,
                description: f.description,
              }))}
            />
          </div>
          <div className="ms-compress-field">
            <div className="ms-compress-label">Level</div>
            <Select
              value={String(opts.level)}
              onChange={(v) => set('level', Number(v) as CompressionLevel)}
              options={LEVEL_OPTIONS}
            />
          </div>
        </section>

        <section className="ms-compress-row">
          <div className="ms-compress-field">
            <div className="ms-compress-label">Method</div>
            <Select
              value={opts.method}
              onChange={(v) => set('method', v as CompressionMethod)}
              options={METHOD_OPTIONS.map((m) => ({
                value: m.value,
                label: m.label,
                description: m.description,
              }))}
            />
          </div>
          <div className="ms-compress-field">
            <div className="ms-compress-label">Split (MB, 0 = off)</div>
            <InputBox
              value={String(opts.splitSizeMb || 0)}
              onChange={(v) => set('splitSizeMb', Math.max(0, parseInt(v, 10) || 0))}
              placeholder="0"
              type="number"
            />
          </div>
        </section>

        <section className="ms-compress-section">
          <div className="ms-compress-label">Password (optional)</div>
          <InputBox
            value={opts.password || ''}
            onChange={(v) => set('password', v)}
            placeholder="Leave empty for no encryption"
            type="password"
          />
        </section>

        <section className="ms-compress-toggles">
          <label className="ms-compress-toggle">
            <input
              type="checkbox"
              checked={opts.includeHidden}
              onChange={(e) => set('includeHidden', e.target.checked)}
            />
            Include hidden files
          </label>
          <label className="ms-compress-toggle">
            <input
              type="checkbox"
              checked={opts.followSymlinks}
              onChange={(e) => set('followSymlinks', e.target.checked)}
            />
            Follow symlinks
          </label>
          <label className="ms-compress-toggle">
            <input
              type="checkbox"
              checked={opts.solid}
              onChange={(e) => set('solid', e.target.checked)}
              disabled={opts.format !== '7z'}
            />
            Solid archive (7z)
          </label>
        </section>

        {error && <div className="ms-compress-error">{error}</div>}
      </div>
    </Modal>
  );
};
