// Registry entrypoint — tab opens this for media extensions
import React from 'react';
import type { CustomPreviewerProps } from '@/core/extensionAPI/registry/previewerRegistry';
import { PlayerShell } from './shell/PlayerShell';

export const MediaPreviewer: React.FC<CustomPreviewerProps> = ({ tabId, filePath }) => {
  return <PlayerShell tabId={tabId} filePath={filePath} />;
};

export default MediaPreviewer;
