// Clear Data — uses shared ui/components Modal, Button, Checkbox
import React, { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Modal } from '@/ui/components/Modal/Modal';
import { Button } from '@/ui/components/Button/Button';
import { Checkbox } from '@/ui/components/Checkbox/Checkbox';
import { useNotificationStore } from '@/store/notificationStore';

const NativeTerminal = registerPlugin<any>('NativeTerminal');

export interface ClearDataModalProps {
  execType: 'native' | 'proot';
  /** Preferred name (matches Modal). */
  isOpen?: boolean;
  /** @deprecated use isOpen */
  open?: boolean;
  onClose: () => void;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  execType,
  isOpen,
  open,
  onClose,
}) => {
  const visible = isOpen ?? open ?? false;
  const [packages, setPackages] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title =
    execType === 'proot'
      ? 'Clear Data — Linux (Alpine)'
      : 'Clear Data — Android (native)';

  useEffect(() => {
    if (!visible) return;
    setSelected(new Set());
    setError(null);
    if (!Capacitor.isNativePlatform()) {
      setPackages([]);
      return;
    }
    setLoading(true);
    NativeTerminal.listTerminalPackages({ execType })
      .then((ret: { packages?: string[] }) => {
        setPackages(ret?.packages || []);
      })
      .catch((e: any) => {
        setPackages([]);
        setError(e?.message || 'Could not list packages');
      })
      .finally(() => setLoading(false));
  }, [visible, execType]);

  const toggle = (pkg: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(pkg);
      else next.delete(pkg);
      return next;
    });
  };

  const hasSelection = selected.size > 0;

  const runClear = async () => {
    if (!Capacitor.isNativePlatform()) {
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Clear Data',
        source: 'Terminal',
        message: 'Clear Data is only available on the Android app.',
      });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const pkgArr = hasSelection ? Array.from(selected) : [];
      const ret = await NativeTerminal.clearTerminalData({
        execType,
        packages: pkgArr,
      });
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Clear Data',
        source: 'Terminal',
        message: ret?.message || 'Done',
      });
      onClose();
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Clear Data',
        source: 'Terminal',
        message:
          msg.includes('apk del') || msg.includes('terminal')
            ? msg
            : `Could not remove from UI. Open the terminal and remove the package(s) manually.\n${msg}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={visible}
      title={title}
      iconName="trash"
      onClose={onClose}
      footerActions={
        <>
          <Button variant="type2" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="type1" onClick={runClear} disabled={busy}>
            {busy
              ? 'Working…'
              : hasSelection
                ? `Clear package${selected.size > 1 ? 's' : ''}`
                : 'Clear Data'}
          </Button>
        </>
      }
    >
      <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.85, lineHeight: 1.45 }}>
        Select packages to remove. Leave none selected to wipe the whole
        {execType === 'proot' ? ' Alpine rootfs' : ' native $PREFIX'} — next open will
        reinstall from scratch.
      </p>

      {loading && (
        <p style={{ fontSize: 13, opacity: 0.7 }}>Loading packages…</p>
      )}

      {!loading && packages.length === 0 && (
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          No packages listed (not set up yet, or empty). You can still use{' '}
          <strong>Clear Data</strong> to reset this backend.
        </p>
      )}

      {!loading && packages.length > 0 && (
        <div
          style={{
            maxHeight: '40vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {packages.map((pkg) => (
            <Checkbox
              key={pkg}
              label={pkg}
              checked={selected.has(pkg)}
              onChange={(checked) => toggle(pkg, checked)}
            />
          ))}
        </div>
      )}

      {error && (
        <p
          style={{
            marginTop: 12,
            padding: 8,
            borderRadius: 4,
            background: 'rgba(244, 71, 71, 0.12)',
            color: 'var(--ms-error, #f44747)',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          }}
        >
          {error}
        </p>
      )}
    </Modal>
  );
};
