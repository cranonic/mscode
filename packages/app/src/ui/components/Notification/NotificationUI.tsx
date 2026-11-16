// src/ui/components/Notification/NotificationUI.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore, type AppNotification } from '@/store/notificationStore';
import { useStatusBarStore } from '@/features/statusbar/store/statusBarStore';
import { Icon } from '@/ui/components/Icon/IconRegistry';
import { Button } from '@/ui/components/Button/Button';
import { useBackButtonStore } from '@/store/backButtonStore'; 
import './Notification.css';

const getIconForType = (type: string) => {
  switch (type) {
    case 'error': return <Icon name="error" color="var(--vscode-errorForeground, #f48771)" />;
    case 'warning': return <Icon name="warning" color="var(--vscode-editorWarning-foreground, #cca700)" />;
    case 'loading': return <Icon name="sync" className="spin-animation" color="var(--vscode-textLink-foreground, #3794ff)" />;
    case 'confirmation': return <Icon name="question" color="var(--vscode-editorWarning-foreground, #cca700)" />; 
    case 'success': return <Icon name="check" color="var(--vscode-testing-iconPassed, #73c991)" />;
    default: return <Icon name="info" color="var(--vscode-textLink-foreground, #3794ff)" />;
  }
};

/** Min distance (px) to commit a swipe-dismiss. */
const SWIPE_DISMISS_THRESHOLD = 96;
/** Velocity (px/ms) above which a flick dismisses even below distance threshold. */
const SWIPE_FLICK_VELOCITY = 0.55;

type NotificationCardProps = {
  notif: AppNotification;
  /** true = floating toast; false = notification center list */
  isToast?: boolean;
};

/**
 * Swipeable notification card.
 * - Toast (outside): swipe L/R → only dismissToast (stays in center)
 * - Center (inside): swipe L/R → removeNotification (gone for good)
 * Distance-based fade + release momentum (YouTube-popup style). Below threshold → spring back.
 */
