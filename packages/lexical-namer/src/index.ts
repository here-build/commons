/**
 * Lexical-scope-aware name assignment.
 *
 * Generalizes {@link @here.build/priority-namer} from "one flat pool" to
 * "tree of nested scopes." Each scope runs its own priority-resolution pass
 * with reservations propagated down the parent chain. Sibling scopes don't
 * see each other's claims — same name can occupy two disjoint scopes.
 *
 * Domain-agnostic: usable for JS identifiers, CSS custom properties, or any
 * lexically-scoped namespace. The caller maps domain entities to opaque
 * keys and supplies prioritized candidate ladders; this module owns the
 * tree resolution algorithm.
 *
 * Composition with priority-namer:
 *   priority-namer  : flat pool, one resolution pass
 *   lexical-namer   : tree of pools, one priority-namer pass per scope,
 *                     with parent-chain reservations folded in
 *
 * The flat case (`{ entities: [...] }` with no children) is exactly equivalent
 * to a single priority-namer call.
 */

import { type PrioritizedCandidate } from "@here.build/priority-namer";

/**
 * One node in the lexical scope tree.
 *
 * Reservations and assigned names propagate to descendants but not to
 * siblings. A descendant cannot reuse an ancestor's name; two siblings can
 * independently assign the same name.
 */
export interface ScopeSpec<E> {
  /**
   * Optional identifier — used for per-scope result lookup
   * ({@link ResolveResult.claimsByScope}, {@link ResolveResult.burnedByScope})
   * and as a debugging aid in error messages. When omitted, the scope is
   * still processed but results aren't keyed by it.
   */
  readonly id?: string;

  /**
   * Names that cannot be claimed at this scope or any descendant. Use for
   * pre-known external names: framework imports, language keywords,
   * user-referenced globals scanned out of embedded user code, sigil-private
   * prefixes, etc.
   */
  readonly reservations?: readonly string[];

  /**
   * Entities competing for names at this scope level.
   * Iteration order does NOT affect output (uses caller-supplied
   * `compareEntities` / `postfixFor` for stability).
   */
  readonly entities?: readonly ScopedEntity<E>[];

  /**
   * Child scopes — each child sees this scope's claims as reservations,
   * but children are independent of each other.
   */
  readonly children?: readonly ScopeSpec<E>[];
}

/**
 * One entity competing for a name. The `key` is the consumer's handle —
 * it identifies this entity in the result map. Must be unique across the
 * entire tree (the resolver does NOT check; collisions silently overwrite).
 */
export interface ScopedEntity<E> {
  readonly key: E;

  /**
   * Priority-ordered name candidates. The resolver tries higher-importance
   * candidates first; on collision (against reservations or ties with other
   * entities), it walks down to the next candidate.
   *
   * The last candidate should be guaranteed-unique (e.g. UUID-tail-derived).
   * If all candidates are exhausted at the priority level and a fallback
   * is still needed, {@link ResolveOptions.fallbackSuffix} produces a
   * numeric suffix on the final candidate.
   */
  readonly candidates: readonly PrioritizedCandidate[];
}

export interface ResolveOptions<E> {
  /**
   * Deterministic per-entity postfix used for tie resolution. MUST be
   * injective across the entity set: two distinct entities must never
   * produce the same postfix. The resolver validates this on tied groups
   * and throws if violated.
   *
   * Typical: `(entity) => entity.uuid.slice(-8)` for entities with stable UUIDs.
   */
  postfixFor: (entity: E) => string;

  /**
   * Tie-resolution form when two entities want the same name at the same
   * importance. Default: `(name, postfix) => `${name}-${postfix}`` (CSS-friendly).
   * For JS use: `(name, postfix) => `${name}_${postfix}`` (no hyphens in JS idents).
   */
  resolveTie?: (name: string, postfix: string) => string;

  /**
   * Numeric-fallback form when an entity's last candidate collides with an
   * existing claim. Default: `(name, n) => `${name}${n}`` (n starts at 2).
   */
  fallbackSuffix?: (name: string, n: number) => string;

  /**
   * What happens to the bare name after a tie is resolved:
   *
   * - `"burn"` (default): the bare name is off-limits to all lower-importance
   *   claimers in this scope. Use when names carry identity (CSS classes).
   * - `"free"`: the bare name remains claimable. Use for JS identifiers
   *   where lower priorities don't carry identity.
   *
   * Note: burn semantics are scoped — a name burned in scope S is burned
   * for descendants of S, but NOT for siblings of S.
   */
  onTie?: "burn" | "free";

  /**
   * Stable comparator for tied entities. Default: lexical compare on
   * `postfixFor(entity)`. Provide for deterministic output across runs.
   */
  compareEntities?: (a: E, b: E) => number;

  /**
   * Human-readable description for error messages. Default: best-effort
   * inspection of common shapes (`uuid`, `id`, `name` properties).
   */
  describeEntity?: (entity: E) => string;
}

export interface ResolveResult<E> {
  /**
   * Every entity in the tree → its final assigned name. Guaranteed:
   * within any scope, no two entities share the same name; across the tree,
   * entities in disjoint sibling scopes MAY share the same name.
   */
  assignments: ReadonlyMap<E, string>;

  /**
   * Per-scope view of names claimed by entities at that scope. Keyed by
   * `ScopeSpec.id`; scopes without an id are absent from this map.
   */
  claimsByScope: ReadonlyMap<string, ReadonlySet<string>>;

  /**
   * Per-scope view of names burned by tie-breaking at that scope (only
   * populated when `onTie === "burn"`). Keyed by `ScopeSpec.id`.
   */
  burnedByScope: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Resolve all entities in a scope tree to non-colliding names.
 *
 * Algorithm (specification, not implementation):
 *
 * 1. For each scope, compute `effectiveReservations` =
 *    `(this.reservations ∪ ancestors.reservations ∪ ancestors.claims) for all ancestors`
 * 2. Run priority-namer's resolution at each scope using its `entities` and
 *    `effectiveReservations`. Record claims and burned names on the scope.
 * 3. Recurse into children with parent's claims now visible as reservations.
 * 4. Sibling scopes are independent — neither sees the other's claims.
 *
 * Pure function: same input produces same output. No iteration-order
 * dependence (entities are sorted by `compareEntities` internally).
 */
export function resolveLexicalNames<E>(
  _root: ScopeSpec<E>,
  _options: ResolveOptions<E>,
): ResolveResult<E> {
  throw new Error("@here.build/lexical-namer: resolveLexicalNames is not yet implemented");
}

export type { PrioritizedCandidate } from "@here.build/priority-namer";
