// src/core/extensionAPI/registry/previewerRegistry.ts
import React from 'react';

export interface CustomPreviewerProps {
  tabId: string;
  filePath: string;
}

export interface PreviewerContribution {
  id: string;                 // e.g., "mscode.imagePreview" or "extId.vlc"
  name: string;               // e.g., "VLC Player"
  extensions: string[];       // e.g., [".mp3", ".mp4"]
  component: React.FC<CustomPreviewerProps>;
  priority: number;           // Higher priority wins
  /** Extension that registered this (if any) */
  extensionId?: string;
}

class PreviewerRegistry {
  private previewers: PreviewerContribution[] = [];

  /**
   * Register a file previewer. Same id replaces the previous entry.
   * Third-party extensions use this (via window.registerPreviewer) so heavy
   * viewers stay out of the core bundle.
   */
  public registerPreviewer(contribution: PreviewerContribution): void {
    const id = contribution.id;
    this.previewers = this.previewers.filter((p) => p.id !== id);
    this.previewers.push(contribution);
    this.previewers.sort((a, b) => b.priority - a.priority);
  }

  /** Remove a previewer by id (called on extension deactivate). */
  public unregisterPreviewer(id: string): void {
    this.previewers = this.previewers.filter((p) => p.id !== id);
  }

  /** Remove every previewer owned by an extension. */
  public unregisterByExtension(extensionId: string): void {
    this.previewers = this.previewers.filter((p) => p.extensionId !== extensionId);
  }

  /**
   * Highest-priority previewer that claims this file's extension.
   */
  public getPreviewerForExtension(fileName: string): PreviewerContribution | null {
    const extMatch = fileName.match(/\.[0-9a-z]+$/i);
    if (!extMatch) return null;
    const ext = extMatch[0].toLowerCase();
    return this.previewers.find((previewer) =>
      previewer.extensions.map((e) => e.toLowerCase()).includes(ext),
    ) || null;
  }

  public list(): ReadonlyArray<PreviewerContribution> {
    return this.previewers.slice();
  }
}

export const customPreviewerRegistry = new PreviewerRegistry();