const NotificationCard: React.FC<NotificationCardProps> = ({ notif, isToast }) => {
  const { toggleCollapse, dismissToast, removeNotification } = useNotificationStore();
  const hasDetails = !!notif.fullMessage || !!notif.actions?.length;

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const axisLocked = useRef<'x' | 'y' | null>(null);
  const offsetX = useRef(0);

  const applyTransform = useCallback((x: number, withTransition: boolean) => {
    const el = cardRef.current;
    if (!el) return;
    const abs = Math.abs(x);
    // Fade more as it travels (YouTube-like)
    const opacity = Math.max(0.15, 1 - abs / 220);
    el.style.transition = withTransition
      ? 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.28s ease'
      : 'none';
    el.style.transform = `translateX(${x}px)`;
    el.style.opacity = String(opacity);
  }, []);

  const finishDismiss = useCallback((dir: number) => {
    const el = cardRef.current;
    if (!el) return;
    const fly = dir * (window.innerWidth || 400);
    el.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 1, 1), opacity 0.22s ease';
    el.style.transform = `translateX(${fly}px)`;
    el.style.opacity = '0';
    const id = notif.id;
    window.setTimeout(() => {
      if (isToast) dismissToast(id);
      else removeNotification(id);
      // Reset style in case the same card node is reused (toast → still in center)
      if (el) {
        el.style.transition = 'none';
        el.style.transform = '';
        el.style.opacity = '';
      }
    }, 220);
  }, [notif.id, isToast, dismissToast, removeNotification]);

  const snapBack = useCallback(() => {
    applyTransform(0, true);
    offsetX.current = 0;
  }, [applyTransform]);

  const onPointerDown = (e: React.PointerEvent) => {
    // Don't steal clicks from buttons / close
    if ((e.target as HTMLElement).closest('button, .ms-notif-close, .ms-notif-actions')) return;
    dragging.current = true;
    axisLocked.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    lastT.current = e.timeStamp;
    velocity.current = 0;
    offsetX.current = 0;
    try {
      cardRef.current?.setPointerCapture(e.pointerId);
    } catch { /* ignore */ }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!axisLocked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
      if (axisLocked.current === 'y') {
        // Let vertical scroll in center body work
        dragging.current = false;
        return;
      }
    }

    if (axisLocked.current !== 'x') return;
    e.preventDefault();

    const dt = Math.max(1, e.timeStamp - lastT.current);
    velocity.current = (e.clientX - lastX.current) / dt;
    lastX.current = e.clientX;
    lastT.current = e.timeStamp;

    offsetX.current = dx;
    applyTransform(dx, false);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;

    if (axisLocked.current !== 'x') {
      axisLocked.current = null;
      return;
    }
    axisLocked.current = null;

    const x = offsetX.current;
    const v = velocity.current;
    const absX = Math.abs(x);
    const absV = Math.abs(v);
    const dir = x === 0 ? (v >= 0 ? 1 : -1) : x > 0 ? 1 : -1;

    // Momentum nudge: project a bit further in the flick direction
    const projected = absX + absV * 120;
    const shouldDismiss =
      absX >= SWIPE_DISMISS_THRESHOLD ||
      absV >= SWIPE_FLICK_VELOCITY ||
      projected >= SWIPE_DISMISS_THRESHOLD * 1.15;

    if (shouldDismiss) {
      finishDismiss(dir);
    } else {
      snapBack();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`ms-notif-card ${isToast ? 'is-toast' : ''}${notif.progress !== undefined ? ' has-progress' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="ms-notif-header" onClick={() => hasDetails && toggleCollapse(notif.id)}>
        <div className="ms-notif-icon">
          {notif.iconUrl ? (
            <img src={notif.iconUrl} alt="icon" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'contain' }} />
          ) : (
            getIconForType(notif.type)
          )}
        </div>
        <div className="ms-notif-title-area">
          <div className="ms-notif-title-wrapper">
            <span className="ms-notif-title">{notif.title}</span>
            {notif.count && notif.count > 1 && (
              <span className="ms-notif-badge">{notif.count}</span>
            )}
          </div>
          {notif.source && <div className="ms-notif-source">{notif.source}</div>}
        </div>
        <div className="ms-notif-controls">
          {hasDetails && (
            <Icon name={notif.collapsed ? 'chevron-down' : 'chevron-up'} size={14} className="ms-notif-expand-icon" />
          )}
          <div 
            className="ms-notif-close" 
            onClick={(e) => { e.stopPropagation(); isToast ? dismissToast(notif.id) : removeNotification(notif.id); }}
          >
            <Icon name="close" size={14} />
          </div>
        </div>
      </div>

      {notif.message && (
        <div className="ms-notif-summary">{notif.message}</div>
      )}

      {notif.progress !== undefined && (
        <div className="ms-notif-progress-bar">
          <div
            className="ms-notif-progress-fill"
            style={{ width: `${Math.max(0, Math.min(100, notif.progress))}%` }}
          />
        </div>
      )}

      {!notif.collapsed && hasDetails && (
        <div className="ms-notif-details">
          {notif.fullMessage && <div className="ms-notif-fullmsg">{notif.fullMessage}</div>}
          {notif.actions && notif.actions.length > 0 && (
            <div className="ms-notif-actions">
              {notif.actions.map((act, i) => (
                <Button 
                  key={i} 
                  variant={act.variant || 'type2'}
                  customStyle={act.customStyle}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    act.onClick(); 
                  }}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const NotificationUI: React.FC = () => {
  const { notifications, isCenterOpen, toggleCenter, clearAll } = useNotificationStore();
  const activeToasts = notifications.filter(n => n.isToast);

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const loadingCount = notifications.filter(n => n.type === 'loading').length;
    
    useStatusBarStore.getState().updateItem('notif-bell', {
      icon: loadingCount > 0 ? 'sync' : 'bell',
      spin: loadingCount > 0,
      label: unreadCount > 0 ? `${unreadCount}` : undefined,
      onClick: toggleCenter
    });
  }, [notifications, toggleCenter]);

  useEffect(() => {
    if (isCenterOpen) {
      const handlerId = 'notif-center-close-handler';
      
      useBackButtonStore.getState().push(handlerId, () => {
        toggleCenter(); 
        return true; 
      });

      return () => {
        useBackButtonStore.getState().remove(handlerId);
      };
    }
  }, [isCenterOpen, toggleCenter]);

  return (
    <>
      <div className="ms-toast-container">
        {activeToasts.map(n => <NotificationCard key={n.id} notif={n} isToast={true} />)}
      </div>

      <div className={`ms-notif-center ${isCenterOpen ? 'open' : ''}`}>
        <div className="ms-notif-center-header">
          <span>NOTIFICATIONS</span>
          <div style={{display: 'flex', gap: '10px'}}>
            <span className="clickable" onClick={clearAll} title="Clear All" style={{ display: 'flex' }}>
              <Icon name="clear-all" />
            </span>
            <span className="clickable" onClick={toggleCenter} title="Close" style={{ display: 'flex' }}>
              <Icon name="close" />
            </span>
          </div>
        </div>
        <div className="ms-notif-center-body">
          {notifications.length === 0 ? (
            <div className="ms-notif-empty">No new notifications</div>
          ) : (
            notifications.map(n => <NotificationCard key={n.id} notif={n} isToast={false} />)
          )}
        </div>
      </div>
    </>
  );
};
