/**
 * Unit tests for the `ordinal` protocol - process-local, pointer-identity
 * object handles (`ordinal.id`) plus the canonical total order (`ordinal.sort`)
 *
 * Tests:
 * - id: stability (same object, same id), distinctness, first-sight
 *   monotonicity, acceptance of any object shape
 * - sort: objects before primitives, primitives type-then-value, objects by
 *   ordinal order, and total-order laws (reflexive, antisymmetric, deterministic)
 */

import { describe, expect, it } from "vitest";

import { ordinal } from "../index.js";

// Module-scoped no-op used only for its identity in the "any object shape" test below.
function noop() {}

describe("ordinal", () => {
  describe("id", () => {
    it("should return the same id for the same object on repeated calls", () => {
      const obj = {};

      const first = ordinal.id(obj);
      const second = ordinal.id(obj);
      const third = ordinal.id(obj);

      expect([first, second, third]).to.have.ordered.members([first, first, first]);
    });

    it("should return different ids for different objects", () => {
      const a = {};
      const b = {};

      expect(ordinal.id(a)).to.not.equal(ordinal.id(b));
    });

    it("should assign ids in first-sight order, not object-creation order", () => {
      // Created in order a, b, c — but seen (via ordinal.id) in order b, a, c.
      const a = {};
      const b = {};
      const c = {};

      const bId = ordinal.id(b);
      const aId = ordinal.id(a);
      const cId = ordinal.id(c);

      expect([bId < aId, aId < cId]).to.have.ordered.members([true, true]);
    });

    it("should hand out a strictly greater id to every newly-seen object", () => {
      const before = ordinal.id({});
      const after = ordinal.id({});

      expect(after).to.be.greaterThan(before);
    });

    it("should accept any object shape, including arrays and functions", () => {
      const arr: unknown[] = [];

      const arrFirst = ordinal.id(arr);
      const fnId = ordinal.id(noop);
      const arrSecond = ordinal.id(arr);

      expect([arrFirst, fnId, arrSecond]).to.have.ordered.members([arrFirst, fnId, arrFirst]);
    });
  });

  describe("sort", () => {
    it("should sort objects before primitives", () => {
      const obj = {};

      expect([
        ordinal.sort(obj, "a") < 0,
        ordinal.sort("a", obj) > 0,
        ordinal.sort(obj, 1) < 0,
        ordinal.sort(obj, null) < 0,
      ]).to.have.ordered.members([true, true, true, true]);
    });

    it("should sort primitives by type first, then by value", () => {
      // Type names order lexicographically: bigint < boolean < null < number < string.
      expect([
        ordinal.sort(1n, true) < 0,
        ordinal.sort(true, null) < 0,
        ordinal.sort(null, 1) < 0,
        ordinal.sort(1, "a") < 0,
      ]).to.have.ordered.members([true, true, true, true]);

      // Same type: by value.
      expect([
        ordinal.sort("a", "b") < 0,
        ordinal.sort(1, 2) < 0,
        ordinal.sort(false, true) < 0,
      ]).to.have.ordered.members([true, true, true]);
    });

    it("should sort objects by their ordinal (first-sight) order", () => {
      const a = {};
      const b = {};
      ordinal.id(a); // seen first → lower ordinal
      ordinal.id(b);

      expect([ordinal.sort(a, b) < 0, ordinal.sort(b, a) > 0]).to.have.ordered.members([true, true]);
    });

    it("should be a total order: reflexive, antisymmetric, deterministic", () => {
      const obj = {};
      const elements = [obj, "a", "b", 1, 2, true, null, 3n] as const;

      for (const x of elements) {
        // Reflexive: an element ties with itself.
        expect(ordinal.sort(x, x)).to.equal(0);
        for (const y of elements) {
          // Antisymmetric: swapping arguments flips the sign.
          expect(Math.sign(ordinal.sort(x, y))).to.equal(-Math.sign(ordinal.sort(y, x)));
          // Deterministic: same inputs, same verdict — no flapping.
          expect(ordinal.sort(x, y)).to.equal(ordinal.sort(x, y));
        }
      }
    });
  });
});
