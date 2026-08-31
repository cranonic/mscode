// src/ui/layouts/MainLayout/components/TopBar/Tabs.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTabStore } from '@/store/tabStore';
import { useEditorViewStateStore } from '@/features/editor/store/editorViewStateStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useDecorationStore } from '@/features/explorer/store/decorationStore';
import { Icon } from '@/ui/components/Icon/IconRegistry';
import { FileIcon } from '@/ui/components/FileIcon/DefaultIconTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard } from '@capacitor/keyboard';
import { useBackButtonStore } from '@/store/backButtonStore';

const TabActionBtn: React.FC<{ isDirty: boolean; onClose: (e: React.MouseEvent) => void }> = ({ isDirty, onClose }) => (
  <span className="tab-action-btn" onClick={onClose}>
    {isDirty ? <span className="tab-dirty-indicator" /> : <Icon name="close" size={14} />}
  </span>
);

const DecorationBadge: React.FC<{ badge: string; color: string; tooltip?: string }> = ({ badge, color, tooltip }) => (
  <span
    title={tooltip}
    style={{
      fontSize: '10px',
      fontWeight: 700,
      color,
      marginLeft: '6px',
      marginRight: '2px',
      flexShrink: 0,
      lineHeight: 1,
    }}
  >
    {badge}
  </span>
);

const LONG_PRESS_MS = 400;
/** Edge zone width — deeper into zone = faster scroll (Android-like) */
const EDGE_SCROLL_ZONE = 72;
const EDGE_SCROLL_MIN = 1.5;
const EDGE_SCROLL_MAX = 18;

type GhostTab = {
  id: string;
  title: string;
  dirty: boolean;
  icon?: string;
  decoration?: { badge: string; color: string; tooltip?: string } | null;
};

