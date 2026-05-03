# @here.build/lexical-namer

Lexical-scope-aware name assignment. Generalizes
[`@here.build/priority-namer`](../priority-namer) from a single flat pool to a
tree of nested scopes.

```
priority-namer  : flat pool, one resolution pass
lexical-namer   : tree of pools, one priority-namer pass per scope,
                  with parent-chain reservations folded in
```

## Concepts

- **Scope tree** — input is a `ScopeSpec<E>` whose `children` recursively form
  the tree. Each scope has its own reservations and entities.
- **Parent-chain visibility** — a name claimed in scope `S` is visible
  (reserved) in any descendant of `S`, but NOT in siblings.
- **Sibling independence** — two siblings can independently assign the same
  name; their resolutions don't see each other.
- **Per-scope tie semantics** — `onTie: "burn" | "free"` controls whether a
  bare name contested at one tier is off-limits to lower tiers in the same
  scope.

## API

```ts
import { resolveLexicalNames, type ScopeSpec } from "@here.build/lexical-namer";

const result = resolveLexicalNames<MyKey>(rootScope, {
  postfixFor: (key) => key.uuid.slice(-8),
  resolveTie: (name, postfix) => `${name}_${postfix}`, // JS-friendly
  onTie: "free",
});

result.assignments.get(myEntity.key); // → assigned name
```

See `src/index.ts` for the full type surface and `src/__tests__/resolver.test.ts`
for the contract.

## Status

API + tests defined; resolver implementation pending. Tests fail with
"not yet implemented" until the resolver lands.
