// src/ui/components/ContextMenu/ContextMenuHost.tsx
// Mount once at app root. Keeps the menu DOM alive during exit animation.

import React from 'react';
import { useMenuStore } from '@/store/menuStore';
import { ContextMenu } from './ContextMenu';

export const ContextMenuHost: React.FC = () => {
  const isOpen = useMenuStore((s) => s.isOpen);
  const isClosing = useMenuStore((s) => s.isClosing);
  const items = useMenuStore((s) => s.items);
  const position = useMenuStore((s) => s.position);

  if (!isOpen && !isClosing) return null;
  if (!items?.length) return null;

  return (
    <ContextMenu
      items={items}
      isClosing={isClosing}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
      }}
    />
  );
};