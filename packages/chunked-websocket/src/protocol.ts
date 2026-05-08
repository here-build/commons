/**
 * Wire-format primitives for transparent WebSocket message chunking.
 *
 * Application protocols (Yjs, comments, awareness, anything else) emit
 * normal binary messages; this layer transparently splits anything above
 * `CHUNK_MAX_SIZE` into multiple frames and reassembles on the far side.
 * The protocol does not inspect message content — purely a transport
 * concern.
 *
 * Adapted from `partykit/y-partykit/src/chunking.ts` (FSL/MIT, Cloudflare).
 * Behaviour preserved verbatim; protocol (sentinel string + JSON markers)
 * is binary-compatible with partykit's, so a here.build server can talk
 * to a partykit-style client and vice-versa during a transition.
 *
 * Wire format:
 *   - Messages ≤ `CHUNK_MAX_SIZE` are sent unchunked (passthrough).
 *   - Larger messages are framed as:
 *       1. text frame: `y-pk-batch#{"id","type":"start","size","count"}`
 *       2. N binary frames, each ≤ CHUNK_MAX_SIZE
 *       3. text frame: `y-pk-batch#{"id","type":"end","size","count"}`
 *   - Receivers buffer between start/end markers and pass the reassembled
 *     buffer to the original receive handler. Mismatched id/size/count
 *     throws.
 *
 * Text markers are distinguishable from binary application messages
 * because they're delivered as `string`-typed `data`, not `ArrayBuffer`.
 * Application protocols that send text messages are not currently
 * supported by this transport — pass them through some other channel.
 */

// Workerd's per-WebSocket-frame size limit is ~1 MiB. PartyKit uses
// 1_000_000 bytes; we match for protocol compatibility. Picking lower
// reduces per-large-message overhead trivially; picking higher will
// crash workerd with a 1009 protocol error.
export const CHUNK_MAX_SIZE = 1_000_000;

const BATCH_SENTINEL = "y-pk-batch";

interface BatchMarker {
  id: string;
  type: "start" | "end";
  size: number;
  count: number;
}

/**
 * Minimal `WebSocket.send` shape. Both workerd's and the browser's
 * `WebSocket` are assignable to this. Typed loosely so callers don't
 * need to cast — the receiver only ever passes `Uint8Array` (binary
 * frame, payload) or `string` (sentinel marker), both of which every
 * WebSocket implementation accepts.
 */
export interface SendCapableSocket {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(data: any): void;
}

/** Minimal incoming-message shape — `{ data }`, where data is binary or string. */
export type ChunkedMessageData = ArrayBufferLike | string;
export interface ChunkedMessageEvent {
  data: ChunkedMessageData;
}

let warnedAboutLargeMessage = false;

/**
 * Sends a binary message, splitting into chunks if it exceeds
 * `CHUNK_MAX_SIZE`. Small messages pass through untouched.
 */
