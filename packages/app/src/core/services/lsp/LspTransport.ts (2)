// src/core/services/lsp/LspTransport.ts

import type { LspState, JsonRpcRequest, JsonRpcNotification } from './types';

/** Shared TextEncoder instance utilized across framing calculations to protect multi-byte characters */
const ENCODER = new TextEncoder();

// ─── INTERNAL STREAM FRAMING HELPERS ──────────────────────────────────────────

/**
 * Wraps raw stringified payloads inside canonical Content-Length headers.
 * Uses exact byte-length evaluations instead of string character counts.
 * 
 * @param body Unframed stringified JSON-RPC message payload.
 */
function frame(body: string): string {
  return `Content-Length: ${ENCODER.encode(body).length}\r\n\r\n${body}`;
}

// ─── PUBLIC LOW-LEVEL TRANSPORT OPERATIONS ────────────────────────────────────

/**
 * Transmits a fire-and-forget asynchronous notification to the language server port.
 * Does not spawn pending message listeners or register tracking indices.
 * 
 * @param state The central language server operational state cache context.
 * @param method Destination RPC routing method token string.
 * @param params Associated contextual configurations dispatched with notifications.
 */
export function sendNotify(state: LspState, method: string, params: unknown): void {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  
  console.log(`[LSP] [NOTIFY →] ${method}`);
  const body = JSON.stringify({ jsonrpc: '2.0', method, params } as JsonRpcNotification);
  state.ws.send(frame(body));
}

/**
 * Executes an asynchronous request-response RPC interaction cycle.
 * Mounts a strict 10,000ms terminal lifecycle timeout protection barrier.
 * 
 * @param state The central language server operational state cache context.
 * @param method Destination RPC routing method token string.
 * @param params Associated query configurations dispatched with requests.
 */
export function sendRequest(state: LspState, method: string, params: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('WebSocket connection has dropped or is not currently open'));
    }
    
    const id = state.msgId++;
    state.pendingRequests.set(id, { resolve, reject });
    console.log(`[LSP] [REQUEST →] ${method} (id: ${id})`);
    
    const body = JSON.stringify({ jsonrpc: '2.0', id, method, params } as JsonRpcRequest);
    state.ws.send(frame(body));

    // Cold start on Android (pyright + node via linker) can exceed 10s
    const timeoutMs = method === 'initialize' ? 45_000 : 15_000;
    setTimeout(() => {
      if (state.pendingRequests.has(id)) {
        state.pendingRequests.delete(id);
        reject(new Error(
          method === 'initialize'
            ? 'LSP initialize timeout'
            : `Language server interaction timed out on command: ${method}`,
        ));
      }
    }, timeoutMs);
  });
}

/**
 * Forwards matching resolution data back to the server following an explicit internal query request.
 * 
 * @param state The central language server operational state cache context.
 * @param id Original tracking message transaction ID provided by the host client.
 * @param result Formatted diagnostic block mapping required system attributes.
 */
export function sendResponse(state: LspState, id: number, result: any): void {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  
  const body = JSON.stringify({ jsonrpc: '2.0', id, result });
  state.ws.send(frame(body));
}

/**
 * Continuously scans and decodes incoming raw framed stream buffers.
 * Unpacks discrete complete JSON messages using binary slicing blocks to accommodate split network ticks.
 * 
 * @param state The central language server operational state cache context.
 * @param onMessage Structural completion callback triggered when message bodies are verified.
 */
export function processBuffer(
  state: LspState,
  onMessage: (msg: any) => void,
): void {
  while (true) {
    const match = state.buffer.match(/Content-Length:\s*(\d+)\r\n(?:[^\r\n]+\r\n)*\r\n/i);
    if (!match) break;

    const contentLength = parseInt(match[1], 10);
    
    // Convert string states to binary representations to prevent multi-byte symbol offset drifting
    const bufferBytes = ENCODER.encode(state.buffer);
    const headerStartBytes = ENCODER.encode(state.buffer.slice(0, match.index!)).length;
    const headerLenBytes = ENCODER.encode(match[0]).length;
    
    const msgStart = headerStartBytes + headerLenBytes;
    const totalBytes = msgStart + contentLength;

    // Structural Guard: Postpone processing loops if trailing network frames remain unbuffered
    if (bufferBytes.length < totalBytes) break;

    const jsonStr = state.decoder.decode(bufferBytes.slice(msgStart, totalBytes));
    const remainingBytes = bufferBytes.slice(totalBytes);
    state.buffer = state.decoder.decode(remainingBytes);

    try {
      const msg = JSON.parse(jsonStr);
      if (msg?.error) {
        console.error(
          '[LSP] [← RECV ERROR]',
          `id:${msg.id}`,
          JSON.stringify(msg.error),
        );
      } else {
        console.log(
          `[LSP] [← RECV]`,
          msg?.method ?? `id:${msg?.id}`,
          msg?.result && typeof msg.result === 'object'
            ? `(keys: ${Object.keys(msg.result).slice(0, 8).join(',')})`
            : '',
        );
      }
      onMessage(msg);
    } catch (e) {
      console.error('[LSP] Stream chunk parsing exception:', e, 'raw=', jsonStr.slice(0, 200));
    }
  }
}

/**
 * Route incoming unpacked payloads based on message structural fingerprints.
 * Automatically replies to telemetry signals and lifecycle progress structures.
 * 
 * @param state The central language server operational state cache context.
 * @param msg Processed multi-layered dynamic payload structure.
 * @param onNotification Redirection callback routing asynchronous message vectors.
 */
export function dispatchMessage(
  state: LspState,
  msg: any,
  onNotification: (method: string, params: any) => void,
): void {
  if (msg.id != null && msg.method) {
    // ── INTERCEPTIVE AUTOREPLY LAYER ──
    // Handshake loop satisfying environment status tokens natively
    if (msg.method === 'window/workDoneProgress/create') {
      sendResponse(state, msg.id, null);
    } else if (msg.method === 'workspace/configuration') {
      sendResponse(state, msg.id, [{}]);
    } else {
      sendResponse(state, msg.id, null);
    }
  } else if (msg.id != null) {
    // ── OUTGOING REQUEST RESPONSE RESOLUTION LAYER ──
    const pending = state.pendingRequests.get(msg.id);
    if (pending) {
      state.pendingRequests.delete(msg.id);
      if (msg.error) {
        const errObj = msg.error;
        const detail =
          typeof errObj === 'object'
            ? (errObj.message || JSON.stringify(errObj))
            : String(errObj);
        console.error('[LSP] request failed id=' + msg.id + ':', detail);
        pending.reject(
          errObj instanceof Error
            ? errObj
            : Object.assign(new Error(detail), { lspError: errObj }),
        );
      } else {
        pending.resolve(msg.result);
      }
    }
  } else if (msg.method) {
    // ── SERVER ASYNCHRONOUS NOTIFICATION LAYER ──
    onNotification(msg.method, msg.params);
  }
}
