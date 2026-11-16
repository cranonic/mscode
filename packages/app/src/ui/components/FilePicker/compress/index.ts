export { CompressModal } from './CompressModal';
export type { CompressModalProps } from './CompressModal';
export {
  prepareCompress,
  buildCompressPlan,
  planStaging,
  isContentUri,
  isForeignAppPath,
  isOwnAppPath,
  isShellReadablePath,
  needsStaging,
  shellPathFromUri,
  normalizeFsPath,
} from './compressService';
export type { CompressPlan, CompressPhase } from './compressService';
export * from './compressTypes';
