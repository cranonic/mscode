// src/features/termis/components/terminal/hooks/useTerminalBoot.ts

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNotificationStore } from '@/store/notificationStore';
import { NativeTerminal } from '../core/TerminalProcess';

/**
 * Custom hook managing the terminal environment lifecycle during application boot.
 * Automates the validation and extraction of required binary runtime root files
 * if the host environment is not yet initialized.
 */
export function useTerminalBoot(): void {
    useEffect(() => {
        // Initialization routines are exclusively required for native device platform hosts
        if (!Capacitor.isNativePlatform()) return;

        const bootSetup = async (): Promise<void> => {
            try {
                // 1. Verify if the system root environment is already staged
                const { isReady } = await NativeTerminal.checkSetup();
                
                if (isReady) {
                    // console.log("✅ [Terminal] Rootfs is already setup.");
                    return; 
                }

                // 2. Alpine-branded setup status (version + progress-style loading)
                const notifId = 'term-setup-boot';
                useNotificationStore.getState().addNotification({
                    id: notifId,
                    type: 'loading',
                    title: 'Alpine Linux',
                    source: 'System',
                    message:
                        'Alpine minirootfs 3.24.4\n' +
                        'Downloading / extracting rootfs…\n' +
                        'This may take a minute on first launch.',
                    progress: 15,
                });

                // 3. Perform asynchronous file system setup and binary installation
                try {
                    useNotificationStore.getState().updateNotification(notifId, {
                        progress: 40,
                        message:
                            'Alpine Linux 3.24.4\n' +
                            'Installing root filesystem…',
                    });
                } catch { /* ignore */ }

                await NativeTerminal.initSetup();

                // Prefer explicit proot rootfs ensure (CDN 3.24.4)
                try {
                    useNotificationStore.getState().updateNotification(notifId, {
                        progress: 75,
                        message: 'Alpine Linux 3.24.4\nFinishing setup…',
                    });
                    await NativeTerminal.ensureProotRootfs?.({});
                } catch { /* initSetup may already cover native bootstrap */ }

                // 4. Signal successful installation to the user interface
                useNotificationStore.getState().updateNotification(notifId, {
                    type: 'success',
                    title: 'Alpine Linux Ready',
                    message: 'Alpine 3.24.4 is installed. Linux terminal is ready.',
                    progress: 100,
                });
                
                // Clear the notification after a brief success delay
                setTimeout(() => {
                    useNotificationStore.getState().dismissToast(notifId);
                }, 3000);

            } catch (error: any) {
                // 5. Catch and log terminal startup failures to the diagnostic notification stack
                console.error("❌ [Terminal] Boot setup failed:", error);
                useNotificationStore.getState().addNotification({
                    type: 'error',
                    title: 'Terminal Setup Failed',
                    source: 'System',
                    message: error.message || 'An unknown error occurred during setup.',
                });
            }
        };

        bootSetup();
    }, []);
}