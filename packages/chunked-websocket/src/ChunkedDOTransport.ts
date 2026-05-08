/**
 * Server-side chunking transport for Cloudflare Durable Objects.
 *
 * The DO Hibernation API is callback-based — a DO receives WebSocket
 * frames via `webSocketMessage(ws, msg)` and sends via `ws.send(msg)`.
 * That's not enough surface to wrap a WebSocket as a single object the
 * way browsers can; this class therefore holds *per-WebSocket* chunking
 * state on the DO side and exposes two methods the DO routes through.
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
 *
 * The application's `processAppMessage` only ever sees fully-reassembled
 * messages — chunking is invisible above this line. Outbound `send`
 * automatically frames anything above `CHUNK_MAX_SIZE`.
 *
 * State lifecycle: a per-WS reassembler is created lazily on first
 * `onRawMessage` / `send`, and dropped on `detach`. State does not
 * survive DO hibernation; mid-batch eviction means the client times out
 * and re-syncs (matches partykit).
 */

import { handleChunked, sendChunked, type ChunkedMessageData, type SendCapableSocket } from "./protocol.js";

type AppMessageHandler = (ws: WebSocket, data: ArrayBuffer | string) => void;

export class ChunkedDOTransport {
  // `Map` rather than `WeakMap` because Cloudflare's hibernation may
  // dehydrate and rehydrate the WebSocket object identity across
  // hibernation boundaries; we want explicit `detach` to drop entries.
  // For non-hibernating WSes a `WeakMap` would also work, but this
  // keeps the lifecycle uniform.
  private readonly handlers = new Map<WebSocket, (e: { data: ChunkedMessageData }) => void>();

  constructor(private readonly onAppMessage: AppMessageHandler) {}

  /**
   * Pass every raw WebSocket frame through this. Returns nothing — the
   * `onAppMessage` callback (provided to the constructor) is invoked
   * once per fully-reassembled message.
   *
   * Frames inside a chunked batch are buffered; the start/end text
   * sentinels are intercepted; small unchunked binary frames pass through
   * directly.
   */
  onRawMessage(ws: WebSocket, msg: ArrayBuffer | string): void {
    let handler = this.handlers.get(ws);
    if (!handler) {
      handler = handleChunked((data) => this.onAppMessage(ws, data as ArrayBuffer | string));
      this.handlers.set(ws, handler);
    }
    handler({ data: msg });
  }

  /**
   * Send an application message over `ws`. Frames above `CHUNK_MAX_SIZE`
   * are split automatically; smaller frames pass through `ws.send()`
   * directly.
   */
  send(ws: WebSocket & SendCapableSocket, data: ArrayBuffer): void {
    sendChunked(data, ws);
  }

  /**
   * Drop chunking state for `ws`. Call from `webSocketClose` /
   * `webSocketError` so the per-WS handler closure can be GC'd.
   */
  detach(ws: WebSocket): void {
    this.handlers.delete(ws);
  }
}
