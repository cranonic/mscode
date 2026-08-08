// src/hooks/useExtractZip.ts
import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { parseManifest } from '../utils/parseManifest';
import type { ExtractedExtension, IconSource } from '../types/manifest';

export type ExtractStatus = 'idle' | 'reading' | 'done' | 'error';

interface UseExtractZipReturn {
  status:    ExtractStatus;
  extracted: ExtractedExtension | null;
  error:     string | null;
  extract:   (file: File) => Promise<void>;
  reset:     () => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_ICON_SIZE = 22 * 1024;        // 22 KB

export function useExtractZip(): UseExtractZipReturn {
  const [status,    setStatus]    = useState<ExtractStatus>('idle');
  const [extracted, setExtracted] = useState<ExtractedExtension | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle'); setExtracted(null); setError(null);
  }, []);

  const extract = useCallback(async (file: File) => {
    setStatus('reading'); setError(null); setExtracted(null);

    // ── Size guard ────────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds the 15 MB limit.'); setStatus('error'); return;
    }

    try {
      const zip = await JSZip.loadAsync(file);

      // ── manifest.json (required) ─────────────────────────────────────────
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) { throw new Error('manifest.json not found inside the archive.'); }
      const manifest = parseManifest(JSON.parse(await manifestFile.async('string')));

      // ── README ───────────────────────────────────────────────────────────
      let readmeContent: string | undefined;
      if (manifest.readme) {
        const f = zip.file(manifest.readme) ?? zip.file('README.md') ?? zip.file('readme.md');
        if (f) readmeContent = await f.async('string');
      } else {
        const f = zip.file('README.md') ?? zip.file('readme.md');
        if (f) readmeContent = await f.async('string');
      }

      // ── CHANGELOG ────────────────────────────────────────────────────────
      let changelogContent: string | undefined;
      const clFile = manifest.changelog
        ? (zip.file(manifest.changelog) ?? zip.file('CHANGELOG.md'))
        : (zip.file('CHANGELOG.md') ?? zip.file('CHANGES.md'));
      if (clFile) changelogContent = await clFile.async('string');

      // ── LICENSE ──────────────────────────────────────────────────────────
      let licenseContent: string | undefined;
      const licFile = manifest.license
        ? (zip.file(manifest.license) ?? zip.file('LICENSE'))
        : (zip.file('LICENSE') ?? zip.file('LICENSE.txt') ?? zip.file('license.txt'));
      if (licFile) licenseContent = await licFile.async('string');

      // ── Configuration schema ─────────────────────────────────────────────
      let configSchema: any | undefined;
      const cfgPath = manifest.contributes?.configuration;
      if (cfgPath) {
        const cfgFile = zip.file(cfgPath) ?? zip.file('settings.json');
        if (cfgFile) {
          try { configSchema = JSON.parse(await cfgFile.async('string')); } catch { /* ignore */ }
        }
      }

      // ── Icon ─────────────────────────────────────────────────────────────
      let iconSource: IconSource = { type: 'none' };
      const iconPath = manifest.icon;
      if (iconPath) {
        if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
          iconSource = { type: 'url', value: iconPath };
        } else {
          // Local file inside zip
          const iconFile = zip.file(iconPath);
          if (iconFile) {
            const bytes = await iconFile.async('uint8array');
            if (bytes.length > MAX_ICON_SIZE) {
              throw new Error(`Icon file "${iconPath}" exceeds 20 KB limit.`);
            }
            const ext   = iconPath.split('.').pop()?.toLowerCase() ?? 'png';
            const mime  = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
            const blob  = new Blob([bytes], { type: mime });
            iconSource  = { type: 'blob', value: URL.createObjectURL(blob) };
          }
        }
      }

      // ── Ensure output is always .msxt ─────────────────────────────────────
      const msxtFile = file.name.endsWith('.msxt')
        ? file
        : new File([file], file.name.replace(/\.zip$/i, '.msxt'), { type: file.type });

      setExtracted({ manifest, readmeContent, changelogContent, licenseContent, configSchema, iconSource, rawFile: msxtFile });
      setStatus('done');
    } catch (err: any) {
      setError(err.message ?? 'Failed to read the archive.');
      setStatus('error');
    }
  }, []);

  return { status, extracted, error, extract, reset };
}