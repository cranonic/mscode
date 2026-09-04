export interface MediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  /** Object URL or data URL for cover art — revoke when done */
  artUrl?: string | null;
  /** Where art came from */
  artSource?: 'embedded' | 'folder' | 'none';
}

export type MetadataListener = (meta: MediaMetadata) => void;
