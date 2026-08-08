// src/ui/components/Modal/Modal.tsx
import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon/IconRegistry';
import type { IconName } from '../Icon/IconRegistry';
import './Modal.css';

export type ModalPresentation = 'modal' | 'page';

/**
 * Configuration schema for the MS Code Native Modal Component.
 */
export interface ModalProps {
  /** Controls the visibility state of the modal viewport overlay. */
  isOpen: boolean;

  /** Primary header title string displayed at the top left of the modal wrapper. */
  title: string;

  /**
   * Optional icon token from the Codicon registry to be positioned right before the header title.
   * @example 'info', 'gear', 'warning'
   */
  iconName?: IconName | string;

  /**
   * Triggers immediately when clicking the close (X) icon button or hitting the `Escape` key.
   * Use this boundary frame callback to revert the `isOpen` state flag to false.
   */
  onClose: () => void;

  /** Inside markup nodes rendered straight within the scrollable content container body view layer. */
  children: React.ReactNode;

  /**
   * Target action components (like Buttons) to append sequentially inside the sticky lower bottom panel zone.
   */
  footerActions?: React.ReactNode;

  /**
   * Presentation mode:
   * - `'modal'` (default) — centered dialog card
   * - `'page'` — full-screen surface with Android activity-style slide
   */
  type?: ModalPresentation;

  /** Optional extra class on the dialog/page shell. */
  className?: string;
}

const EXIT_MS = 160;

/**
 * Native MS Code Modal / Page overlay.
 * Uses theme CSS variables (`--ms-bg-main`, `--ms-border-light`, …).
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  iconName,
  onClose,
  children,
  footerActions,
  type = 'modal',
  className = '',
}) => {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !closing) onClose();
    };
    if (mounted) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mounted, isOpen, closing, onClose]);

  if (!mounted) return null;

  const isPage = type === 'page';
  const shellClass = isPage
    ? `ms-modal-page${closing ? ' ms-modal-page--closing' : ''} ${className}`.trim()
    : `ms-modal-dialog${closing ? ' ms-modal-dialog--closing' : ''} ${className}`.trim();

  return (
    <div
      className={[
        'ms-modal-backdrop',
        isPage ? 'ms-modal-backdrop--page' : '',
        closing ? 'ms-modal-backdrop--closing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={(e) => {
        // click outside closes only for dialog mode
        if (!isPage && e.target === e.currentTarget && !closing) onClose();
      }}
    >
      <div
        className={shellClass}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ms-modal-header">
          <div className="ms-modal-title">
            {iconName && <Icon name={iconName as any} size={16} />}
            <span>{title}</span>
          </div>
          <div className="ms-modal-close" onClick={() => !closing && onClose()} title="Close">
            <Icon name="close" size={16} />
          </div>
        </div>

        <div className="ms-modal-body">{children}</div>

        {footerActions && <div className="ms-modal-footer">{footerActions}</div>}
      </div>
    </div>
  );
};
