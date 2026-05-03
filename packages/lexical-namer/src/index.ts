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
 */

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
   * Names that cannot be claimed at this scope or any descendant. Propagates
   * DOWN to children. Use for pre-known external names: framework imports,
   * language keywords, user-referenced free vars from embedded user code,
   * sigil-private prefixes.
   */
  readonly reservations?: readonly string[];

  /**
   * Names DECLARED by user code at this scope. Distinct from `reservations`
   * because user-declarations propagate UPWARD: any ancestor of this scope
   * also treats these names as blocked. This prevents our codegen at outer
   * scopes from allocating a name that user code declares below — which
   * would be a slot-injection hazard if any of our refs flow into the user-
   * declared scope and get shadowed.
   *
   * Strategy populates this by AST-scanning user CustomCode for declarations
   * (const, let, var, function params, class methods, etc.) at the scope
   * where the user code lands.
   *
   * Free *references* (vars used but not declared) belong in `reservations`
   * at the scope where the user code lands — they don't propagate upward.
   */
  readonly userDeclarations?: readonly string[];

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
 * One entity competing for naming. Two forms:
 *
 * - **Simple**: one binding, one default facet. Use `candidates`.
 *   Result expression = the resolved binding name.
 *
 * - **Rich**: multiple realizations (shapes), each with its own bindings
 *   and per-facet access expressions. Use `shapes`. Each shape is a
 *   complete way to realize this entity in code; the resolver picks the
 *   highest-priority shape whose bindings all fit the scope.
 *
 * Exactly one of `candidates` or `shapes` must be present.
 */
export interface ScopedEntity<E> {
  readonly key: E;

  /**
   * Simple form. Priority-keyed name preferences. Higher key = higher priority.
   *
   * Each value is a {@link Candidate}: either a string (fresh binding under
   * that name) or a {@link ViaPath} (access expression through an in-scope
   * name without allocating).
   *
   * Use for genuinely single-name entities (handlers, refs, imports, fetchers).
   * For state/query/mutation/anything that has read+setter or destructure
   * tradeoffs, use `shapes`.
   */
  readonly candidates?: Readonly<Record<number, Candidate>>;

  /**
   * Rich form. Each shape is a full realization of the entity, with its own
   * fresh bindings and per-facet access expressions. The resolver picks the
   * highest-priority shape whose bindings all allocate without collision and
   * whose external `viaName`s are in scope.
   *
   * Use when the entity has multiple physical realizations:
   *   - destructure (`[open, setOpen] = useState(...)`) vs non-destructure tuple
   *   - mobx box (`.get()` / `.set`) vs React tuple
   *   - passthrough (`props.open` / `props.onOpenChange`) vs local allocation
   *   - query result destructure vs single-binding member access
   */
  readonly shapes?: readonly Shape<E>[];
}

/**
 * A name candidate.
 *
 * - **string**: request a fresh binding allocated under this name. Valid iff
 *   the name doesn't collide with any reservation or claim in the scope chain.
 * - **{@link ViaPath}**: produce an access expression through an in-scope name.
 *   No fresh binding is allocated; the entity's resolution is the expression
 *   `${viaName}${access}`. Valid iff `viaName` is reserved or claimed in this
 *   scope or any ancestor.
 *
 * The two forms are interleavable in a single ladder. A common pattern for
 * global references with optional shorthand:
 *
 *   {
 *     100: { viaName: "navigator", access: "" },        // direct, if `navigator` is reserved
 *     80:  { viaName: "window", access: ".navigator" }, // window-prefixed fallback
 *   }
 */
export type Candidate = string | ViaPath;

/**
 * Access expression through an in-scope name. The resolved string is the
 * literal concatenation `${viaName}${access}` — there's no parsing.
 *
 * - `access` of "" is the direct-reference case (just `viaName`).
 * - `access` should include the connector token (`.`, `[`, `?.`).
 *
 * Examples:
 *   { viaName: "window", access: ".location" }   → "window.location"
 *   { viaName: "navigator", access: "" }         → "navigator"
 *   { viaName: "props", access: ".className" }   → "props.className"
 */
export interface ViaPath {
  readonly viaName: string;
  readonly access: string;
}

// ── Rich shape ───────────────────────────────────────────────────────

/**
 * One realization of a rich entity. The resolver evaluates shapes in
 * priority-descending order; picks the first whose `bindings` all allocate
 * and whose external `viaName`s in `facets` are in scope.
 *
 * All-or-nothing: a shape is selected as a whole or rejected entirely. The
 * resolver does not "half-select" — for example, it doesn't claim one of
 * a destructure shape's two bindings and skip the other.
 */
