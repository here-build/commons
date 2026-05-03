/**
 * Contract tests for `resolveLexicalNames`. Each block articulates one
 * invariant of the lexical-scope resolver. All tests fail with
 * "not yet implemented" until the resolver is built — that's intentional;
 * these tests are the spec the implementation must satisfy.
 */

import { describe, expect, it } from "vitest";

import { resolveLexicalNames, type ResolveOptions, type ScopeSpec } from "../index.js";

// ── Test helpers ─────────────────────────────────────────────────────

const stringPostfix: ResolveOptions<string>["postfixFor"] = (k) => k;

function resolveStrings(
  root: ScopeSpec<string>,
  options?: Partial<ResolveOptions<string>>,
): ReadonlyMap<string, string> {
  return resolveLexicalNames(root, { postfixFor: stringPostfix, ...options }).assignments;
}

// ── Single scope — no nesting ────────────────────────────────────────

describe("single scope: trivial assignment", () => {
  it("each entity gets its top-priority candidate when uncontested", () => {
    const r = resolveStrings({
      entities: [
        { key: "a", candidates: [{ name: "alpha", importance: 100 }] },
        { key: "b", candidates: [{ name: "beta", importance: 100 }] },
      ],
    });
    expect(r.get("a")).toBe("alpha");
    expect(r.get("b")).toBe("beta");
  });

  it("assignment count equals entity count", () => {
    const r = resolveStrings({
      entities: [
        { key: "a", candidates: [{ name: "alpha", importance: 100 }] },
        { key: "b", candidates: [{ name: "beta", importance: 100 }] },
        { key: "c", candidates: [{ name: "gamma", importance: 100 }] },
      ],
    });
    expect(r.size).toBe(3);
  });
});

// ── Single scope — reservations block claims ─────────────────────────

describe("single scope: reservations", () => {
  it("entity falls to next candidate when top is reserved", () => {
    const r = resolveStrings({
      reservations: ["alpha"],
      entities: [
        {
          key: "a",
          candidates: [
            { name: "alpha", importance: 100 },
            { name: "alphaPrime", importance: 80 },
          ],
        },
      ],
    });
    expect(r.get("a")).toBe("alphaPrime");
  });

  it("entity falls past multiple reserved candidates", () => {
    const r = resolveStrings({
      reservations: ["alpha", "alphaPrime"],
      entities: [
        {
          key: "a",
          candidates: [
            { name: "alpha", importance: 100 },
            { name: "alphaPrime", importance: 80 },
            { name: "alphaUltimate", importance: 60 },
          ],
        },
      ],
    });
    expect(r.get("a")).toBe("alphaUltimate");
  });
});

// ── Single scope — symmetric tie resolution ──────────────────────────

describe("single scope: ties", () => {
  it("tie at top tier: both entities fall to next tier (free)", () => {
    const r = resolveStrings(
      {
        entities: [
          {
            key: "a",
            candidates: [
              { name: "shared", importance: 100 },
              { name: "alpha", importance: 80 },
            ],
          },
          {
            key: "b",
            candidates: [
              { name: "shared", importance: 100 },
              { name: "beta", importance: 80 },
            ],
          },
        ],
      },
      { onTie: "free" },
    );
    expect(r.get("a")).toBe("alpha");
    expect(r.get("b")).toBe("beta");
  });

  it("tie at top tier with no next tier: both get postfixed", () => {
    const r = resolveStrings({
      entities: [
        { key: "a", candidates: [{ name: "shared", importance: 100 }] },
        { key: "b", candidates: [{ name: "shared", importance: 100 }] },
      ],
    });
    // Default resolveTie: ${name}-${postfix} (postfix = key in our helper)
    expect(r.get("a")).toBe("shared-a");
    expect(r.get("b")).toBe("shared-b");
  });

  it("burn: lower-importance can NOT take a name burned by tie", () => {
    const r = resolveStrings(
      {
        entities: [
          {
            key: "highA",
            candidates: [
              { name: "x", importance: 100 },
              { name: "alpha", importance: 50 },
            ],
          },
          {
            key: "highB",
            candidates: [
              { name: "x", importance: 100 },
              { name: "beta", importance: 50 },
            ],
          },
          {
            key: "low",
            candidates: [
              { name: "x", importance: 80 }, // would take 'x' if not burned
              { name: "gamma", importance: 50 },
            ],
          },
        ],
      },
      { onTie: "burn" },
    );
    // highA + highB tied → both fall to 50, x is burned
    expect(r.get("highA")).toBe("alpha");
    expect(r.get("highB")).toBe("beta");
    // low cannot take x (burned), falls to gamma
    expect(r.get("low")).toBe("gamma");
  });

  it("free: lower-importance CAN take a name freed after tie", () => {
    const r = resolveStrings(
      {
        entities: [
          {
            key: "highA",
            candidates: [
              { name: "x", importance: 100 },
              { name: "alpha", importance: 50 },
            ],
          },
          {
            key: "highB",
            candidates: [
              { name: "x", importance: 100 },
              { name: "beta", importance: 50 },
            ],
          },
          {
            key: "low",
            candidates: [
              { name: "x", importance: 80 },
              { name: "gamma", importance: 50 },
            ],
          },
        ],
      },
      { onTie: "free" },
    );
    expect(r.get("highA")).toBe("alpha");
    expect(r.get("highB")).toBe("beta");
    expect(r.get("low")).toBe("x");
  });
});

