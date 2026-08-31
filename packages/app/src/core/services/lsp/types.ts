// src/core/services/lsp/types.ts
//
// Shared LSP connection state + option types used by transport, protocol,
// document manager, and Monaco providers.

import type * as monaco from 'monaco-editor';

export interface LspOptions {
  hover?: boolean;
  completion?: boolean;
  linting?: boolean;
  references?: boolean;
  definition?: boolean;
  documentHighlight?: boolean;
  documentSymbol?: boolean;
  codeActions?: boolean;
  codeLens?: boolean;
  foldingRange?: boolean;
  inlayHints?: boolean;
  semanticTokens?: boolean;
  onTypeFormatting?: boolean;
  colorProvider?: boolean;
  rootUri?: string;
  initializationOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

export interface LspState {
  /** Active WebSocket to the language server (null when disconnected). */
  ws: WebSocket | null;
  /** Language id the connection was opened for (e.g. "typescript"). */
  languageId: string;
  /** Workspace root URI sent during initialize. */
  rootUri: string;
  /** Extra options forwarded as initialize.initializationOptions. */
  initializationOptions: Record<string, unknown>;
  /** True after initialize/initialized handshake completed. */
  initialized: boolean;
  /** True while handshake is in flight. */
  isInitializing: boolean;
  /** Monaco provider disposables registered for this connection. */
  disposables: monaco.IDisposable[];
  /** Model-id → LSP file URI map. */
  modelUriMap: Map<string, string>;
  /** Set of URIs already sent via textDocument/didOpen. */
  openedUris: Set<string>;
  /** Monotonic JSON-RPC request id. */
  msgId: number;
  /** Pending request id → { resolve, reject }. */
  pendingRequests: Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>;
  /** Incoming frame buffer (text). */
  buffer: string;
  /** TextDecoder for binary frames. */
  decoder: TextDecoder;
  /** In-flight initialize promise. */
  _initPromise: Promise<void> | null;
  _initResolve: (() => void) | null;
  _initReject: ((e: Error) => void) | null;
}

export function createInitialState(): LspState {
  return {
    ws: null,
    languageId: '',
    rootUri: 'file:///sdcard',
    initializationOptions: {},
    initialized: false,
    isInitializing: false,
    disposables: [],
    modelUriMap: new Map(),
    openedUris: new Set(),
    msgId: 1,
    pendingRequests: new Map(),
    buffer: '',
    decoder: new TextDecoder('utf-8'),
    _initPromise: null,
    _initResolve: null,
    _initReject: null,
  };
}
