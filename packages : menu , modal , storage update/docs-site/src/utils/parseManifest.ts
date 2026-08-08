// required fields validation
// src/utils/parseManifest.ts
import type { ExtensionManifest } from '../types/manifest';

const REQUIRED: (keyof ExtensionManifest)[] = ['id', 'name', 'version'];

export function parseManifest(raw: unknown): ExtensionManifest {
  if (!raw || typeof raw !== 'object') throw new Error('manifest.json is not a valid JSON object.');

  const obj = raw as Record<string, unknown>;

  for (const field of REQUIRED) {
    if (!obj[field] || typeof obj[field] !== 'string') {
      throw new Error(`manifest.json is missing required field: "${field}"`);
    }
  }

  // Basic semver check: must have at least X.Y.Z
  if (!/^\d+\.\d+\.\d+/.test(obj.version as string)) {
    throw new Error(`version "${obj.version}" is not valid semver (e.g. 1.0.0).`);
  }

  return obj as unknown as ExtensionManifest;
}