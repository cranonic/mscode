// src/core/bootstrap/previewerRegistration
//
// Core only keeps lightweight built-ins here.
// Heavy viewers (VLC media player, PDF, zip, SQL…) must register via
// window.registerPreviewer from an extension so the IDE binary stays small.
import { customPreviewerRegistry } from '@/core/extensionAPI/registry/previewerRegistry';
import { ImagePreviewer } from '@/ui/previewer/ImagePreviewer/ImagePreviewer';

export const registerPreviewer = (): void => {
  // Built-in image preview only — small, always needed for screenshots / assets
  customPreviewerRegistry.registerPreviewer({
    id: 'mscode.builtin.imagePreview',
    name: 'Mono Image Preview',
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'],
    component: ImagePreviewer,
    priority: 10,
  });

  // Media player is NOT registered here anymore.
  // Install / enable the "VLC Player" extension (mscode.vlc-player).
};
