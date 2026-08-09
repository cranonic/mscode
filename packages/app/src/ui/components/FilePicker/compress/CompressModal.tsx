// src/ui/components/FilePicker/compress/CompressModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  prepareCompress,
  parseCompressOutput,
  type CompressPlan,
  type CompressPhase,
} from './compressService';
import { taskManager } from '@/core/extensionAPI/tasks/taskManager';
import './CompressModal.css';

export interface CompressModalProps {
  isOpen: boolean;
  sources: CompressSource[];
  outputDir: string;
  onClose: () => void;
  /**
   * Optional hook after successful compress (exit 0).
   * Execution is handled inside the modal via taskManager.
   */
  onComplete?: (plan: CompressPlan, exitCode: number) => void | Promise<void>;
  /** @deprecated use onComplete — kept for older hosts */
  onConfirm?: (plan: CompressPlan) => void | Promise<void>;
}

export const CompressModal: React.FC<CompressModalProps> = ({
  isOpen,
  sources,
  outputDir,
  onClose,
  onComplete,
  onConfirm,
}) => {
  const [opts, setOpts] = useState<CompressOptions>(() =>
    defaultCompressOptions(sources, outputDir),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [statusLine, setStatusLine] = useState('');
  const [phase, setPhase] = useState<CompressPhase>('idle');
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const killRef = useRef<(() => void) | null>(null);
  const progressState = useRef({ percent: 0, status: '', phase: 'idle' as CompressPhase });

  useEffect(() => {
    if (isOpen) {
      setOpts(defaultCompressOptions(sources, outputDir));
      setError(null);
      setBusy(false);
      setPercent(0);
      setStatusLine('');
      setDoneMsg(null);
      setPhase('idle');
      progressState.current = { percent: 0, status: '', phase: 'idle' };
      killRef.current = null;
    } else {
      killRef.current?.();
      killRef.current = null;
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

  const handleCancel = () => {
    if (busy && killRef.current) {
      killRef.current();
      killRef.current = null;
      setBusy(false);
      setStatusLine('Cancelled');
      setError('Compress cancelled.');
      return;
    }
    onClose();
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
    setDoneMsg(null);
    setPercent(0);
    setStatusLine('Starting…');
    setPhase('checking');
    progressState.current = { percent: 0, status: 'Checking…', phase: 'checking' };

    let plan: CompressPlan;
    try {
      const tmpHint =
        (typeof window !== 'undefined' &&
          ((window as any).__MSCODE_TMPDIR ||
            (window as any).mscode?.tmpDir)) ||
        undefined;
      plan = await prepareCompress(
        { ...opts, sources, outputDir },
        { tmpDir: tmpHint },
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to prepare archive.');
      setBusy(false);
      return;
    }

    // Legacy host callback (optional)
    try {
      await onConfirm?.(plan);
    } catch {
      /* ignore */
    }

    // Never pass content:// as cwd — plan.cwd is already sanitized
    const runCwd =
      plan.cwd && !plan.cwd.startsWith('content:')
        ? plan.cwd
        : '/data/local/tmp';
    const { result, kill } = taskManager.execute(
      plan.shellCommand,
      runCwd,
      (chunk) => {
        const next = parseCompressOutput(chunk, progressState.current);
        progressState.current = next;
        setPercent(next.percent);
        setPhase(next.phase);
        // Single live status line — previous text is replaced (not appended)
        if (next.status) setStatusLine(next.status);
      },
      'Compress', // visible in Tasks panel + output channel
    );
    killRef.current = kill;

    try {
      const { exitCode } = await result;
      killRef.current = null;
      setBusy(false);
      if (exitCode === 0) {
        setPercent(100);
        setStatusLine(progressState.current.status || 'Done');
        setPhase('done');
        setDoneMsg(`Created ${previewName}`);
        await onComplete?.(plan, exitCode);
        // brief moment then close
        setTimeout(() => onClose(), 700);
      } else {
        setPhase('failed');
        setError(`Compress failed (exit ${exitCode}).`);
        setStatusLine(progressState.current.status || `Failed (exit ${exitCode})`);
      }
    } catch (e: any) {
      killRef.current = null;
      setBusy(false);
      setError(e?.message || 'Compress task error.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      type="modal"
      title="Compress"
      iconName="file-zip"
      onClose={handleCancel}
      footerActions={
        <>
          <Button variant="type2" onClick={handleCancel}>
            {busy ? 'Cancel job' : 'Close'}
          </Button>
          <Button variant="type1" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Compressing…' : 'Compress'}
          </Button>
        </>
      }
    >
      <div className="ms-compress-body">
        {/* Live progress — always reserved so layout does not jump */}
        <section
          className={`ms-compress-progress ${busy || doneMsg || percent > 0 ? 'active' : ''} phase-${phase}`}
        >
          <div className="ms-compress-phase-label">
            {phase === 'checking' && 'Checking…'}
            {phase === 'installing' && 'Installing packages…'}
            {phase === 'compressing' && 'Compressing…'}
            {phase === 'done' && 'Done'}
            {(phase === 'idle' || phase === 'failed') && (busy ? 'Working…' : '')}
          </div>
          <div className="ms-compress-status-line" title={statusLine}>
            {statusLine || (busy ? 'Working…' : '\u00A0')}
          </div>
          <div className="ms-compress-bar-track">
            <div
              className={`ms-compress-bar-fill ${phase === 'installing' ? 'install' : ''}`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <div className="ms-compress-pct">{percent}%</div>
        </section>

        {doneMsg && <div className="ms-compress-done">{doneMsg}</div>}

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
            disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
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
            disabled={busy}
          />
        </section>

        <section className="ms-compress-toggles">
          <label className="ms-compress-toggle">
            <input
              type="checkbox"
              checked={opts.includeHidden}
              onChange={(e) => set('includeHidden', e.target.checked)}
              disabled={busy}
            />
            Include hidden files
          </label>
          <label className="ms-compress-toggle">
            <input
              type="checkbox"
              checked={opts.followSymlinks}
              onChange={(e) => set('followSymlinks', e.target.checked)}
              disabled={busy}
            />
            Follow symlinks
          </label>
          <label className="ms-compress-toggle">
            <input
              type="checkbox"
              checked={opts.solid}
              onChange={(e) => set('solid', e.target.checked)}
              disabled={busy || opts.format !== '7z'}
            />
            Solid archive (7z)
          </label>
        </section>

        {error && <div className="ms-compress-error">{error}</div>}
      </div>
    </Modal>
  );
};