// ── Single scope — ladder fallback (V's `large → typeLarge` example) ─

describe("single scope: ladder fallback", () => {
  it("variant prefixed when bare contested by user-named element", () => {
    // User prop named "large" wins at importance 100
    // Variant "large" in group "type" — would prefer bare, falls to prefixed
    const r = resolveStrings({
      entities: [
        { key: "prop:large", candidates: [{ name: "large", importance: 100 }] },
        {
          key: "variant:large",
          candidates: [
            { name: "large", importance: 95 },
            { name: "typeLarge", importance: 80 },
          ],
        },
      ],
    });
    expect(r.get("prop:large")).toBe("large");
    expect(r.get("variant:large")).toBe("typeLarge");
  });

  it("ladder drift cascades through multiple tiers", () => {
    // All upper tiers blocked; expect to land on the deepest unblocked tier
    const r = resolveStrings({
      reservations: ["a", "ab", "abc"],
      entities: [
        {
          key: "x",
          candidates: [
            { name: "a", importance: 100 },
            { name: "ab", importance: 80 },
            { name: "abc", importance: 60 },
            { name: "abcd", importance: 40 },
          ],
        },
      ],
    });
    expect(r.get("x")).toBe("abcd");
  });
});

// ── Single scope — exhaustion fallback ───────────────────────────────

describe("single scope: exhaustion", () => {
  it("single entity exhausted: numeric suffix on last candidate", () => {
    const r = resolveStrings({
      reservations: ["a", "b"],
      entities: [
        {
          key: "x",
          candidates: [
            { name: "a", importance: 100 },
            { name: "b", importance: 60 },
          ],
        },
      ],
    });
    expect(r.get("x")).toBe("b2");
  });

  it("multiple entities sharing exhausted last-candidate: postfix tie-break", () => {
    const r = resolveStrings({
      reservations: ["alpha", "beta"],
      entities: [
        {
          key: "a",
          candidates: [
            { name: "alpha", importance: 100 },
            { name: "shared", importance: 60 },
          ],
        },
        {
          key: "b",
          candidates: [
            { name: "beta", importance: 100 },
            { name: "shared", importance: 60 },
          ],
        },
      ],
    });
    expect(r.get("a")).toBe("shared-a");
    expect(r.get("b")).toBe("shared-b");
  });
});

// ── Tree: parent-chain reservation propagation ───────────────────────

