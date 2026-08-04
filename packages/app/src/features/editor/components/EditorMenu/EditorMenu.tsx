// src/features/editor/components/EditorMenu.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEditorMenuStore } from '@/features/editor/components/EditorMenu/store/editorMenuStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { Icon } from '@/ui/components/Icon/IconRegistry';
import { ContextMenu } from '@/ui/components/ContextMenu/ContextMenu';
import type { MenuItem } from '@/store/menuStore';
import { useBackButtonStore } from '@/store/backButtonStore';
import './EditorMenu.css';

const EDGE = 10; // min margin from screen edges

/** Strip leading / trailing / consecutive separators. */
const trimSeparators = (items: MenuItem[]): MenuItem[] =>
  items
    .reduce<MenuItem[]>((acc, item) => {
      if (item.type === 'separator') {
        if (acc.length === 0) return acc;
        if (acc[acc.length - 1]?.type === 'separator') return acc;
      }
      acc.push(item);
      return acc;
    }, [])
    .filter(
      (item, idx, arr) =>
        item.type !== 'separator' ||
        arr.slice(idx + 1).some(r => r.type !== 'separator'),
    );

export const EditorContextMenu: React.FC = () => {
  const {
    isOpen, x, y, items,
    styleType: storeStyle,
    maxVisibleAndroid: storeLimit,
    moreIcon, activeHandle, closeEditorMenu,
  } = useEditorMenuStore();

  const { settings } = useSettingsStore();

  const styleType =
    settings['editor.contextMenuStyle'] || storeStyle || 'android';
  const maxVisibleAndroid =
    settings['editor.androidMenuOverflowLimit'] ?? storeLimit ?? 5;
  const overflowStyle =
    settings['editor.androidMenuOverflowStyle'] || 'more';
  const itemDisplay =
    settings['editor.androidMenuItemDisplay'] || 'icon';

  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ top: y, left: x });
  const [maxMenuHeight, setMaxMenuHeight] = useState<number | undefined>(undefined);
  const [showMore, setShowMore] = useState(false);
  const [dropdownDir, setDropdownDir] = useState<'down' | 'up'>('down');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [isReady, setIsReady] = useState(false);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [subPosition, setSubPosition] = useState<'right' | 'left'>('right');

  const cleanItems = trimSeparators(items);

  // ─── 1. MAIN MENU POSITION (bar or vertical list) ─────────────────────────
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) {
      setIsReady(false);
      setActiveSubId(null);
      setShowMore(false);
      setMaxMenuHeight(undefined);
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const TEARDROP_BOTTOM = 55;
    const TEARDROP_TOP = 25;

    // ── Horizontal: never leave the screen ──
    let newLeft = x - rect.width / 2;
    if (newLeft + rect.width > vw - EDGE) newLeft = vw - rect.width - EDGE;
    if (newLeft < EDGE) newLeft = EDGE;

    // ── Vertical ──
    let newTop: number;
    let heightCap: number | undefined;

    if (styleType === 'vertical') {
      // Prefer below handle/cursor; flip above if needed
      const preferBelow =
        activeHandle === 'start'
          ? y - rect.height - TEARDROP_TOP
          : y + TEARDROP_BOTTOM;

      if (preferBelow + rect.height <= vh - EDGE && preferBelow >= EDGE) {
        newTop = preferBelow;
      } else if (y - rect.height - TEARDROP_TOP >= EDGE) {
        // Fit above
        newTop = y - rect.height - TEARDROP_TOP;
      } else if (y + TEARDROP_BOTTOM + rect.height <= vh - EDGE) {
        // Fit below
        newTop = y + TEARDROP_BOTTOM;
      } else {
        // Doesn't fit either side → clamp + shrink height
        newTop = EDGE;
        const spaceBelow = vh - EDGE - newTop;
        heightCap = Math.max(120, Math.min(rect.height, spaceBelow));
        // If still overflows bottom after cap, stick to bottom
        if (newTop + Math.min(rect.height, heightCap) > vh - EDGE) {
          newTop = Math.max(EDGE, vh - EDGE - Math.min(rect.height, heightCap));
        }
      }

      // Final safety clamp
      if (newTop < EDGE) newTop = EDGE;
      if (newTop + (heightCap ?? rect.height) > vh - EDGE) {
        heightCap = Math.max(120, vh - EDGE - newTop);
      }
    } else {
      // Android horizontal bar — same teardrop-aware placement, no height shrink
      newTop =
        activeHandle === 'start'
          ? y - rect.height - TEARDROP_TOP
          : y + TEARDROP_BOTTOM;
      if (newTop < EDGE) newTop = y + TEARDROP_BOTTOM;
      if (newTop + rect.height > vh - EDGE) {
        newTop = y - rect.height - TEARDROP_TOP;
      }
      if (newTop < EDGE) newTop = EDGE;
      if (newTop + rect.height > vh - EDGE) {
        newTop = Math.max(EDGE, vh - rect.height - EDGE);
      }
    }

    setPosition({ top: newTop, left: newLeft });
    setMaxMenuHeight(heightCap);
    setDropdownDir(newTop + rect.height + 200 > vh ? 'up' : 'down');
    setShowMore(false);
    setDropdownStyle({});
    setIsReady(true);
  }, [isOpen, x, y, styleType, overflowStyle, activeHandle, cleanItems]);

  // ─── 2. OVERFLOW DROPDOWN (⋮) — clamp to screen relative to the bar ───────
  useLayoutEffect(() => {
    if (!showMore || !dropdownRef.current || !menuRef.current) {
      setDropdownStyle({});
      return;
    }

    const bar = menuRef.current.getBoundingClientRect();
    const dd = dropdownRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer align right edge of dropdown to right edge of bar (⋮ is on the right)
    let left = bar.width - dd.width; // relative to bar
    // Convert to check absolute
    let absLeft = bar.left + left;
    if (absLeft < EDGE) {
      left = EDGE - bar.left;
      absLeft = EDGE;
    }
    if (absLeft + dd.width > vw - EDGE) {
      left = vw - EDGE - dd.width - bar.left;
      absLeft = bar.left + left;
    }
    // If bar itself is near left and dropdown still overflows, pin to EDGE
    if (absLeft < EDGE) left = EDGE - bar.left;

    // Vertical: prefer below bar; flip above if needed
    let top: number | undefined;
    let bottom: number | undefined;
    let maxH: number | undefined;
    const gap = 4;
    const spaceBelow = vh - EDGE - (bar.bottom + gap);
    const spaceAbove = bar.top - gap - EDGE;

    if (dd.height <= spaceBelow || spaceBelow >= spaceAbove) {
      // Open downward
      top = bar.height + gap;
      if (dd.height > spaceBelow) {
        maxH = Math.max(100, spaceBelow);
      }
      setDropdownDir('down');
    } else {
      // Open upward
      bottom = bar.height + gap;
      if (dd.height > spaceAbove) {
        maxH = Math.max(100, spaceAbove);
      }
      setDropdownDir('up');
    }

    setDropdownStyle({
      left,
      ...(top !== undefined ? { top } : {}),
      ...(bottom !== undefined ? { bottom, top: 'auto' } : {}),
      ...(maxH !== undefined ? { maxHeight: maxH, overflowY: 'auto' } : {}),
      right: 'auto',
    });
  }, [showMore, cleanItems, position]);

  // ─── 3. Events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEditorMenu();
    };
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeEditorMenu();
      }
    };

    window.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, closeEditorMenu]);

  useEffect(() => {
    if (!isOpen) return;
    const handlerId = 'editor-menu-close-handler';
    useBackButtonStore.getState().push(handlerId, () => {
      closeEditorMenu();
      return true;
    });
    return () => {
      useBackButtonStore.getState().remove(handlerId);
    };
  }, [isOpen, closeEditorMenu]);

  if (!isOpen) return null;

  const handleItemClick = (e: React.MouseEvent, item: MenuItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.disabled) return;

    if (item.children?.length) {
      setActiveSubId(activeSubId === item.id ? null : item.id);
      return;
    }

    if (item.onClick) item.onClick(item.data);
    closeEditorMenu();
  };

  const isScrollable = styleType === 'android' && overflowStyle === 'scroll';
  const visibleItems = isScrollable
    ? cleanItems
    : styleType === 'android'
      ? cleanItems.slice(0, maxVisibleAndroid)
      : cleanItems;
  const overflowItems = isScrollable
    ? []
    : styleType === 'android'
      ? cleanItems.slice(maxVisibleAndroid)
      : [];

  const renderSubMenu = (item: MenuItem, isHorizontal: boolean) => {
    if (!item.children || activeSubId !== item.id) return null;
    return (
      <div
        style={{
          position: 'absolute',
          top: isHorizontal ? '100%' : '-4px',
          left: isHorizontal ? 0 : subPosition === 'right' ? '100%' : 'auto',
          right: isHorizontal ? 'auto' : subPosition === 'left' ? '100%' : 'auto',
          padding: isHorizontal
            ? '4px 0 0 0'
            : subPosition === 'right'
              ? '0 0 0 4px'
              : '0 4px 0 0',
          zIndex: 1000,
        }}
      >
        <ContextMenu
          items={trimSeparators(item.children)}
          isNested={true}
          style={{ position: 'relative', left: 'auto', top: 'auto' }}
        />
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      className={`ms-editor-context-menu ms-editor-menu-${styleType} ${
        isScrollable ? 'scrollable-container' : ''
      }`}
      style={{
        top: position.top,
        left: position.left,
        maxWidth: isScrollable ? '90vw' : 'auto',
        maxHeight: maxMenuHeight,
        opacity: isReady ? 1 : 0,
        pointerEvents: isReady ? 'auto' : 'none',
        overflow: styleType === 'vertical' && maxMenuHeight ? 'auto' : 'visible',
      }}
    >
      {/* ── Android horizontal bar ── */}
      {styleType === 'android' && (
        <div
          className={`ms-android-menu-bar ${
            isScrollable ? 'ms-android-scrollable' : ''
          }`}
        >
          {visibleItems.map((item, idx) =>
            item.type === 'separator' ? (
              <div key={`sep-${item.id || idx}`} className="ms-android-separator" />
            ) : (
              <div
                key={item.id}
                className={`ms-android-item ${item.disabled ? 'disabled' : ''} ${
                  activeSubId === item.id ? 'active-sub' : ''
                }`}
                style={{ position: 'relative' }}
                onMouseEnter={() =>
                  item.children?.length && setActiveSubId(item.id)
                }
                onMouseLeave={() =>
                  item.children?.length && setActiveSubId(null)
                }
                onClick={e => handleItemClick(e, item)}
              >
                {itemDisplay !== 'label' && item.icon && (
                  <Icon name={item.icon as any} size={18} />
                )}
                {itemDisplay !== 'icon' && item.label && (
                  <span>{item.label}</span>
                )}
                {renderSubMenu(item, true)}
              </div>
            ),
          )}

          {!isScrollable && overflowItems.length > 0 && (
            <div
              className="ms-android-item"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setShowMore(v => !v);
              }}
            >
              <Icon name={moreIcon} size={18} />
            </div>
          )}
        </div>
      )}

      {/* ── Vertical list OR android overflow dropdown ── */}
      {(styleType === 'vertical' ||
        (styleType === 'android' && showMore && !isScrollable)) && (
        <div
          ref={styleType === 'android' ? dropdownRef : undefined}
          className={`ms-vertical-menu ${
            styleType === 'android' ? 'ms-android-dropdown' : ''
          } ${
            styleType === 'android' && dropdownDir === 'up' ? 'dropdown-up' : ''
          }`}
          style={styleType === 'android' ? dropdownStyle : undefined}
        >
          {(styleType === 'vertical' ? cleanItems : trimSeparators(overflowItems)).map(
            (item, idx) =>
              item.type === 'separator' ? (
                <div key={`sep-${item.id || idx}`} className="ms-menu-separator" />
              ) : (
                <div
                  key={item.id}
                  className={`ms-vertical-item ${item.disabled ? 'disabled' : ''}`}
                  style={{ position: 'relative' }}
                  onMouseEnter={e => {
                    if (item.children?.length) {
                      setActiveSubId(item.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setSubPosition(
                        rect.right + 220 > window.innerWidth &&
                          rect.left - 220 > 0
                          ? 'left'
                          : 'right',
                      );
                    }
                  }}
                  onMouseLeave={() =>
                    item.children?.length && setActiveSubId(null)
                  }
                  onClick={e => handleItemClick(e, item)}
                >
                  <div className="ms-menu-icon-slot">
                    {item.icon && <Icon name={item.icon as any} size={16} />}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span className="ms-menu-label">{item.label}</span>
                    {item.description && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--ms-text-faded)',
                          marginLeft: '15px',
                        }}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                  {item.children?.length ? (
                    <div
                      className="ms-menu-icon-slot"
                      style={{ width: '16px', marginLeft: '10px' }}
                    >
                      <Icon name="chevron-right" size={14} />
                    </div>
                  ) : null}
                  {renderSubMenu(item, false)}
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
};
