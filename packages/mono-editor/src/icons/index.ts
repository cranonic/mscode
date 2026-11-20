import './extras'; // registers non-codicon extras

export {
  codicon,
  registerExtraIcon,
  hasIcon,
  listCodicons,
  FIND_ICONS,
  FIND_ICON_SVG,
} from './codicons';
export type { CodiconId } from './codicons';
export { ensureExtraIcons } from './extras';
