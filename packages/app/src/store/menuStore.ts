
// src/store/menuStore.ts

import { create } from 'zustand';
import { contextKeyService } from '@/core/keybindings/contextKeyService';

/**
 * Represents a dynamically resolvable node in the hierarchical context menu tree.
 * Used by Context Menus, Sidebar Actions, and Activity Bar tools.
 */
export interface MenuItem {
  id: string;
  type?: 'item' | 'separator';
  label?: string;
  icon?: string | any;
  checked?: boolean;
  disabled?: boolean;
  shortcut?: string;
  description?: string;
  when?: string | boolean;
  showOnlyWhenSubOptionAvailable?: boolean;
  children?: MenuItem[];
  onClick?: (data?: any) => void;
  data?: any;
  order?: number; 
  views?: any[]; 
  flat?: boolean | number; 
}

export interface MenuGroup {
  options: MenuItem[];
}

export interface MenuState {
  isOpen: boolean;
  /** True while exit animation plays — host should keep menu mounted. */
  isClosing: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
  dynamicHistory: Record<string, MenuItem[]>;

  openMenu: (menuId: string, x: number, y: number, defaultItems?: MenuGroup[] | MenuItem[]) => void;
  openMenuDirect: (x: number, y: number, items: MenuItem[]) => void;
  closeMenu: () => void;
  /**
   * Actually tears the menu down (isOpen:false, items cleared). Called by
   * ContextMenu.tsx's `onAnimationEnd` the instant the exit animation
   * finishes — whatever duration that animation has, including 0ms or none
   * at all. This is what makes close latency track the stylesheet exactly,
   * instead of a hand-maintained JS timer that can drift out of sync with it.
   */
  finalizeClose: () => void;
  /** Immediate teardown without animation (e.g. app background). */
  forceCloseMenu: () => void;

  registeredMenus: Record<string, MenuItem[]>;
  registerMenuItem: (menuPath: string, item: MenuItem) => void;
  registerMenuItems: (menuPath: string, item: MenuItem | MenuItem[]) => void;
  
  unregisterMenuItem: (menuPath: string, itemId: string) => void;
  unregisterMenuItems: (menuPath: string, itemIds: string[]) => void;
}

// ─── CORE LOGIC: DEEP MERGE & IMPLICIT CHILDREN ────────────────────────────

/**
 * Normalizes a menu item by automatically converting parent-level actions 
 * into a standard implicit child node, ensuring robust expandability.
 */
const normalizeMenuItem = (item: MenuItem): MenuItem => {
  const normalized = { ...item };

  // Recursively normalize any explicitly provided children
  if (normalized.children) {
    normalized.children = normalized.children.map(child => normalizeMenuItem(child));
  }

  // Auto-Implicit Child: If dev provides onClick but NO children, we wrap it inside an implicit child.
  if (normalized.onClick && (!normalized.children || normalized.children.length === 0)) {
    normalized.children = [
      {
        id: `${normalized.id}.children-1`,
        label: normalized.label,
        icon: normalized.icon,
        onClick: normalized.onClick,
        // We do not inherit order here because parent order handles UI placement
      }
    ];
    // Remove onClick from parent to strictly enforce it as a container
    delete normalized.onClick;
  }

  return normalized;
};

/**
 * Deeply merges an incoming menu item with an existing one.
 * Preserves existing properties (triple-dot logic) and recursively merges children.
 */
