/**
 * `WebSocket`-shaped wrapper that applies transparent chunking.
 *
 * One class, two constructor modes:
 *
 *   1. **Browser-style** — `new ChunkedWebSocket(url, protocols)` opens a
 *      fresh native `WebSocket` and wraps it. Drop-in replacement for the
 *      native constructor; works as `y-websocket`'s `WebSocketPolyfill`,
 *      anywhere a `WebSocket` constructor is expected.
 *
 *   2. **Server-side wrap** — `new ChunkedWebSocket(rawWs)` wraps an
 *      existing WebSocket (typically a workerd Durable Object's
 *      server-side socket from `acceptWebSocket(...)`, or a `ws` library
 *      socket on Node). The wrapper does NOT take ownership of the raw
 *      socket's lifecycle — the host (DO, server) keeps managing
 *      `acceptWebSocket` / `close` / hibernation; the wrapper is just the
 *      framing adapter.
 *
 * Inbound:
 *   - In browser-mode the wrapper subscribes to the native
 *     `WebSocket.onmessage` and runs every frame through `handleChunked`.
 *   - In server-wrap mode, the host has to feed raw frames in by
 *     calling `feed(rawMessage)` (because workerd's hibernation API is
 *     callback-shaped, not EventTarget-shaped — there's no `onmessage`
 *     to subscribe to from outside the DO). After feeding, the wrapper
 *     emits `'message'` events on its own EventTarget surface when a
 *     full application message has been reassembled.
 *
 * Outbound: both modes use `sendChunked` — anything above `CHUNK_MAX_SIZE`
 * splits into start-marker / N×binary / end-marker frames.
 *
 * Surface implemented (matches the WebSocket members consumers actually
 * touch — y-websocket, plain `ws.send` / `ws.onmessage` users, etc.):
 *   - constructor(url, protocols?)        — browser mode
 *   - constructor(existingWebSocket)      — server-wrap mode
 *   - readyState, binaryType, url, protocol, bufferedAmount
 *   - OPEN/CLOSED/CONNECTING/CLOSING constants
 *   - onopen, onclose, onerror, onmessage setters
 *   - addEventListener / removeEventListener (via inherited EventTarget)
 *   - send(data)
 *   - close(code?, reason?)
 *   - feed(rawMessage)                    — server-wrap mode only
 */

import { handleChunked, RESET_SENTINEL, sendChunked, type ChunkedReceiveHandler } from "./protocol.js";

type MessageEventLike = { data: ArrayBuffer | string };

/**
 * Minimal shape of the underlying WebSocket the wrapper drives. The
 * browser's `WebSocket`, workerd's `WebSocket`, and Node's `ws` are all
 * structurally compatible with this.
 */
interface RawWebSocketLike {
  readyState: number;
  binaryType?: BinaryType;
  readonly url?: string;
  readonly protocol?: string;
  readonly bufferedAmount?: number;
  // Typed loosely — workerd's `WebSocket.send` accepts `ArrayBuffer |
  // ArrayBufferView | string`; the browser DOM's adds `Blob` and
  // `ArrayBufferLike`. Both accept what we pass (Uint8Array views and
  // string sentinels), and a precise union won't satisfy both at once.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(data: any): void;
  close(code?: number, reason?: string): void;
  // Browser-only — server-side WebSockets (workerd hibernation API)
  // don't expose these as the host receives messages via callbacks
  // instead. Property bag deliberately loose: native `WebSocket.onX`
  // signatures vary across runtimes (browser vs workerd) — wrapping
  // them precisely here trades real interop for surface noise. The
  // browser-mode constructor branch is the only place these handlers
  // get assigned, and it casts to the native `WebSocket` type before
  // touching them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onopen?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onclose?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onmessage?: any;
}

export class ChunkedWebSocket extends EventTarget {
  // WebSocket protocol-spec readyState constants.
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  private inner: RawWebSocketLike;

  // Property-setter handlers for users that don't use addEventListener.
  // Forwarded to the inner socket (or filtered through chunking, for
  // onmessage). EventTarget's `addEventListener('message', ...)` works
  // alongside these — both fire on reassembled messages.
  onopen: ((this: ChunkedWebSocket, ev: Event) => unknown) | null = null;
  onclose: ((this: ChunkedWebSocket, ev: CloseEvent) => unknown) | null = null;
  onerror: ((this: ChunkedWebSocket, ev: Event) => unknown) | null = null;
  onmessage: ((this: ChunkedWebSocket, ev: MessageEventLike) => unknown) | null = null;

  private readonly chunkHandler: ChunkedReceiveHandler;

