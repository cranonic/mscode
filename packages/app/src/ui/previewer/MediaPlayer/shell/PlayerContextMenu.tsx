/**
 * Media player context actions — uses the shared MSCode context menu
 * (useMenuStore), not a separate VLC-styled menu. One menu system app-wide.
 */
import type { MenuItem } from '@/store/menuStore';
import { useMenuStore } from '@/store/menuStore';

export interface PlayerMenuAction {
  id: string;
  label: string;
  disabled?: boolean;
  /** Rendered as separator when type === 'separator' */
  type?: 'item' | 'separator';
  onClick?: () => void;
}

/**
 * Open the standard IDE context menu at (x, y) with player actions.
 */
export function openPlayerContextMenu(
  x: number,
  y: number,
  actions: PlayerMenuAction[],
): void {
  const items: MenuItem[] = actions.map((a) => {
    if (a.type === 'separator') {
      return { id: a.id, type: 'separator' as const };
    }
    return {
      id: a.id,
      type: 'item' as const,
      label: a.label,
      disabled: a.disabled,
      onClick: a.onClick,
    };
  });

  useMenuStore.getState().openMenuDirect(x, y, items, 'top-left');
}

/** @deprecated Prefer openPlayerContextMenu — kept so old imports do not break. */
export type CtxItem = PlayerMenuAction;
