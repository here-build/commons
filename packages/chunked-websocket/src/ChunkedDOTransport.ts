/**
 * Per-DO chunking transport — a callback-shaped convenience over
 * `ChunkedWebSocket`'s server-wrap mode.
 *
 * Cloudflare's DO Hibernation API delivers WebSocket frames to a DO
 * via `webSocketMessage(ws, msg)` callbacks, not via EventTarget
 * subscriptions. This class hides the per-WebSocket bookkeeping (lazy
 * wrapper creation, `feed(...)` dispatch, `'message'` listener wiring)
 * behind a two-method surface — `onRawMessage` and `send` — so the DO
 * can stay focused on application logic.
 *
 * If you'd rather drive the wrappers directly (one `ChunkedWebSocket`
 * per raw socket, EventTarget API), skip this class and instantiate
 * `new ChunkedWebSocket(rawWs)` per accepted WebSocket. The transport
 * just maintains the `Map<rawWs, ChunkedWebSocket>` for you.
 *
 * Usage:
 *
 *     // In your DO class:
 *     private readonly transport = new ChunkedDOTransport(
 *       (ws, data) => this.processAppMessage(ws, data),
 *     );
 *
 *     async webSocketMessage(ws: WebSocket, msg: ArrayBuffer | string) {
 *       this.transport.onRawMessage(ws, msg);
 *     }
 *
 *     async webSocketClose(ws: WebSocket) {
 *       this.transport.detach(ws);
 *     }
 *
 *     // To send (anywhere in the DO):
 *     this.transport.send(ws, anyArrayBuffer);
 */

import { ChunkedWebSocket } from "./ChunkedWebSocket.js";

type AppMessageHandler = (ws: WebSocket, data: ArrayBuffer | string) => void;

export class ChunkedDOTransport {
  // `Map` rather than `WeakMap` because explicit `detach(ws)` is the
  // documented lifecycle hook (called from `webSocketClose`); we don't
  // want entries lingering until GC, and we want lookups to be cheap
  // even after a hibernation/wake cycle.
  private readonly wrappers = new Map<WebSocket, ChunkedWebSocket>();

  constructor(private readonly onAppMessage: AppMessageHandler) {}

  /**
   * Pass every raw WebSocket frame through this. Returns nothing — the
   * `onAppMessage` callback (provided to the constructor) is invoked
   * once per fully-reassembled message.
   */
  onRawMessage(ws: WebSocket, msg: ArrayBuffer | string): void {
    this.wrap(ws).feed(msg);
  }

  /**
   * Send an application message over `ws`. Frames above `CHUNK_MAX_SIZE`
   * are split automatically; smaller frames pass through `ws.send()`
   * directly.
   */
  send(ws: WebSocket, data: ArrayBuffer): void {
    this.wrap(ws).send(data);
  }

  /**
   * Drop chunking state for `ws`. Call from `webSocketClose` /
   * `webSocketError` so the per-WS wrapper closure can be GC'd.
   */
  detach(ws: WebSocket): void {
    this.wrappers.delete(ws);
  }

  private wrap(ws: WebSocket): ChunkedWebSocket {
    let wrapper = this.wrappers.get(ws);
    if (!wrapper) {
      wrapper = new ChunkedWebSocket(ws);
      // Bridge EventTarget → callback. Single shared callback target
      // for every reassembled message on this socket.
      wrapper.addEventListener("message", (e) => {
        const data = (e as MessageEvent).data as ArrayBuffer | string;
        this.onAppMessage(ws, data);
      });
      this.wrappers.set(ws, wrapper);
    }
    return wrapper;
  }
}
