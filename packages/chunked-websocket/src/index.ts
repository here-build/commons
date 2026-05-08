// Default entry point — wire-format primitives.
//
// Most consumers want one of the higher-level adapters:
//   - `@here.build/chunked-websocket/client` — `ChunkedWebSocket`, a
//     drop-in browser WebSocket polyfill.
//   - `@here.build/chunked-websocket/server` — `ChunkedDOTransport`, an
//     adapter for Cloudflare Durable Object hibernation API.
//
// The primitives below are exposed for tests and for protocols that
// can't use either adapter directly.
export {
  CHUNK_MAX_SIZE,
  RESET_SENTINEL,
  sendChunked,
  handleChunked,
  parseBatchMarker,
  type ChunkedReceiveHandler,
  type SendCapableSocket,
  type ChunkedMessageData,
  type ChunkedMessageEvent,
} from "./protocol.js";