const mergeMenuItem = (existing: MenuItem, incoming: MenuItem): MenuItem => {
  // 1. Shallow merge base properties (incoming overwrites existing if provided)
  const merged: MenuItem = { ...existing, ...incoming };

  // 2. Deep merge children if they exist in either object
  if (existing.children || incoming.children) {
    const existingChildren = existing.children || [];
    const incomingChildren = incoming.children || [];

    const childrenMap = new Map<string, MenuItem>();

    // Map existing children first
    existingChildren.forEach(c => childrenMap.set(c.id, c));

    // Override or append incoming children
    incomingChildren.forEach(incChild => {
      if (childrenMap.has(incChild.id)) {
        // Deep merge sub-child recursively
        childrenMap.set(incChild.id, mergeMenuItem(childrenMap.get(incChild.id)!, incChild));
      } else {
        // Add new sub-child
        childrenMap.set(incChild.id, incChild);
      }
    });

    merged.children = Array.from(childrenMap.values());
    // Sort children by order
    merged.children.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  return merged;
};

// ─── STORE IMPLEMENTATION ──────────────────────────────────────────────────

let closeSafetyTimer: ReturnType<typeof setTimeout> | null = null;
// Backstop only -- NOT the thing that actually times the close. The real
// close is driven by ContextMenu.tsx calling finalizeClose() from its
// `onAnimationEnd`, the instant the exit animation finishes, whatever its
// duration is (150ms, 0ms, or -- since a zero-duration animation still
// fires the event -- effectively instant). This timer only fires as a
// safety net if that event never arrives for some reason (e.g. someone
// swaps `animation: none` in instead of a 0s duration, so no animation
// ever runs and no animationend event is ever dispatched).
const CLOSE_SAFETY_FALLBACK_MS = 400;

export const useMenuStore = create<MenuState>((set, _get) => ({
  isOpen: false,
  isClosing: false,
  position: { x: 0, y: 0 },
  items: [],
  registeredMenus: {},
  
  dynamicHistory: {}, // for only developer tools like menu page

  openMenu: (menuId, x, y, defaultItems = []) => set((state) => {
    if (closeSafetyTimer) { clearTimeout(closeSafetyTimer); closeSafetyTimer = null; }

    
    // SILENT SNIFFER
    let updatedHistory = state.dynamicHistory;
    
    if (defaultItems && defaultItems.length > 0) {
      const isGrouped = 'options' in (defaultItems[0] as any);
      
      const flatIncomingItems = isGrouped 
        ? (defaultItems as any[]).flatMap(g => g.options || []) 
        : (defaultItems as any[]);

      const existing = state.dynamicHistory[menuId] || [];
      const map = new Map(existing.map((item: any) => [item.id, item]));
      
      flatIncomingItems.forEach((item: any) => {
        if (item && item.id) {
          map.set(item.id, { ...(map.get(item.id) || {}), ...item });
        }
      });

      updatedHistory = { 
        ...state.dynamicHistory, 
        [menuId]: Array.from(map.values()) 
      };
    }

    const resolvedItems = getResolvedMenu(menuId, defaultItems);
    
    return { 
      isOpen: true,
      isClosing: false,
      position: { x, y }, 
      items: resolvedItems,
      dynamicHistory: updatedHistory 
    };
  }),

  openMenuDirect: (x, y, items) => {
    if (closeSafetyTimer) { clearTimeout(closeSafetyTimer); closeSafetyTimer = null; }
    if (items.length > 0) {
      set({ isOpen: true, isClosing: false, position: { x, y }, items });
    }
  },

  closeMenu: () => {
    const { isOpen, isClosing } = _get();
    if (!isOpen || isClosing) return;

    // Exit duration from CSS (--ms-menu-exit-ms). Default 0 = Android-native
    // instant dismiss — no isClosing frame, no animationend wait, no 400ms safety.
    let exitMs = 0;
    try {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--ms-menu-exit-ms')
        .trim();
      if (raw) exitMs = parseFloat(raw) || 0;
    } catch { /* SSR / no DOM */ }

    if (exitMs <= 0) {
      if (closeSafetyTimer) { clearTimeout(closeSafetyTimer); closeSafetyTimer = null; }
      set({ isOpen: false, isClosing: false, items: [] });
      return;
    }

    // Animated exit path (only when --ms-menu-exit-ms > 0)
    set({ isClosing: true });
    if (closeSafetyTimer) clearTimeout(closeSafetyTimer);
    closeSafetyTimer = setTimeout(() => {
      closeSafetyTimer = null;
      set({ isOpen: false, isClosing: false, items: [] });
    }, Math.max(exitMs + 50, CLOSE_SAFETY_FALLBACK_MS));
  },

  finalizeClose: () => {
    if (closeSafetyTimer) { clearTimeout(closeSafetyTimer); closeSafetyTimer = null; }
    const { isOpen, isClosing } = _get();
    if (!isOpen && !isClosing) return; // already finalized (e.g. safety timer beat us to it)
    set({ isOpen: false, isClosing: false, items: [] });
  },

  forceCloseMenu: () => {
    if (closeSafetyTimer) { clearTimeout(closeSafetyTimer); closeSafetyTimer = null; }
    set({ isOpen: false, isClosing: false, items: [] });
  },

  // Using Smart Merge System
  registerMenuItem: (menuPath, item) => {
    set((state) => {
      const menus = { ...state.registeredMenus };
      if (!menus[menuPath]) menus[menuPath] = [];

      const normalizedIncoming = normalizeMenuItem(item);
      const existingIndex = menus[menuPath].findIndex(i => i.id === normalizedIncoming.id);

      if (existingIndex >= 0) {
        // Deep Override / Merge
        menus[menuPath][existingIndex] = mergeMenuItem(menus[menuPath][existingIndex], normalizedIncoming);
      } else {
        menus[menuPath].push(normalizedIncoming);
      }

      return { registeredMenus: menus };
    });
  },
  
  // Using Smart Merge System for Arrays
  registerMenuItems: (menuPath, item) => {
    const items = Array.isArray(item) ? item : [item];
    set((state) => {
      const menus = { ...state.registeredMenus };
      if (!menus[menuPath]) menus[menuPath] = [];
      
      items.forEach(i => {
        const normalizedIncoming = normalizeMenuItem(i);
        const existingIndex = menus[menuPath].findIndex(existing => existing.id === normalizedIncoming.id);
        
        if (existingIndex >= 0) {
          // Deep Override / Merge
          menus[menuPath][existingIndex] = mergeMenuItem(menus[menuPath][existingIndex], normalizedIncoming);
        } else {
          menus[menuPath].push(normalizedIncoming);
        }
      });

      return { registeredMenus: menus };
    });
  },

  unregisterMenuItem: (menuPath, itemId) => {
    set((state) => {
      const menus = { ...state.registeredMenus };
      if (menus[menuPath]) {
        menus[menuPath] = menus[menuPath].filter(i => i.id !== itemId);
      }
      return { registeredMenus: menus };
    });
  },
  
  unregisterMenuItems: (menuPath, itemIds) => {
    set((state) => {
      const menus = { ...state.registeredMenus };
      if (menus[menuPath]) {
        menus[menuPath] = menus[menuPath].filter(i => !itemIds.includes(i.id));
      }
      return { registeredMenus: menus };
    });
  },
}));

// ─── RESOLUTION & FLATTENING ───────────────────────────────────────────────

const evaluateWhen = (when?: string | boolean): boolean => {
  if (when === undefined) return true;
  if (typeof when === 'boolean') return when;
  return contextKeyService.evaluate(when);
};

const resolveMenuNode = (item: MenuItem, baseId: string): MenuItem | MenuItem[] | null => {
  if (!evaluateWhen(item.when)) return null;
  
  const resolved: MenuItem = { ...item };
  
  if (resolved.children && resolved.children.length > 0) {
    resolved.children = resolved.children
      .flatMap(child => {
        const res = resolveMenuNode(child, `${baseId}/${child.id}`);
        if (!res) return [];
        return Array.isArray(res) ? res : [res];
      });
      
    resolved.children.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  if (resolved.showOnlyWhenSubOptionAvailable && (!resolved.children || resolved.children.length === 0)) {
    return null;
  }
  
  // Auto-Flat Check: Exactly 1 child
  const isAutoFlat = resolved.children && resolved.children.length === 1 && resolved.flat !== false;
  
  if (resolved.flat || isAutoFlat) {
    // Crucial: When unpacking an implicit child, it must inherit the parent's layout 'order' 
    // to maintain its correct position in the UI toolbar.
    return (resolved.children || []).map(child => ({
      ...child,
      order: child.order !== undefined ? child.order : resolved.order
    }));
  }
  
  return resolved;
};

export const getResolvedMenu = (menuId: string, defaults: MenuGroup[] | MenuItem[] = []): MenuItem[] => {
  let finalItems: MenuItem[] = [];
  const seenIds = new Set<string>();
  const isGrouped = defaults.length > 0 && 'options' in (defaults[0] as any);

  if (isGrouped) {
    (defaults as MenuGroup[]).forEach((group, index) => {
      const resolvedGroup = group.options
        .flatMap(item => {
          const res = resolveMenuNode(item, `${menuId}/${item.id}`);
          if (!res) return [];
          return Array.isArray(res) ? res : [res];
        });

      if (resolvedGroup.length > 0) {
        if (finalItems.length > 0) finalItems.push({ id: `sep-${index}`, type: 'separator' });
        resolvedGroup.forEach(item => {
          if (item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            finalItems.push(item);
          }
        });
      }
    });
  } else {
    const resolvedDefaults = (defaults as MenuItem[])
      .flatMap(item => {
        const res = resolveMenuNode(item, `${menuId}/${item.id}`);
        if (!res) return [];
        return Array.isArray(res) ? res : [res];
      });

    resolvedDefaults.forEach(item => {
      if (item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        finalItems.push(item);
      }
    });
  }

  const rootExternals = useMenuStore.getState().registeredMenus[menuId] || [];
  const resolvedExternals = rootExternals
    .flatMap(item => {
      const res = resolveMenuNode(item, `${menuId}/${item.id}`);
      if (!res) return [];
      return Array.isArray(res) ? res : [res];
    });

  if (resolvedExternals.length > 0) {
    if (finalItems.length > 0 && finalItems[finalItems.length - 1].type !== 'separator') {
      finalItems.push({ id: `ext-sep-${menuId}`, type: 'separator' });
    }
    
    resolvedExternals.forEach(item => {
      if (item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        finalItems.push(item);
      } else if (!item.id) {
        finalItems.push(item);
      }
    });
  }

  finalItems.sort((a, b) => (a.order || 0) - (b.order || 0));
  return finalItems;
};