describe("scope tree: parent reservations propagate to descendants", () => {
  it("child cannot claim a name reserved by ancestor", () => {
    const r = resolveStrings({
      reservations: ["window"],
      children: [
        {
          id: "child",
          entities: [
            {
              key: "x",
              candidates: [
                { name: "window", importance: 100 },
                { name: "win", importance: 80 },
              ],
            },
          ],
        },
      ],
    });
    expect(r.get("x")).toBe("win");
  });

  it("grandchild inherits from full ancestor chain", () => {
    const r = resolveStrings({
      reservations: ["a"],
      children: [
        {
          id: "child",
          reservations: ["b"],
          children: [
            {
              id: "grandchild",
              entities: [
                {
                  key: "x",
                  candidates: [
                    { name: "a", importance: 100 },
                    { name: "b", importance: 90 },
                    { name: "c", importance: 80 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(r.get("x")).toBe("c");
  });

  it("child cannot claim a name claimed by ancestor", () => {
    const r = resolveStrings({
      entities: [{ key: "p", candidates: [{ name: "shared", importance: 100 }] }],
      children: [
        {
          id: "c",
          entities: [
            {
              key: "c1",
              candidates: [
                { name: "shared", importance: 100 },
                { name: "alt", importance: 80 },
              ],
            },
          ],
        },
      ],
    });
    expect(r.get("p")).toBe("shared");
    expect(r.get("c1")).toBe("alt");
  });
});

// ── Tree: sibling independence ───────────────────────────────────────

describe("scope tree: siblings are independent", () => {
  it("two siblings can claim the same name independently", () => {
    const r = resolveStrings({
      children: [
        {
          id: "left",
          entities: [{ key: "l", candidates: [{ name: "currentElement", importance: 100 }] }],
        },
        {
          id: "right",
          entities: [{ key: "r", candidates: [{ name: "currentElement", importance: 100 }] }],
        },
      ],
    });
    expect(r.get("l")).toBe("currentElement");
    expect(r.get("r")).toBe("currentElement");
  });

  it("three siblings reusing the same name", () => {
    const r = resolveStrings({
      children: [
        { id: "s1", entities: [{ key: "a", candidates: [{ name: "x", importance: 100 }] }] },
        { id: "s2", entities: [{ key: "b", candidates: [{ name: "x", importance: 100 }] }] },
        { id: "s3", entities: [{ key: "c", candidates: [{ name: "x", importance: 100 }] }] },
      ],
    });
    expect(r.get("a")).toBe("x");
    expect(r.get("b")).toBe("x");
    expect(r.get("c")).toBe("x");
  });

  it("sibling's burn does not propagate to other sibling", () => {
    // Sibling A burns "x"; sibling B (with no relation to A) can still claim "x".
    const r = resolveStrings(
      {
        children: [
          {
            id: "A",
            entities: [
              { key: "a1", candidates: [{ name: "x", importance: 100 }] },
              { key: "a2", candidates: [{ name: "x", importance: 100 }] },
            ],
          },
          {
            id: "B",
            entities: [{ key: "b1", candidates: [{ name: "x", importance: 100 }] }],
          },
        ],
      },
      { onTie: "burn" },
    );
    // A's tie burns "x" within A → both get postfixed
    expect(r.get("a1")).toBe("x-a1");
    expect(r.get("a2")).toBe("x-a2");
    // B is independent — claims x freely
    expect(r.get("b1")).toBe("x");
  });
});

// ── Tree: per-scope result lookups ───────────────────────────────────

describe("scope tree: claimsByScope and burnedByScope", () => {
  it("claimsByScope maps scope.id → names claimed at that scope", () => {
    const result = resolveLexicalNames(
      {
        id: "root",
        entities: [{ key: "p", candidates: [{ name: "outer", importance: 100 }] }],
        children: [
          {
            id: "child",
            entities: [{ key: "c", candidates: [{ name: "inner", importance: 100 }] }],
          },
        ],
      },
      { postfixFor: stringPostfix },
    );
    expect(result.claimsByScope.get("root")).toEqual(new Set(["outer"]));
    expect(result.claimsByScope.get("child")).toEqual(new Set(["inner"]));
  });

  it("scopes without id are absent from claimsByScope", () => {
    const result = resolveLexicalNames(
      {
        // no id at root
        entities: [{ key: "p", candidates: [{ name: "x", importance: 100 }] }],
        children: [
          {
            id: "child",
            entities: [{ key: "c", candidates: [{ name: "y", importance: 100 }] }],
          },
        ],
      },
      { postfixFor: stringPostfix },
    );
    expect(result.claimsByScope.has("root")).toBe(false);
    expect(result.claimsByScope.get("child")).toEqual(new Set(["y"]));
  });

  it("burnedByScope captures only burns from this scope (not parent's burns)", () => {
    const result = resolveLexicalNames(
      {
        id: "root",
        entities: [
          { key: "a", candidates: [{ name: "x", importance: 100 }] },
          { key: "b", candidates: [{ name: "x", importance: 100 }] },
        ],
        children: [
          {
            id: "child",
            entities: [{ key: "c", candidates: [{ name: "y", importance: 100 }] }],
          },
        ],
      },
      { postfixFor: stringPostfix, onTie: "burn" },
    );
    expect(result.burnedByScope.get("root")).toEqual(new Set(["x"]));
    expect(result.burnedByScope.get("child") ?? new Set()).toEqual(new Set());
  });
});

// ── Determinism ──────────────────────────────────────────────────────

describe("determinism: same input → same output", () => {
  function makeInput(): ScopeSpec<string> {
    return {
      reservations: ["foo"],
      entities: [
        {
          key: "a",
          candidates: [
            { name: "foo", importance: 100 },
            { name: "alpha", importance: 80 },
          ],
        },
        { key: "b", candidates: [{ name: "beta", importance: 100 }] },
      ],
      children: [
        {
          id: "c",
          entities: [
            { key: "c1", candidates: [{ name: "alpha", importance: 100 }] },
            { key: "c2", candidates: [{ name: "alpha", importance: 100 }] },
          ],
        },
      ],
    };
  }

  it("identical inputs produce identical outputs", () => {
    const a = resolveStrings(makeInput());
    const b = resolveStrings(makeInput());
    expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
  });

  it("entity insertion order does not affect output", () => {
    const forward = resolveStrings({
      entities: [
        { key: "a", candidates: [{ name: "x", importance: 100 }] },
        { key: "b", candidates: [{ name: "x", importance: 100 }] },
      ],
    });
    const reversed = resolveStrings({
      entities: [
        { key: "b", candidates: [{ name: "x", importance: 100 }] },
        { key: "a", candidates: [{ name: "x", importance: 100 }] },
      ],
    });
    expect(forward.get("a")).toBe(reversed.get("a"));
    expect(forward.get("b")).toBe(reversed.get("b"));
  });

  it("sibling order does not affect per-sibling assignments", () => {
    const lr = resolveStrings({
      children: [
        { id: "L", entities: [{ key: "l", candidates: [{ name: "x", importance: 100 }] }] },
        { id: "R", entities: [{ key: "r", candidates: [{ name: "x", importance: 100 }] }] },
      ],
    });
    const rl = resolveStrings({
      children: [
        { id: "R", entities: [{ key: "r", candidates: [{ name: "x", importance: 100 }] }] },
        { id: "L", entities: [{ key: "l", candidates: [{ name: "x", importance: 100 }] }] },
      ],
    });
    expect(lr.get("l")).toBe(rl.get("l"));
    expect(lr.get("r")).toBe(rl.get("r"));
  });
});

// ── Custom resolveTie / fallbackSuffix ───────────────────────────────

describe("custom tie + fallback formatting", () => {
  it("JS-style tie: underscore separator instead of hyphen", () => {
    const r = resolveStrings(
      {
        entities: [
          { key: "a", candidates: [{ name: "value", importance: 100 }] },
          { key: "b", candidates: [{ name: "value", importance: 100 }] },
        ],
      },
      { resolveTie: (name, postfix) => `${name}_${postfix}` },
    );
    expect(r.get("a")).toBe("value_a");
    expect(r.get("b")).toBe("value_b");
  });

  it("custom fallbackSuffix shape", () => {
    const r = resolveStrings(
      {
        reservations: ["x"],
        entities: [{ key: "a", candidates: [{ name: "x", importance: 100 }] }],
      },
      { fallbackSuffix: (name, n) => `${name}_v${n}` },
    );
    expect(r.get("a")).toBe("x_v2");
  });
});

// ── Error contracts ──────────────────────────────────────────────────

describe("error cases", () => {
  it("throws when an entity yields no candidates", () => {
    expect(() =>
      resolveStrings({
        entities: [{ key: "a", candidates: [] }],
      }),
    ).toThrow();
  });

  it("throws when postfixFor is non-injective on tied entities", () => {
    expect(() =>
      resolveStrings(
        {
          entities: [
            { key: "a", candidates: [{ name: "x", importance: 100 }] },
            { key: "b", candidates: [{ name: "x", importance: 100 }] },
          ],
        },
        { postfixFor: () => "same" },
      ),
    ).toThrow();
  });
});

// ── Real-world shape: JS naming inside a component scope ─────────────

describe("realistic shape: component scope with handler sub-scope", () => {
  it("handler sub-scope respects component-scope claims; sibling handlers reuse names", () => {
    // Component scope: state "open" claims "open"; setter claims "setOpen".
    // Handler scope A: user code references `window` (free var) and declares
    //   `currentElement` (.map callback).
    // Handler scope B: independent; also uses `currentElement`.
    const r = resolveStrings({
      id: "module",
      reservations: ["React", "useState", "useCallback"],
      entities: [],
      children: [
        {
          id: "component",
          entities: [
            { key: "state:open", candidates: [{ name: "open", importance: 100 }] },
            { key: "setter:open", candidates: [{ name: "setOpen", importance: 100 }] },
            { key: "handler:click", candidates: [{ name: "handleClick", importance: 100 }] },
            { key: "handler:hover", candidates: [{ name: "handleHover", importance: 100 }] },
          ],
          children: [
            {
              id: "handler:click:body",
              reservations: ["window"],
              entities: [
                { key: "param:click", candidates: [{ name: "currentElement", importance: 100 }] },
              ],
            },
            {
              id: "handler:hover:body",
              entities: [
                { key: "param:hover", candidates: [{ name: "currentElement", importance: 100 }] },
              ],
            },
          ],
        },
      ],
    });
    expect(r.get("state:open")).toBe("open");
    expect(r.get("setter:open")).toBe("setOpen");
    expect(r.get("handler:click")).toBe("handleClick");
    expect(r.get("handler:hover")).toBe("handleHover");
    // Both handler params claim "currentElement" — sibling-independent.
    expect(r.get("param:click")).toBe("currentElement");
    expect(r.get("param:hover")).toBe("currentElement");
  });

  it("user free var (window) at handler scope blocks handler from naming a local 'window'", () => {
    const r = resolveStrings({
      id: "module",
      children: [
        {
          id: "component",
          children: [
            {
              id: "handler",
              reservations: ["window"], // scanned out of user code as free reference
              entities: [
                {
                  key: "local:state",
                  candidates: [
                    { name: "window", importance: 100 },
                    { name: "windowState", importance: 80 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(r.get("local:state")).toBe("windowState");
  });
});
