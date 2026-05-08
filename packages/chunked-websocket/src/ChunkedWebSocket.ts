/**
 * `WebSocket`-shaped client polyfill that applies transparent chunking.
 *
 * Used as a drop-in replacement for the native `WebSocket` in any context
 * that accepts a `WebSocket` constructor — notably `y-websocket`'s
 * `WebSocketPolyfill` option, but the class is protocol-agnostic and
 * works for any binary application traffic.
 *
 * Surface implemented (matches the WebSocket members actual consumers
 * touch — y-websocket, plain `ws.send` / `ws.onmessage` users, etc.):
 *   - constructor(url, protocols)
 *   - readyState, binaryType, OPEN/CLOSED/CONNECTING/CLOSING constants
 *   - onopen, onclose, onerror, onmessage setters
 *   - send(data)
 *   - close(code?, reason?)
 *
 * Inbound: native `MessageEvent`s flow through `handleChunked`; reassembled
 * messages are re-emitted as synthetic `MessageEvent`s with `data` set to
 * the joined `ArrayBuffer`.
 *
 * Outbound: `send()` runs through `sendChunked` so payloads above
 * `CHUNK_MAX_SIZE` are framed start/binary…/end automatically.
 */

import { handleChunked, sendChunked } from "./protocol.js";

type MessageEventLike = { data: ArrayBuffer | string };

export class ChunkedWebSocket {
  // WebSocket protocol-spec readyState constants.
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  private inner: WebSocket;

  // y-websocket assigns these via property setters; we forward to the
  // inner socket (or filter through chunking, in onmessage's case).
  onopen: ((this: ChunkedWebSocket, ev: Event) => unknown) | null = null;
  onclose: ((this: ChunkedWebSocket, ev: CloseEvent) => unknown) | null = null;
  onerror: ((this: ChunkedWebSocket, ev: Event) => unknown) | null = null;
  onmessage: ((this: ChunkedWebSocket, ev: MessageEventLike) => unknown) | null = null;

  private readonly chunkHandler: (e: MessageEventLike) => void;

  constructor(url: string, protocols?: string | string[]) {
    this.inner = new WebSocket(url, protocols);
    // y-websocket relies on `event.data` being an `ArrayBuffer` for binary
    // frames; native default is "blob", so flip it eagerly.
    this.inner.binaryType = "arraybuffer";

    this.chunkHandler = handleChunked((data) => {
      // Reassembled message — synthesize the MessageEvent shape
      // y-websocket reads (`new Uint8Array(event.data)`).
      this.onmessage?.call(this, { data: data as ArrayBuffer });
    });

    this.inner.onmessage = (ev) => this.chunkHandler({ data: ev.data });
    this.inner.onopen = (ev) => this.onopen?.call(this, ev);
    this.inner.onclose = (ev) => this.onclose?.call(this, ev);
    this.inner.onerror = (ev) => this.onerror?.call(this, ev);
  }

  get readyState(): number {
    return this.inner.readyState;
  }

  get binaryType(): BinaryType {
    return this.inner.binaryType;
  }
  set binaryType(value: BinaryType) {
    this.inner.binaryType = value;
  }

  get url(): string {
    return this.inner.url;
  }

  get protocol(): string {
    return this.inner.protocol;
  }

  get bufferedAmount(): number {
    return this.inner.bufferedAmount;
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
