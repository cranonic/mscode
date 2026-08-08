// types/modules/window/notification.d.ts

declare module '@mscode/api' {
  import * as React from 'react';

  /**
   * Action configuration for interactive notifications.
   */
  export interface NotificationAction {
    label: string;
    onClick: () => void;
    variant?: 'type1' | 'type2';
    customStyle?: React.CSSProperties;
  }

  /**
   * Controller object to manage a running progress notification.
   */
  export interface ProgressNotification {
    /** The unique ID of the notification. */
    id: string;
    /** Updates the progress message or percentage. */
    report: (updates: { message?: string; progress?: number }) => void;
    /** Marks the task as completed and dismisses it after a delay. */
    done: (finalMessage?: string) => void;
    /** Converts the progress notification into an error state. */
    error: (err: string) => void;
  }

  export namespace window {
    
    //  window.notification.* (MS Code Standard)
    export namespace notification {
      /** Shows an information message notification. */
      export function showInformationMessage(message: string, ...items: string[]): string;
      export function showInformationMessage(message: string, ...items: NotificationAction[]): string;
      
      /** Shows an error message notification. */
      export function showErrorMessage(message: string, fullMessage?: string): string;
      
      /** Shows a progress notification that can be updated or completed. */
      export function withProgress(title: string, message: string): ProgressNotification;
      
      /** Shows a confirmation dialogue with custom action buttons. */
      export function showConfirmation(title: string, message: string, actions: NotificationAction[]): string;
      
      /** Dismisses a specific notification by its ID. */
      export function dismissNotification(id: string): void;
    }

    // LEGACY API: window.* (VS Code Backwards Compatibility)
    
    /** Shows an information message notification (VS Code Compatible). */
    export function showInformationMessage(message: string, ...items: string[]): string;
    export function showInformationMessage(message: string, ...items: NotificationAction[]): string;
    
    /** Shows an error message notification (VS Code Compatible). */
    export function showErrorMessage(message: string, fullMessage?: string): string;
    
    /** Shows a progress notification (VS Code Compatible). */
    export function withProgress(title: string, message: string): ProgressNotification;
    
    /** Shows a confirmation dialogue with custom action buttons. */
    export function showConfirmation(title: string, message: string, actions: NotificationAction[]): string;
    
    /** Dismisses a specific notification by its ID. */
    export function dismissNotification(id: string): void;
  }

  /**
   * @example
   * 
   * import { window } from '@mscode/api';
   * 
   * // ────────────────────────────────────────────────────────────────────────
   * // 1 BASIC NOTIFICATIONS (Modern vs Legacy)
   * // ────────────────────────────────────────────────────────────────────────
   * 
   * // MS Code Style (Recommended)
   * window.notification.showInformationMessage("Compiler is ready!");
   * 
   * // Legacy VS Code Style (Still fully supported for easy porting)
   * window.showInformationMessage("Compiler is ready!");
   * 
   */
}