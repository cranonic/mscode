import React, { useEffect } from 'react';

export interface CtxItem {
  id: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface PlayerContextMenuProps {
  x: number;
  y: number;
  items: CtxItem[];
  onClose: () => void;
}

export const PlayerContextMenu: React.FC<PlayerContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onDown);
    };
  }, [onClose]);

  return (
    <div
      className="vlc-ctx-menu vlc-fade-in"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000,
        minWidth: 180,
        background: 'var(--vlc-bg-elevated)',
        border: '1px solid var(--vlc-border)',
        borderRadius: 6,
        padding: '4px 0',
        boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          disabled={it.disabled}
          onClick={() => {
            if (it.disabled) return;
            it.onClick?.();
            onClose();
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            color: it.danger ? 'var(--vlc-danger)' : 'var(--vlc-text)',
            opacity: it.disabled ? 0.4 : 1,
            padding: '7px 14px',
            fontSize: 12.5,
            cursor: it.disabled ? 'default' : 'pointer',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
};
