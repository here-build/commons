/**
 * Ordinal protocol — a stable, process-local handle for an OBJECT, keyed off its
 * pointer identity.
 *
 * `id(o)` assigns a monotonic integer the first time it sees `o` (cached in a
 * `WeakMap`, so it never leaks) and returns that same integer forever after. It is
 * **never serialized and crosses no process boundary** — it only has to be
 * *consistent within a session*, not *meaningful*.
 *
 * `sort(a, b)` is a total order over key elements that uses `id` for objects (so an
 * unordered set of objects has one canonical order) and type-then-value for
 * primitives.
 *
 * Why it exists: when you need to identify objects by reference within one process —
 * as `Map` keys, or to give an unordered `Set` a canonical order — without inventing
 * a serialized id. It pairs especially well with anything that guarantees singleton
 * objects (one stable object per logical thing): the ordinal then becomes a reliable
 * session-local id for a thing that has no globally-shared id of its own.
 */

type Primitive = string | number | boolean | bigint | null;
/** A single sortable key element: a primitive, or any object (keyed by reference). */
export type KeyElement = Primitive | object;

let next = 0;
const ids = new WeakMap<object, number>();

/** The stable, process-local ordinal of an object — assigned once on first sight. */
export function id(o: object): number {
  let n = ids.get(o);
  if (n === undefined) {
    n = next++;
    ids.set(o, n);
  }
  return n;
}

/** A total order: objects by their ordinal, primitives by type then value. */
export function sort(a: KeyElement, b: KeyElement): number {
  const aIsObj = typeof a === "object" && a !== null;
  const bIsObj = typeof b === "object" && b !== null;

  if (aIsObj && !bIsObj) return -1;
  if (!aIsObj && bIsObj) return 1;
  if (aIsObj && bIsObj) return id(a) - id(b);

  const aType = a === null ? "null" : typeof a;
  const bType = b === null ? "null" : typeof b;
  if (aType !== bType) return aType.localeCompare(bType);
  return String(a).localeCompare(String(b));
}
