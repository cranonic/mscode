// src/core/bootstrap/previewerRegistration
import { customPreviewerRegistry } from '@/core/extensionAPI/registry/previewerRegistry';
import { ImagePreviewer } from '@/ui/previewer/ImagePreviewer/ImagePreviewer';
import { MediaPreviewer } from '@/ui/previewer/MediaPlayer/MediaPreviewer';
import { MEDIA_PREVIEW_EXTENSIONS } from '@/ui/previewer/MediaPlayer/core/mediaKinds';
import { registerMediaPlayerCommands } from '@/ui/previewer/MediaPlayer/commands/registerMediaPlayerCommands';

export const registerPreviewer = (): void => {
  registerMediaPlayerCommands();
  // Built-in image preview (priority 10 — media player can sit above for shared types if needed)
  customPreviewerRegistry.registerPreviewer({
    id: 'mscode.builtin.imagePreview',
    name: 'Mono Image Preview',
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'],
    component: ImagePreviewer,
    priority: 10,
  });

  // VLC Mode media player — Phase 0 shell; engine in Phase 1
  customPreviewerRegistry.registerPreviewer({
    id: 'mscode.mediaPlayer.vlc',
    name: 'VLC Player',
    extensions: [...MEDIA_PREVIEW_EXTENSIONS],
    component: MediaPreviewer,
    priority: 50,
  });
};
