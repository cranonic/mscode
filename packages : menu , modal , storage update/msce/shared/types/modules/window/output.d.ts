// types/modules/window/output.d.ts

declare module '@mscode/api' {

  /**
   * Represents an isolated channel for logging output data.
   */
  export interface OutputChannel {
    /** The display name of the output channel. */
    readonly name: string;
    
    /** Appends text without a trailing newline. */
    append(value: string): void;
    
    /** Appends text with a trailing newline. */
    appendLine(value: string): void;
    
    /** Clears all logged data from the channel. */
    clear(): void;
    
    /** Opens the output panel and switches to this specific channel. */
    show(): void;
    
    /** Disposes and completely removes the channel from the IDE. */
    dispose(): void;
    
    /** Registers a callback that fires when the user clicks the 'Kill/Stop' button on this channel. */
    onDidKill(handler: () => void): void;
    
    /** Removes the active kill handler. */
    clearKillHandler(): void;
  }

  export namespace window {
    
    /** The name of the currently active output channel. */
    export const activeOutputChannel: string;
    
    /** Array containing the names of all currently registered output channels. */
    export const outputChannels: string[];

    /**
     * Creates a new output channel with the given name.
     * * @param name The display name of the channel.
     * @returns An object representing the output channel.
     * * @example
     * const myLog = mscode.window.createOutputChannel("My Plugin");
     * myLog.appendLine("Plugin initialized successfully!");
     * myLog.show();
     */
    export function createOutputChannel(name: string): OutputChannel;

    /** Fired when a new output channel is created. */
    export function onDidOpenOutputChannel(handler: (channelName: string) => void): Disposable;

    /** Fired when an output channel is disposed/closed. */
    export function onDidCloseOutputChannel(handler: (channelName: string) => void): Disposable;

    /** Fired when the active output channel changes. */
    export function onDidChangeActiveOutputChannel(handler: (channelName: string) => void): Disposable;
  }
}