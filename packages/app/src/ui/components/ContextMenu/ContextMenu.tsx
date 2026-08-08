// src/ui/components/ContextMenu/ContextMenu.tsx

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './ContextMenu.css';
import { Icon } from '../Icon/IconRegistry';
import { useMenuStore, type MenuItem } from '@/store/menuStore';
import { useBackButtonStore } from '@/store/backButtonStore';

export interface ContextMenuProps {
  items: MenuItem[];
  style?: React.CSSProperties;
  isNested?: boolean;
  /**
   * Side from which this menu was spawned.
   * Anchors CSS scale animation origin.
   */
  openSide?: 'right' | 'left';
}

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
        item.type !== 'separator' || arr.slice(idx + 1).some((r) => r.type !== 'separator'),
    );

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  style,
  isNested,
  openSide = 'right',
}) => {
  const closeMenu = useMenuStore((s) => s.closeMenu);
  // Only root menu participates in store-level exit animation
  const isClosing = useMenuStore((s) => (isNested ? false : s.isClosing));

  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedStyle, setAdjustedStyle] = useState<React.CSSProperties>(style || {});
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [subPosition, setSubPosition] = useState<'right' | 'left'>('right');
  /** Nested menus: keep translate on outer node so scale animation does not wipe it. */
  const [nestedOffset, setNestedOffset] = useState({ x: 0, y: 0 });
  const [overlayArmed, setOverlayArmed] = useState(false);

  // Long-press open: the same gesture's mouseup/click must not dismiss immediately
  useEffect(() => {
    if (isNested) return;
    setOverlayArmed(false);
    const t = setTimeout(() => setOverlayArmed(true), 280);
    return () => clearTimeout(t);
  }, [isNested, items]);

  const transformOrigin = openSide === 'left' ? 'top right' : 'top left';

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();

    if (!isNested && style) {
      let newLeft = Number(style.left) || 0;
      let newTop = Number(style.top) || 0;

      if (newLeft + rect.width > window.innerWidth) newLeft = window.innerWidth - rect.width - 10;
      if (newLeft < 0) newLeft = 10;
      if (newTop + rect.height > window.innerHeight) newTop = window.innerHeight - rect.height - 10;
      if (newTop < 0) newTop = 10;

      setAdjustedStyle({ ...style, left: newLeft, top: newTop });
      return;
    }

    if (!isNested) return;

    // ── Sub-menu: measure natural position, then compute clamp offset ──
    // Outer wrapper holds translate; inner .ms-context-menu holds scale animation.
    let yOffset = 0;
    if (rect.bottom > window.innerHeight) yOffset = window.innerHeight - rect.bottom - 10;
    if (rect.top + yOffset < 0) yOffset = -rect.top + 10;

    const parentItem = menuRef.current.parentElement?.closest('.ms-context-menu-item');
    const parentMenu = parentItem?.closest('.ms-context-menu');

    let xOffset = 0;

    if (parentItem && parentMenu) {
      const parentItemRect = parentItem.getBoundingClientRect();
      const parentMenuRect = parentMenu.getBoundingClientRect();
      const minOverlap = rect.width * 0.1;

      const naturalLeft =
        subPosition === 'right' ? parentItemRect.right : parentItemRect.left - rect.width;
      let targetLeft = naturalLeft;

      if (subPosition === 'right') {
        if (naturalLeft + rect.width > window.innerWidth) {
          if (parentItemRect.left > window.innerWidth - parentItemRect.right) {
            targetLeft = parentItemRect.left - rect.width;
            if (targetLeft < 10) {
              targetLeft = 10;
              const minRight = parentMenuRect.left + minOverlap;
              if (targetLeft + rect.width < minRight) targetLeft = minRight - rect.width;
            }
          } else {
            targetLeft = window.innerWidth - rect.width - 10;
            const maxLeft = parentMenuRect.right - minOverlap;
            if (targetLeft > maxLeft) targetLeft = maxLeft;
          }
        }
      } else {
        if (naturalLeft < 0) {
          if (window.innerWidth - parentItemRect.right > parentItemRect.left) {
            targetLeft = parentItemRect.right;
            if (targetLeft + rect.width > window.innerWidth - 10) {
              targetLeft = window.innerWidth - rect.width - 10;
              const minLeft = parentMenuRect.right - minOverlap;
              if (targetLeft < minLeft) targetLeft = minLeft;
            }
          } else {
            targetLeft = 10;
            const minRight = parentMenuRect.left + minOverlap;
            if (targetLeft + rect.width < minRight) targetLeft = minRight - rect.width;
          }
        }
      }

      xOffset = targetLeft - naturalLeft;
    } else {
      if (rect.right > window.innerWidth) xOffset = window.innerWidth - rect.right - 10;
      if (rect.left < 0) xOffset = -rect.left + 10;
    }

    setNestedOffset({ x: xOffset, y: yOffset });
    // Nested: position is relative inside absolute host — style stays relative
    setAdjustedStyle({ position: 'relative', left: 'auto', top: 'auto' });
  }, [style, isNested, items, subPosition]);

  useEffect(() => {
    if (!isNested && items.length > 0) {
      window.navigator.vibrate?.(10);
      const handlerId = 'global-context-menu-handler';
      useBackButtonStore.getState().push(handlerId, () => {
        closeMenu();
        return true;
      });
      return () => {
        useBackButtonStore.getState().remove(handlerId);
      };
    }
  }, [isNested, items.length, closeMenu]);

  useEffect(() => {
    if (activeSubId) {
      const handlerId = `context-menu-sub-${activeSubId}`;
      useBackButtonStore.getState().push(handlerId, () => {
        setActiveSubId(null);
        return true;
      });
      return () => {
        useBackButtonStore.getState().remove(handlerId);
      };
    }
  }, [activeSubId]);

  if (items.length === 0 && !isNested) return null;

  const menuNode = (
    <div
      ref={menuRef}
      className={`ms-context-menu${isClosing ? ' ms-context-menu--closing' : ''}`}
      style={{
        ...adjustedStyle,
        overflow: 'visible',
        transformOrigin,
      }}
    >
      {trimSeparators(items).map((item, index) => {
        if (item.type === 'separator') {
          return <div key={`sep-${item.id}-${index}`} className="ms-menu-separator" />;
        }

        const hasChildren = !!item.children?.length;

        return (
          <div
            key={item.id}
            className={`ms-context-menu-item ${item.disabled ? 'disabled' : ''} ${
              activeSubId === item.id ? 'active-sub' : ''
            }`}
            style={{ position: 'relative' }}
            onMouseEnter={(e) => {
              if (hasChildren) {
                setActiveSubId(item.id);
                const r = e.currentTarget.getBoundingClientRect();
                if (r.right + 220 > window.innerWidth && r.left - 220 > 0) {
                  setSubPosition('left');
                } else {
                  setSubPosition('right');
                }
              }
            }}
            onMouseLeave={() => hasChildren && setActiveSubId(null)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.disabled) return;
              if (hasChildren) {
                setActiveSubId(activeSubId === item.id ? null : item.id);
                return;
              }
              if (item.onClick) item.onClick(item.data);
              closeMenu();
            }}
          >
            <div className="ms-menu-icon-slot" style={{ width: '24px', flexShrink: 0 }}>
              {item.checked ? (
                <Icon name="check" size={14} />
              ) : item.icon ? (
                <Icon name={item.icon as any} size={14} />
              ) : null}
            </div>

            <div className="ms-menu-label">{item.label}</div>
            {item.shortcut && <div className="ms-menu-shortcut">{item.shortcut}</div>}

            {hasChildren && (
              <div className="ms-menu-icon-slot" style={{ width: '16px', marginLeft: '10px' }}>
                <Icon name="chevron-right" size={14} />
              </div>
            )}

            {hasChildren && activeSubId === item.id && item.children && (
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: subPosition === 'right' ? '100%' : 'auto',
                  right: subPosition === 'left' ? '100%' : 'auto',
                  padding: subPosition === 'right' ? '0 0 0 4px' : '0 4px 0 0',
                  zIndex: 1000,
                }}
              >
                <ContextMenu
                  items={trimSeparators(item.children)}
                  isNested={true}
                  style={{ position: 'relative', left: 'auto', top: 'auto' }}
                  openSide={subPosition}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {!isNested && (
        <div
          className={`ms-context-menu-overlay${overlayArmed ? ' ms-context-menu-overlay--armed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (overlayArmed) closeMenu();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (overlayArmed) closeMenu();
          }}
        />
      )}

      {/* Nested: outer translate wrapper so scale animation cannot clobber position */}
      {isNested ? (
        <div
          style={{
            transform: `translate(${nestedOffset.x}px, ${nestedOffset.y}px)`,
            position: 'relative',
          }}
        >
          {menuNode}
        </div>
      ) : (
        menuNode
      )}
    </>
  );
};