export const Tabs: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs } = useTabStore();
  const { viewStates } = useEditorViewStateStore();
  const { settings } = useSettingsStore();
  const decorations = useDecorationStore(s => s.decorations);

  const closeOnClick = settings['workbench.editor.closeOverviewOnClick'] ?? true;
  const reappearMode = settings['workbench.editor.tabPopupReappearMode'] ?? false;
  const showTabsIcon = settings['workbench.editor.showTabsIcon'] ?? true;
  const showTabsIconOnPopup = settings['workbench.editor.showTabsIconOnPopup'] ?? true;

  const [showOverview, setShowOverview] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [dynamicBgStyle, setDynamicBgStyle] = useState<React.CSSProperties>({});

  // ── Drag-to-reorder ────────────────────────────────────────────────────
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragOffsetX = useRef(0);
  const autoScrollRaf = useRef<number | null>(null);
  const scrollSpeedRef = useRef(0); // signed px/frame, updated every move
  const didDragRef = useRef(false);
  const draggingIdRef = useRef<string | null>(null);
  const insertIndexRef = useRef<number | null>(null);
  const liveOrderRef = useRef<string[]>([]);
  const pendingTabIdRef = useRef<string | null>(null);
  /** True while finger is down on a tab (blocks container vertical drag) */
  const tabPointerDownRef = useRef(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [dragW, setDragW] = useState(0);
  const [dragH, setDragH] = useState(35);
  const [liveOrder, setLiveOrder] = useState<string[]>([]);
  const [ghostTab, setGhostTab] = useState<GhostTab | null>(null);
  /** Blocks framer vertical drag while interacting with a tab */
  const [blockContainerDrag, setBlockContainerDrag] = useState(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRaf.current != null) {
      cancelAnimationFrame(autoScrollRaf.current);
      autoScrollRaf.current = null;
    }
    scrollSpeedRef.current = 0;
  }, []);

  const getInsertIndexFromX = useCallback((clientX: number, order: string[], excludeId: string) => {
    const others = order.filter(id => id !== excludeId);
    for (let i = 0; i < others.length; i++) {
      const el = tabRefs.current.get(others[i]);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (clientX < mid) return i;
    }
    return others.length;
  }, []);

  /**
   * Android-like edge scroll speed:
   * - distance into edge zone → 0..1 depth
   * - quadratic curve so deep edge feels faster (momentum)
   * - pulling back toward center slows down smoothly
   */
  const computeEdgeScrollSpeed = useCallback((clientX: number) => {
    const container = tabContainerRef.current;
    if (!container) return 0;
    const crect = container.getBoundingClientRect();

    if (clientX < crect.left + EDGE_SCROLL_ZONE) {
      const dist = Math.max(0, clientX - crect.left);
      const depth = 1 - dist / EDGE_SCROLL_ZONE; // 0 at zone edge, 1 at outer edge
      const t = depth * depth; // ease-in (momentum)
      return -(EDGE_SCROLL_MIN + t * (EDGE_SCROLL_MAX - EDGE_SCROLL_MIN));
    }
    if (clientX > crect.right - EDGE_SCROLL_ZONE) {
      const dist = Math.max(0, crect.right - clientX);
      const depth = 1 - dist / EDGE_SCROLL_ZONE;
      const t = depth * depth;
      return EDGE_SCROLL_MIN + t * (EDGE_SCROLL_MAX - EDGE_SCROLL_MIN);
    }
    return 0;
  }, []);

  const ensureAutoScrollLoop = useCallback(() => {
    if (autoScrollRaf.current != null) return;
    const step = () => {
      if (!draggingIdRef.current || !tabContainerRef.current) {
        autoScrollRaf.current = null;
        return;
      }
      const spd = scrollSpeedRef.current;
      if (spd !== 0) {
        tabContainerRef.current.scrollLeft += spd;
      }
      autoScrollRaf.current = requestAnimationFrame(step);
    };
    autoScrollRaf.current = requestAnimationFrame(step);
  }, []);

  const startDragging = useCallback((tabId: string, clientX: number, clientY?: number) => {
    const el = tabRefs.current.get(tabId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffsetX.current = clientX - rect.left;
    draggingIdRef.current = tabId;

    const base = tabs.map(t => t.id);
    const idx = base.indexOf(tabId);
    insertIndexRef.current = idx;
    liveOrderRef.current = base;

    setDraggingId(tabId);
    setBlockContainerDrag(true);
    setDragX(rect.left);
    // Ghost stays on the tab-bar row
    setDragY(rect.top);
    setDragW(rect.width);
    setDragH(rect.height);
    setLiveOrder(base);

    // Capture on container (tab node is replaced by placeholder on next render)
    try {
      tabContainerRef.current?.setPointerCapture(pointerIdRef.current!);
    } catch { /* ignore */ }

    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      const decoration = tab.filePath ? decorations[tab.filePath] : null;
      setGhostTab({
        id: tab.id,
        title: tab.title,
        dirty: viewStates[tab.id]?.isDirty ?? false,
        icon: tab.icon,
        decoration: decoration ?? null,
      });
    }

    didDragRef.current = true;
    try {
      if (navigator.vibrate) navigator.vibrate(12);
    } catch { /* ignore */ }
  }, [tabs, decorations, viewStates]);

  const finishDrag = useCallback(() => {
    stopAutoScroll();
    clearLongPress();

    const id = draggingIdRef.current;
    const order = liveOrderRef.current;

    if (id != null && order.length > 0) {
      const storeIds = useTabStore.getState().tabs.map(t => t.id);
      const changed = order.length === storeIds.length && order.some((tid, i) => storeIds[i] !== tid);
      if (changed) {
        reorderTabs(order);
      }
    }

    // Release pointer capture
    try {
      if (pointerIdRef.current != null) {
        tabContainerRef.current?.releasePointerCapture(pointerIdRef.current);
      }
    } catch { /* ignore */ }

    draggingIdRef.current = null;
    insertIndexRef.current = null;
    pointerIdRef.current = null;
    pendingTabIdRef.current = null;
    tabPointerDownRef.current = false;
    liveOrderRef.current = [];

    setDraggingId(null);
    setBlockContainerDrag(false);
    setLiveOrder([]);
    setDragX(0);
    setGhostTab(null);
  }, [stopAutoScroll, clearLongPress, reorderTabs]);

  const onPointerDownTab = useCallback((e: React.PointerEvent, tabId: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if ((e.target as HTMLElement).closest('.tab-action-btn')) return;
    if (draggingIdRef.current) return;

    // Critical: stop framer-motion container from capturing this as vertical drag
    e.stopPropagation();

    pointerIdRef.current = e.pointerId;
    pendingTabIdRef.current = tabId;
    tabPointerDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    didDragRef.current = false;
    setBlockContainerDrag(true);

    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      if (pendingTabIdRef.current === tabId && pointerIdRef.current === e.pointerId) {
        startDragging(tabId, startXRef.current, startYRef.current);
      }
    }, LONG_PRESS_MS);
  }, [clearLongPress, startDragging]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!draggingIdRef.current) {
      // During long-press wait:
      // - Only cancel if user clearly pulls DOWN (overview gesture), not horizontal
      // - This was the bug: any small move cancelled long-press / blocked L-R drag
      const isVerticalPull = Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx) * 1.4;
      if (isVerticalPull) {
        clearLongPress();
        tabPointerDownRef.current = false;
        setBlockContainerDrag(false);
        pendingTabIdRef.current = null;
        pointerIdRef.current = null;
        return;
      }

      // Desktop: start reorder after small horizontal move without full long-press
      if (
        isDesktop &&
        pendingTabIdRef.current &&
        Math.abs(dx) > 6 &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        clearLongPress();
        startDragging(pendingTabIdRef.current, e.clientX, e.clientY);
      }
      return;
    }

    // ── Active horizontal reorder drag ───────────────────────────────────
    e.preventDefault();
    e.stopPropagation?.();

    setDragX(e.clientX - dragOffsetX.current);
    // Keep ghost on the tab bar row (more natural for tab reorder)
    const barTop = tabContainerRef.current?.getBoundingClientRect().top;
    if (barTop != null) setDragY(barTop);

    const dragId = draggingIdRef.current;
    const newIndex = getInsertIndexFromX(e.clientX, liveOrderRef.current, dragId);
    if (newIndex !== insertIndexRef.current) {
      insertIndexRef.current = newIndex;
      const others = liveOrderRef.current.filter(id => id !== dragId);
      const next = [...others.slice(0, newIndex), dragId, ...others.slice(newIndex)];
      liveOrderRef.current = next;
      setLiveOrder(next);
    }

    // Progressive edge scroll (Android momentum feel)
    scrollSpeedRef.current = computeEdgeScrollSpeed(e.clientX);
    if (scrollSpeedRef.current !== 0) {
      ensureAutoScrollLoop();
    }
  }, [
    isDesktop,
    clearLongPress,
    startDragging,
    getInsertIndexFromX,
    computeEdgeScrollSpeed,
    ensureAutoScrollLoop,
  ]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    clearLongPress();
    if (draggingIdRef.current) {
      finishDrag();
    } else {
      pointerIdRef.current = null;
      pendingTabIdRef.current = null;
      tabPointerDownRef.current = false;
      setBlockContainerDrag(false);
    }
  }, [clearLongPress, finishDrag]);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  useEffect(() => {
    return () => {
      clearLongPress();
      stopAutoScroll();
    };
  }, [clearLongPress, stopAutoScroll]);

  // Disable vertical pull-down while tab pointer is down or reordering
  const containerDragEnabled = !blockContainerDrag && !draggingId;

  useEffect(() => {
    if (showOverview) {
      const handlerId = 'tab-overview-close-handler';
      useBackButtonStore.getState().push(handlerId, () => {
        setShowOverview(false);
        return true;
      });
      return () => {
        useBackButtonStore.getState().remove(handlerId);
      };
    }
  }, [showOverview]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) return;
    let showSub: any;
    let hideSub: any;
    const initKeyboardListeners = async () => {
      try {
        showSub = await Keyboard.addListener('keyboardWillShow', () => setIsKeyboardOpen(true));
        hideSub = await Keyboard.addListener('keyboardWillHide', () => setIsKeyboardOpen(false));
      } catch (err) {
        console.warn('Capacitor Keyboard plugin not found.', err);
      }
    };
    initKeyboardListeners();
    return () => {
      if (showSub) showSub.remove();
      if (hideSub) hideSub.remove();
    };
  }, [isDesktop]);

  useEffect(() => {
    if (showOverview) {
      const generateRandomPattern = (): React.CSSProperties => {
        const numShapes = Math.floor(Math.random() * 5) + 5;
        const images: string[] = [];
        const sizes: string[] = [];
        const positions: string[] = [];

        for (let i = 0; i < numShapes; i++) {
          const colorChance = Math.random();
          let fill = 'none';
          let stroke = 'none';
          let strokeWidth = '1';

          if (colorChance < 0.15) {
            fill = 'rgba(144, 238, 144, 0.08)';
            stroke = 'none';
            strokeWidth = '0';
          } else if (colorChance < 0.575) {
            fill = 'rgba(173, 216, 230, 0.04)';
            stroke = 'rgba(173, 216, 230, 0.15)';
          } else {
            fill = 'rgba(10, 20, 40, 0.02)';
            stroke = 'rgba(10, 20, 40, 0.1)';
          }

          const svgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='1' y='1' width='98' height='98' fill='${fill}' stroke='${stroke}' stroke-width='${strokeWidth}'/></svg>`;
          images.push(`url("data:image/svg+xml;utf8,${encodeURIComponent(svgString)}")`);

          const isSquare = Math.random() > 0.5;
          const width = Math.floor(Math.random() * 100) + 30;
          const height = isSquare ? width : Math.floor(Math.random() * 100) + 30;
          sizes.push(`${width}px ${height}px`);

          const posX = Math.floor(Math.random() * 35) + 65;
          const posY = Math.floor(Math.random() * 100);
          positions.push(`${posX}% ${posY}%`);
        }

        return {
          backgroundImage: images.join(', '),
          backgroundSize: sizes.join(', '),
          backgroundPosition: positions.join(', '),
          backgroundRepeat: 'no-repeat',
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
        };
      };
      setDynamicBgStyle(generateRandomPattern());
    }
  }, [showOverview]);

  const handleDragEndTopBar = (_e: any, info: any) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (info.offset.y > 50 && tabs.length > 1) setShowOverview(true);
  };

  const handleDragEndOverlay = (_e: any, info: any) => {
    if (!isDesktop && info.offset.y < -50) setShowOverview(false);
  };

  const handleClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(tabId);
    if (tabs.length <= 1) setShowOverview(false);
  };

  const isDirty = (id: string) => viewStates[id]?.isDirty ?? false;
  const shouldRenderPanel = showOverview && !(reappearMode && !isDesktop && isKeyboardOpen);

  const handleTabClick = (tabId: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setActiveTab(tabId);
  };

  const displayIds = draggingId && liveOrder.length > 0 ? liveOrder : tabs.map(t => t.id);
  const tabById = React.useMemo(() => new Map(tabs.map(t => [t.id, t])), [tabs]);

  const renderTabInner = (
    tab: { id: string; title: string; icon?: string; filePath?: string },
    opts?: { faded?: boolean }
  ) => {
    const dirty = isDirty(tab.id);
    const decoration = tab.filePath ? decorations[tab.filePath] : null;
    return (
      <>
        {showTabsIcon && (
          tab.icon
            ? <Icon name={tab.icon as any} size={14} style={{ opacity: opts?.faded ? 0.45 : 0.8 }} />
            : <FileIcon name={tab.title} isDir={false} />
        )}
        <span
          className="tab-title"
          style={{
            fontStyle: dirty ? 'italic' : 'normal',
            color: decoration ? decoration.color : undefined,
            opacity: opts?.faded ? 0.5 : 1,
          }}
        >
          {tab.title}
        </span>
        {decoration && (
          <DecorationBadge badge={decoration.badge} color={decoration.color} tooltip={decoration.tooltip} />
        )}
        <TabActionBtn isDirty={dirty} onClose={opts?.faded ? () => {} : (e) => handleClose(tab.id, e)} />
      </>
    );
  };

  return (
    <>
      <motion.div
        ref={tabContainerRef}
        className={`tab-container${draggingId ? ' is-reordering' : ''}`}
        drag={containerDragEnabled ? 'y' : false}
        style={{ visibility: showOverview ? 'hidden' : 'visible', position: 'relative' }}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEndTopBar}
        title="Pull down to see all tabs · Long-press a tab to reorder"
      >
        {displayIds.map((id) => {
          const tab = tabById.get(id);
          if (!tab) return null;

          const isDraggingThis = draggingId === tab.id;

          // Shadow of the real tab at the drop slot (not just a dashed box)
          if (isDraggingThis) {
            return (
              <motion.div
                key={`placeholder-${tab.id}`}
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.6 }}
                className={`tab tab-drag-placeholder${activeTabId === tab.id ? ' active' : ''}`}
                style={{
                  width: dragW || undefined,
                  minWidth: dragW || 100,
                  maxWidth: dragW || 160,
                  flexShrink: 0,
                  pointerEvents: 'none',
                }}
                aria-hidden
              >
                {renderTabInner(tab, { faded: true })}
              </motion.div>
            );
          }

          return (
            <motion.div
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              layout={!!draggingId}
              transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.6 }}
              className={`tab ${activeTabId === tab.id ? 'active' : ''}${draggingId ? ' tab-shift' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              onPointerDown={(e) => onPointerDownTab(e, tab.id)}
              data-dirty={isDirty(tab.id) ? 'true' : 'false'}
            >
              {renderTabInner(tab)}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Floating ghost following the finger */}
      {ghostTab && draggingId && (
        <div
          className={`tab tab-drag-ghost${activeTabId === ghostTab.id ? ' active' : ''}`}
          style={{
            position: 'fixed',
            left: dragX,
            top: dragY,
            width: dragW,
            height: dragH,
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
            transform: 'scale(1.05)',
            opacity: 0.97,
            borderRadius: 4,
            touchAction: 'none',
          }}
        >
          {showTabsIcon && (
            ghostTab.icon
              ? <Icon name={ghostTab.icon as any} size={14} style={{ opacity: 0.8 }} />
              : <FileIcon name={ghostTab.title} isDir={false} />
          )}
          <span
            className="tab-title"
            style={{
              fontStyle: ghostTab.dirty ? 'italic' : 'normal',
              color: ghostTab.decoration ? ghostTab.decoration.color : undefined,
            }}
          >
            {ghostTab.title}
          </span>
          {ghostTab.decoration && (
            <DecorationBadge
              badge={ghostTab.decoration.badge}
              color={ghostTab.decoration.color}
              tooltip={ghostTab.decoration.tooltip}
            />
          )}
          <TabActionBtn isDirty={ghostTab.dirty} onClose={() => {}} />
        </div>
      )}

      {showOverview && (
        <div className="tab-bar-overview-header" onClick={() => !isDesktop && setShowOverview(false)}>
          <span className="tab-bar-overview-title">OPEN EDITORS</span>
          <span className="tab-bar-overview-count">{tabs.length}</span>
          <span className="tab-bar-overview-close-btn" onClick={(e) => { e.stopPropagation(); setShowOverview(false); }}>
            <Icon name="close" size={16} />
          </span>
        </div>
      )}

      <AnimatePresence>
        {shouldRenderPanel && (
          <motion.div
            className="tab-overview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setShowOverview(false)}
            drag={isDesktop ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEndOverlay}
          >
            <motion.div
              className="tab-overview-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: isDesktop ? 0 : -20, x: isDesktop ? 10 : 0, scaleY: isDesktop ? 1 : 0.95 }}
              animate={{ y: 0, x: 0, scaleY: 1 }}
              exit={{ y: isDesktop ? 0 : -20, x: isDesktop ? 10 : 0, scaleY: isDesktop ? 1 : 0.95 }}
              style={{ transformOrigin: isDesktop ? 'top right' : 'top center' }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            >
              <div style={dynamicBgStyle} />

              <div className="tab-overview-list">
                {tabs.length === 0 && <div className="no-tabs">No open tabs</div>}

                {tabs.map(tab => {
                  const dirty = isDirty(tab.id);
                  const decoration = tab.filePath ? decorations[tab.filePath] : null;

                  return (
                    <div
                      key={tab.id}
                      className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (closeOnClick) setShowOverview(false);
                      }}
                      data-dirty={dirty ? 'true' : 'false'}
                    >
                      {showTabsIconOnPopup && (
                        tab.icon
                          ? <Icon name={tab.icon as any} size={14} style={{ opacity: 0.8 }} />
                          : <FileIcon name={tab.title} isDir={false} />
                      )}

                      <span
                        className="tab-title"
                        style={{
                          fontStyle: dirty ? 'italic' : 'normal',
                          color: decoration ? decoration.color : undefined,
                        }}
                      >
                        {tab.title}
                      </span>

                      {decoration && (
                        <DecorationBadge badge={decoration.badge} color={decoration.color} tooltip={decoration.tooltip} />
                      )}

                      <TabActionBtn isDirty={dirty} onClose={e => handleClose(tab.id, e)} />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
