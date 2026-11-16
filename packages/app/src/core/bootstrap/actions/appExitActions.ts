// src/core/bootstrap/actions/appExitActions.ts
import { App as CapacitorApp } from '@capacitor/app';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { useNotificationStore } from '@/store/notificationStore';

let exitNotifId: string | null = null;

export function registerAppExitActions(): void {
  commands.registerCommand('workbench.action.quit', () => {
    const { notifications, removeNotification, addNotification } =
      useNotificationStore.getState();

    const isShowing = exitNotifId && notifications.some(n => n.id === exitNotifId);

    if (isShowing) {
      removeNotification(exitNotifId!);
      exitNotifId = null;
      return;
    }

    exitNotifId = addNotification({
      type: 'confirmation',
      title: 'Exit MS Code?',
      message: 'Are you sure you want to close the application?',
      source: 'System',
      actions: [
        {
          label: 'Cancel',
          variant: 'type2',
          onClick: () => {
            removeNotification(exitNotifId!);
            exitNotifId = null;
          },
        },
        {
          label: 'Exit',
          variant: 'type1',
          onClick: () => CapacitorApp.exitApp(),
        },
      ],
    });
  });
}
