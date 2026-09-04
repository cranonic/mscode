import { useEffect, useState } from 'react';
import {
  loadMediaMetadata,
  revokeMetadataArt,
} from '../core/metadata/MetadataService';
import type { MediaMetadata } from '../core/metadata/types';

export function useMediaMetadata(filePath: string) {
  const [meta, setMeta] = useState<MediaMetadata>({
    title: undefined,
    artUrl: null,
    artSource: 'none',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let current: MediaMetadata | null = null;
    setLoading(true);

    loadMediaMetadata(filePath)
      .then((m) => {
        if (!alive) {
          revokeMetadataArt(m);
          return;
        }
        current = m;
        setMeta(m);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      revokeMetadataArt(current);
    };
  }, [filePath]);

  return { meta, loading };
}
