import { fs } from '@/core/fileSystem';
import { isMediaFileName } from './PlaylistModel';

function dirname(filePath: string): string {
  const norm = filePath.replace(/\\/g, '/');
  const i = norm.lastIndexOf('/');
  return i >= 0 ? norm.slice(0, i) : '';
}

function join(dir: string, name: string): string {
  if (!dir) return name;
  return dir.endsWith('/') ? dir + name : `${dir}/${name}`;
}

/** Collect media files in the same directory as `filePath`, sorted by name. */
export async function loadFolderTracks(filePath: string): Promise<string[]> {
  const dir = dirname(filePath);
  if (!dir) return [filePath];

  try {
    const entries = await fs.readDir(dir);
    const paths = entries
      .filter((e) => !e.isDirectory && isMediaFileName(e.name))
      .map((e) => e.path || join(dir, e.name))
      .sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }),
      );
    if (paths.length === 0) return [filePath];
    // Ensure current file is in list
    if (!paths.some((p) => p === filePath || p.endsWith(filePath.split(/[/\\]/).pop() || ''))) {
      paths.push(filePath);
      paths.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }),
      );
    }
    return paths;
  } catch {
    return [filePath];
  }
}