export interface Shape<E> {
  /** Higher = preferred. Same scale as candidate priorities. */
  readonly priority: number;

  /**
   * Fresh bindings allocated when this shape is selected. Each binding has
   * its own candidate ladder. Empty for path-only shapes (passthrough,
   * external-only globals) — those allocate nothing.
   */
  readonly bindings: readonly ShapeBinding<E>[];

  /**
   * Access expressions for each named facet of this entity. Facets are
   * domain-defined string keys: e.g., a state has "read" + "setter"; a query
   * has "data" + "status" + "error"; a single-name entity has just "default".
   */
  readonly facets: Readonly<Record<string, FacetExpr<E>>>;
}

/**
 * A fresh binding declared by a shape. Allocated like a simple-form entity
 * but scoped to the parent shape's selection — if the shape isn't selected,
 * the binding doesn't exist.
 */
export interface ShapeBinding<E> {
  /** Sub-entity identity. Must be unique across the resolution. */
  readonly subKey: E;
  /** Name candidates (same Record<priority, Candidate> form as simple entities). */
  readonly candidates: Readonly<Record<number, Candidate>>;
  /**
   * Reference count of this binding's emitted name in the resulting code.
   *
   * **Currently for forward-compat — not exercised by any v0 fixture or
   * algorithm path.** When cost-weighted cross-scope resolution lands
   * (future work), this becomes the weight: `cost = usageCount × tierGap`.
   *
   * Strategy computes from IR walk before resolution (count of bare-name
   * references in JSX, handler bodies, deps lists, member-access chains).
   *
   * Default treatment: 1 (equal weight). Provided values are ignored by the
   * v0 simple-greedy algorithm but accepted for schema stability.
   */
  readonly usageCount?: number;
}

/**
 * How a facet's access expression is constructed.
 *
 * - **binding**: path through one of THIS shape's own bindings. The resolver
 *   substitutes the binding's resolved name; expression = `${name}${access}`.
 * - **external**: path through an in-scope name (reservation or claim from
 *   this scope or any ancestor). Expression = `${viaName}${access}`.
 * - **literal**: a constant expression with no scope dependency.
 */
export type FacetExpr<E> =
  | { readonly kind: "binding"; readonly ref: E; readonly access: string }
  | { readonly kind: "external"; readonly viaName: string; readonly access: string }
  | { readonly kind: "literal"; readonly value: string };

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
   * Convenience: entity → its primary name/expression.
   *
   * - Simple entities: the binding's resolved name.
   * - Rich entities with one facet: that facet's expression.
   * - Rich entities with multiple facets: ABSENT (use `resolutions`).
   *
   * Multi-facet entities don't have a single name — consumers MUST use
   * `resolutions` to access per-facet expressions.
   */
  assignments: ReadonlyMap<E, string>;

  /**
   * Full per-entity resolution: which shape was selected, the resolved name
   * for each binding the shape claimed, the resolved expression for each
   * facet. Always present for every entity in the input.
   */
  resolutions: ReadonlyMap<E, EntityResolution<E>>;

  /**
   * Per-scope view of names claimed at that scope. Keyed by `ScopeSpec.id`;
   * scopes without an id are absent.
   */
  claimsByScope: ReadonlyMap<string, ReadonlySet<string>>;

  /**
   * Per-scope view of names burned by tie-breaking at that scope (only
   * populated when `onTie === "burn"`). Keyed by `ScopeSpec.id`.
   */
  burnedByScope: ReadonlyMap<string, ReadonlySet<string>>;
}

export interface EntityResolution<E> {
  /**
   * Priority of the shape that was selected. For simple entities, always
   * the implicit single-shape priority (100 by convention).
   */
  readonly selectedShapePriority: number;

  /**
   * Names allocated for the selected shape's bindings. Map<subKey, name>.
   * For simple entities: one entry, keyed by the entity's own key.
   * For rich entities: one entry per binding in the selected shape.
   */
  readonly bindingNames: ReadonlyMap<E, string>;

  /**
   * Resolved access expression per facet. For simple entities: one entry
   * keyed `"default"` whose value is the binding's name. For rich entities:
   * one entry per facet declared in the selected shape.
   */
  readonly facetExpressions: ReadonlyMap<string, string>;
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
