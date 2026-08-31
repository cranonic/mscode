// src/features/git/components/changeTree.ts
// Build a collapsible folder tree from a flat GitChangedFile[] list (VS Code SCM style).

import type { GitChangedFile, GitFileStatus } from '../types';

export interface ChangeTreeNode {
  /** Segment name (file or folder). */
  name: string;
  /** Absolute path for this node (file path, or directory path without trailing slash). */
  path: string;
  isDirectory: boolean;
  /** Present only for leaf file nodes. */
  file?: GitChangedFile;
  children?: ChangeTreeNode[];
  /** Aggregated status for folders (first non-untracked wins, else untracked). */
  status?: GitFileStatus;
}

/**
 * Turns a flat list of changed files into a nested folder tree.
 * Directory-only entries (`isDirectory: true`) become folder nodes without a file leaf.
 */
export function buildChangeTree(files: GitChangedFile[], repoRoot: string): ChangeTreeNode[] {
  const root: ChangeTreeNode[] = [];
  const rootNorm = repoRoot.replace(/\/+$/, '');

  const ensureFolder = (
    siblings: ChangeTreeNode[],
    name: string,
    fullPath: string,
  ): ChangeTreeNode => {
    let node = siblings.find(n => n.isDirectory && n.name === name);
    if (!node) {
      node = { name, path: fullPath, isDirectory: true, children: [], status: undefined };
      siblings.push(node);
    }
    if (!node.children) node.children = [];
    return node;
  };

  for (const file of files) {
    let rel = file.path.startsWith(rootNorm + '/')
      ? file.path.slice(rootNorm.length + 1)
      : file.path.replace(/^\//, '');
    rel = rel.replace(/\/+$/, '');
    if (!rel) continue;

    const parts = rel.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let siblings = root;
    let accum = rootNorm;

    // Walk all but last segment as folders
    for (let i = 0; i < parts.length - 1; i++) {
      accum = `${accum}/${parts[i]}`;
      const folder = ensureFolder(siblings, parts[i], accum);
      siblings = folder.children!;
    }

    const last = parts[parts.length - 1];
    accum = `${accum}/${last}`;

    if (file.isDirectory) {
      // Directory entry only — ensure folder node, no file leaf
      const folder = ensureFolder(siblings, last, accum);
      if (!folder.status) folder.status = file.status;
      continue;
    }

    // File leaf
    const existing = siblings.find(n => !n.isDirectory && n.path === file.path);
    if (existing) {
      existing.file = file;
      existing.status = file.status;
    } else {
      siblings.push({
        name: last,
        path: file.path,
        isDirectory: false,
        file,
        status: file.status,
      });
    }
  }

  // Sort: folders first, then files; alpha within group
  const sortNodes = (nodes: ChangeTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    for (const n of nodes) {
      if (n.children?.length) sortNodes(n.children);
    }
  };
  sortNodes(root);
  return root;
}

/** Collect all file leaves under a folder node (for stage/unstage folder). */
export function collectFilePaths(node: ChangeTreeNode): string[] {
  if (!node.isDirectory) {
    return node.file && !node.file.isDirectory ? [node.file.path] : [];
  }
  const out: string[] = [];
  for (const c of node.children || []) {
    out.push(...collectFilePaths(c));
  }
  return out;
}