  constructor(urlOrWebSocket: string | RawWebSocketLike, protocols?: string | string[]) {
    super();

    if (typeof urlOrWebSocket === "string") {
      // Browser mode — open a fresh native WebSocket.
      this.inner = new WebSocket(urlOrWebSocket, protocols);
      // y-websocket relies on `event.data` being an `ArrayBuffer` for
      // binary frames; native default is "blob", so flip it eagerly.
      this.inner.binaryType = "arraybuffer";
    } else {
      // Server-wrap mode — adopt an existing WebSocket. No subscription
      // setup; the host calls `feed(...)` for every inbound frame.
      this.inner = urlOrWebSocket;
    }

    this.chunkHandler = handleChunked((data) => {
      const ev = { data: data as ArrayBuffer };
      this.onmessage?.call(this, ev);
      this.dispatchEvent(new MessageEvent("message", { data: ev.data }));
    });

    // Browser-mode wiring: subscribe to native events and forward them.
    // In server-wrap mode `inner.onmessage` is read-only or absent; the
    // host feeds frames via `feed(...)` instead.
    if (typeof urlOrWebSocket === "string") {
      const native = this.inner as WebSocket;
      native.onmessage = (ev) => this.chunkHandler({ data: ev.data as ArrayBuffer | string });
      native.onopen = (ev) => {
        this.onopen?.call(this, ev);
        this.dispatchEvent(new Event("open"));
      };
      native.onclose = (ev) => {
        this.onclose?.call(this, ev);
        this.dispatchEvent(new CloseEvent("close", ev));
      };
      native.onerror = (ev) => {
        this.onerror?.call(this, ev);
        this.dispatchEvent(new Event("error"));
      };
    }
  }

  /**
   * Server-wrap mode only. The host (workerd DO, Node `ws` server, …)
   * calls this with every raw inbound frame. After reassembly the
   * wrapper fires a `'message'` event whose `data` is the joined
   * `ArrayBuffer` (or the original frame untouched if it was unchunked).
   *
   * In browser mode `feed` is unused — the wrapper subscribes to
   * native `onmessage` itself. Calling `feed` in that mode is a no-op
   * with the right semantics (just a duplicate dispatch path; harmless
   * if you do, redundant if you don't).
   */
  feed(rawMessage: ArrayBuffer | string): void {
    this.chunkHandler({ data: rawMessage });
  }

  /**
   * Drop any in-flight batch state and enter DRAIN mode — subsequent
   * binary frames are silently discarded until the next `start` marker
   * arrives. Use when the wrapper's view of the conversation has gone
   * stale (e.g. server post-hibernation: it has no idea whether the
   * peer is mid-upload, so it discards anything not bracketed by fresh
   * markers).
   *
   * Does not notify the peer. Pair with `dispatchReset()` if the peer
   * should also drop its state.
   */
  beginDrain(): void {
    this.chunkHandler.reset();
  }

  /**
   * Send a reset marker to the peer. The peer's chunked-receive handler
   * will drop any in-flight batch state and enter DRAIN itself. Used by
   * the server when it observes a WebSocket it has no in-memory state
   * for (fresh accept OR post-hibernation wake) to invalidate whatever
   * batch the client may have been mid-receiving.
   *
   * Idempotent and cheap (one ~10-byte text frame). Does not change
   * the local handler's state — call `beginDrain()` separately if you
   * also need to drop local state.
   */
  dispatchReset(): void {
    this.inner.send(RESET_SENTINEL);
  }

  get readyState(): number {
    return this.inner.readyState;
  }

  get binaryType(): BinaryType {
    return this.inner.binaryType ?? "arraybuffer";
  }
  set binaryType(value: BinaryType) {
    this.inner.binaryType = value;
  }

  get url(): string {
    return this.inner.url ?? "";
  }

  get protocol(): string {
    return this.inner.protocol ?? "";
  }

  get bufferedAmount(): number {
    return this.inner.bufferedAmount ?? 0;
  }

  send(data: ArrayBuffer | ArrayBufferView | string): void {
    if (typeof data === "string") {
      this.inner.send(data);
      return;
    }
    if (ArrayBuffer.isView(data)) {
      // y-websocket sends `Uint8Array` from `encoding.toUint8Array(...)`.
      // Use the underlying buffer slice so chunking sees a flat
      // ArrayBuffer of the right byte range.
      sendChunked(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), this.inner);
      return;
    }
    sendChunked(data, this.inner);
  }

  close(code?: number, reason?: string): void {
    this.inner.close(code, reason);
  }
}
