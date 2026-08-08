// types/toast.d.ts

declare module '@mscode/api' {

  export namespace window {
    
    /**
     * The Toast API provides a way to display non-intrusive, auto-dismissible 
     * notifications to the user. Toasts are perfect for quick status updates 
     * (e.g., "File Saved", "Compilation Successful").
     */
    export namespace toast {
      
      /**
       * Shows a standard information toast.
       * @param message The primary message to display.
       * @param options Additional configuration for the toast.
       * @returns A controller object to programmatically dismiss the toast.
       */
      export function show(message: string, options?: ToastOptions): ToastController;

      /**
       * Shows a success toast (usually with a green accent and checkmark icon).
       * @param message The primary message to display.
       * @param options Additional configuration for the toast.
       * @returns A controller object to programmatically dismiss the toast.
       */
      export function success(message: string, options?: ToastOptions): ToastController;

      /**
       * Shows an error toast (usually with a red accent and warning icon).
       * @param message The primary message to display.
       * @param options Additional configuration for the toast.
       * @returns A controller object to programmatically dismiss the toast.
       */
      export function error(message: string, options?: ToastOptions): ToastController;

      /**
       * Shows a warning toast (usually with a yellow/orange accent).
       * @param message The primary message to display.
       * @param options Additional configuration for the toast.
       * @returns A controller object to programmatically dismiss the toast.
       */
      export function warning(message: string, options?: ToastOptions): ToastController;

      /**
       * Shows an info toast (alias for `show`).
       * @param message The primary message to display.
       * @param options Additional configuration for the toast.
       * @returns A controller object to programmatically dismiss the toast.
       */
      export function info(message: string, options?: ToastOptions): ToastController;

      /**
       * Shows a loading toast. 
       * Note: By default, loading toasts have a duration of `0` (permanent) 
       * so they won't disappear until you manually call `.dismiss()`.
       * 
       * @param message The primary message to display.
       * @param options Additional configuration for the toast.
       * @returns A controller object to programmatically dismiss the toast.
       */
      export function loading(message: string, options?: ToastOptions): ToastController;

      /**
       * Dismisses a specific toast by its unique ID.
       * @param id The unique identifier of the toast to dismiss.
       */
      export function dismiss(id: string): void;
    }

    // ─── TYPES & INTERFACES ──────────────────────────────────────────────

    /** Controller object returned when a toast is created. */
    export interface ToastController {
      /** The unique identifier of the created toast. */
      id: string;
      /** Programmatically removes this specific toast from the screen. */
      dismiss: () => void;
    }

    /** Configuration options for rendering a Toast. */
    export interface ToastOptions {
      /** 
       * A custom unique ID for the toast. If not provided, a random one is generated.
       * Providing the same ID twice will update the existing toast instead of creating a new one.
       */
      id?: string;

      /** 
       * Secondary text to display below the main message. 
       */
      description?: string;

      /** 
       * The screen position where the toast should appear.
       * @default 'bottom-center'
       */
      position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'side-left' | 'side-right';

      /** 
       * Override the default icon with a custom icon name from the IconRegistry.
       */
      icon?: string;

      /** 
       * How long the toast should stay visible (in milliseconds).
       * Set to `0` to make the toast permanent (user must dismiss it or you call `.dismiss()`).
       * @default 3000
       */
      duration?: number;

      /** 
       * Add a clickable action button to the right side of the toast.
       */
      action?: {
        /** The text label of the button (e.g., "Retry", "Undo") */
        label: string;
        /** Callback function executed when the user clicks the button */
        onClick: () => void;
      };

      /** 
       * Custom CSS class name to apply to the toast wrapper.
       * Useful for scoping custom CSS rules.
       */
      className?: string;

      /** 
       * Inline CSS styles to apply directly to the toast wrapper.
       * Allows dynamic customization like custom background colors or borders.
       */
      style?: Record<string, string | number>;
    }
  }
}


/**
 * @fileoverview Toast Notification API example for MSCode.
 * This demonstrates how to trigger standard, styled, and actionable toast notifications.
 */

/**
 * @example
 * import { window } from '@mscode/api';
 * * // 1. Trigger a simple success toast message
 * window.toast.success('Extension activated successfully!');
 * * // 2. Trigger a custom-styled error toast with a description and an actionable button
 * const myToast = window.toast.error('Failed to compile C++ code.', {
 * position: 'side-right',
 * description: 'Line 42: Missing semicolon.',
 * duration: 5000,
 * style: {
 * backgroundColor: '#3b0000', // Custom dark red background
 * border: '1px solid red'
 * },
 * action: {
 * label: 'View Logs',
 * onClick: () => window.output.show() // Opens the output log panel upon click
 * }
 * });
 * * // 3. Programmatically dismiss the toast notification if needed (e.g., after an async task completes)
 * setTimeout(() => {
 * myToast.dismiss();
 * }, 2000);
 */