export function sendChunked(data: ArrayBufferLike, ws: SendCapableSocket): void {
  if (data.byteLength <= CHUNK_MAX_SIZE) {
    // Wrap in Uint8Array so SharedArrayBuffer-shaped inputs match
    // `ArrayBufferView` (workerd's WebSocket.send rejects bare
    // SharedArrayBuffer but accepts views over it).
    ws.send(new Uint8Array(data as ArrayBuffer));
    return;
  }

  if (!warnedAboutLargeMessage) {
    console.warn(
      "[chunked-websocket]",
      `Yjs update size exceeds ${CHUNK_MAX_SIZE / 1_000_000} MB — splitting into chunks.`,
      `Message size: ${(data.byteLength / 1000 / 1000).toFixed(1)} MB`,
    );
    warnedAboutLargeMessage = true;
  }

  const id = (Date.now() + Math.random()).toString(36).substring(10);
  const chunks = Math.ceil(data.byteLength / CHUNK_MAX_SIZE);

  ws.send(serializeBatchMarker({ id, type: "start", size: data.byteLength, count: chunks }));

  let sentSize = 0;
  let sentChunks = 0;
  // `data` is ArrayBufferLike; we slice via Uint8Array to handle both
  // ArrayBuffer and SharedArrayBuffer-shaped inputs uniformly.
  const view = new Uint8Array(data as ArrayBuffer);
  for (let i = 0; i < chunks; i++) {
    const start = CHUNK_MAX_SIZE * i;
    const end = Math.min(CHUNK_MAX_SIZE * (i + 1), data.byteLength);
    const chunk = view.slice(start, end);
    ws.send(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
    sentChunks += 1;
    sentSize += chunk.byteLength;
  }

  ws.send(serializeBatchMarker({ id, type: "end", size: sentSize, count: sentChunks }));
}

/**
 * Wraps a receive callback to handle chunked messages.
 *
 * Returns a handler that accepts `{ data }`-shaped events (matching the
 * native `MessageEvent` shape) and forwards either the reassembled buffer
 * or, for unchunked messages, the original payload untouched.
 *
 * Stateful — keep one handler per WebSocket; chunks from concurrent
 * messages on the same socket are interleaved by start/end markers, but
 * a single handler only buffers one in-progress batch at a time.
 */
export function handleChunked(
  receive: (data: ChunkedMessageData) => void,
): (event: ChunkedMessageEvent) => void {
  let batch: ArrayBuffer[] | undefined;
  let start: BatchMarker | undefined;

  return (message) => {
    const { data } = message;

    if (isBatchSentinel(data)) {
      const marker = parseBatchMarker(data);
      if (marker.type === "start") {
        batch = [];
        start = marker;
        return;
      }

      // marker.type === "end"
      if (!batch || !start) return;
      try {
        assertEquality(start.id, marker.id, "batch id");
        assertEquality(start.count, marker.count, "batch counts");
        assertEquality(start.size, marker.size, "batch size");

        const totalSize = batch.reduce((sum, buf) => sum + buf.byteLength, 0);
        const bytes = new Uint8Array(totalSize);
        let written = 0;
        for (const chunk of batch) {
          bytes.set(new Uint8Array(chunk), written);
          written += chunk.byteLength;
        }

        assertEquality(marker.count, batch.length, "received chunk count");
        assertEquality(marker.size, written, "received chunk size");

        receive(bytes.buffer);
      } finally {
        batch = undefined;
        start = undefined;
      }
      return;
    }

    if (batch) {
      // Mid-batch binary frame — accumulate.
      batch.push(toArrayBuffer(data));
      return;
    }

    // Passthrough — unchunked message.
    receive(data);
  };
}

function toArrayBuffer(data: ChunkedMessageData): ArrayBuffer {
  if (typeof data === "string") {
    // Shouldn't happen mid-batch (sentinels are detected first), but
    // defensively encode just in case.
    return new TextEncoder().encode(data).buffer;
  }
  // Workerd / browsers deliver binary frames as ArrayBuffer; this also
  // covers SharedArrayBuffer-shaped inputs.
  if (data instanceof ArrayBuffer) return data;
  // SharedArrayBuffer or other ArrayBufferLike — copy into a fresh
  // ArrayBuffer so downstream `new Uint8Array(buf)` works uniformly.
  const view = new Uint8Array(data);
  const copy = new ArrayBuffer(view.byteLength);
  new Uint8Array(copy).set(view);
  return copy;
}

function assertEquality(expected: unknown, actual: unknown, label: string): void {
  if (expected !== actual) {
    throw new Error(`chunked-websocket: mismatching ${label} — expected ${String(expected)}, got ${String(actual)}`);
  }
}

function isBatchSentinel(msg: ChunkedMessageData): msg is string {
  return typeof msg === "string" && msg.startsWith(BATCH_SENTINEL);
}

function serializeBatchMarker(batch: BatchMarker): string {
  return `${BATCH_SENTINEL}#${JSON.stringify(batch)}`;
}

export function parseBatchMarker(msg: string): BatchMarker {
  const hashIdx = msg.indexOf("#");
  if (hashIdx < 0 || msg.slice(0, hashIdx) !== BATCH_SENTINEL) {
    throw new Error(`chunked-websocket: unexpected batch marker — ${msg}`);
  }
  const batch = JSON.parse(msg.slice(hashIdx + 1)) as BatchMarker;
  if (batch.type !== "start" && batch.type !== "end") {
    throw new Error(`chunked-websocket: unexpected batch type — ${msg}`);
  }
  return batch;
}
