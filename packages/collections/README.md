# @here.build/collections

Map/WeakMap collection utilities with default-value semantics, plus optional MobX-reactive computed variants.

## Install

```bash
pnpm add @here.build/collections
```

## Usage

```ts
import { DefaultedMap, Counter } from "@here.build/collections";

const groups = new DefaultedMap<string, string[]>(() => []);
groups.get("a").push("x");   // auto-creates the array

const counts = new Counter<string>();
counts.add("hit");
```

- **`DefaultedMap` / `DefaultedWeakMap`** — `get` auto-creates a missing entry from a factory.
- **`Counter`** — tally occurrences.
- **`PathMap`** — tuple/path keys.
- **`ArrayMultimap` / `SetMultimap`** — one key, many values.
- **`ordinal`** — process-local, pointer-identity object handles (see below).
- **`/mobx` subpath** — `ComputedMap`, `ComputedWeakMap`, `ComputedUniformMap`: MobX-reactive computed variants.

### `ordinal` — process-local object identity

```ts
import { ordinal } from "@here.build/collections";

ordinal.id(obj);          // stable monotonic int, assigned on first sight, cached in a WeakMap
ordinal.sort(a, b);       // total order: objects by their ordinal, primitives by type then value
```

- **`ordinal.id(o)`** — a stable handle for an object keyed off its **pointer identity**. Assigned the first time it sees `o` and returned unchanged forever after. **Never serialized, never crosses a process boundary** — it only has to be *consistent within a session*, not *meaningful*. Use it to key a `Map` by reference, or to give an unordered `Set` a canonical order, without inventing a serialized id.
- **`ordinal.sort(a, b)`** — a comparator using `ordinal.id` for objects and type-then-value for primitives.

Pairs naturally with anything that guarantees **singleton objects** (one stable object per logical thing): the ordinal then becomes a reliable session-local id for a thing that has no shared id of its own yet.

```ts
import { ComputedMap } from "@here.build/collections/mobx";
```

## License

[FSL-1.1-MIT](./LICENSE.md) — Functional Source License 1.1, MIT Future License. Each version converts to MIT two years after its release date.
