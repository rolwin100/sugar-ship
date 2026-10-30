import { describe, expect, it } from "vitest";
import type {
  CartTotals,
  ConditionOperator,
  EngineCondition,
  EngineRule,
  RuleMatch,
} from "../types";
import { checkConditions, matchesConditions } from "./conditions";

const totals: CartTotals = { subtotal: 100000, weight: 2000, quantity: 3 };

let nextId = 0;
const condition = (
  field: string,
  operator: ConditionOperator,
  value: unknown,
  overrides: Partial<EngineCondition> = {},
): EngineCondition => ({
  id: `c${nextId++}`,
  subject: "CART",
  field,
  operator,
  value,
  ...overrides,
});

const rule = (
  conditions: EngineCondition[],
  match: RuleMatch = "ALL",
): EngineRule => ({
  id: "r1",
  name: "Rule",
  status: "ACTIVE",
  priority: 0,
  match,
  exclusive: false,
  conditions,
  rates: [],
});

const matched = (r: EngineRule) => checkConditions(r, totals).matched;

describe("checkConditions", () => {
  it("always matches a rule with no conditions", () => {
    expect(checkConditions(rule([]), totals)).toEqual({ matched: true });
    expect(matched(rule([], "NONE"))).toBe(true);
  });

  it("ALL needs every condition, and says which one failed", () => {
    // Between ₹500 and ₹1,000: ≥ 50000 and < 100000 — the cart is exactly ₹1,000.
    const between = rule([
      condition("subtotal", "GREATER_OR_EQUAL", 50000),
      condition("subtotal", "LESS_THAN", 100000),
    ]);
    expect(checkConditions(between, totals)).toEqual({
      matched: false,
      reason: "needs all conditions; subtotal 100000 < 100000 is false",
    });
  });

  it("ANY needs at least one condition", () => {
    const conditions = [
      condition("quantity", "GREATER_OR_EQUAL", 10),
      condition("weight", "GREATER_THAN", 1500),
    ];
    expect(matched(rule(conditions, "ANY"))).toBe(true);
    expect(
      checkConditions(rule([conditions[0]], "ANY"), totals).reason,
    ).toContain("none is true");
  });

  it("NONE needs every condition to be false", () => {
    expect(
      matched(rule([condition("quantity", "GREATER_THAN", 5)], "NONE")),
    ).toBe(true);
    expect(
      matched(rule([condition("quantity", "GREATER_THAN", 1)], "NONE")),
    ).toBe(false);
  });

  it("treats conditions it can't check as not matching", () => {
    const product = condition("tag", "CONTAINS", "fragile", {
      subject: "PRODUCT",
    });
    const badField = condition("colour", "EQUALS", 1);
    for (const c of [product, badField]) {
      const result = checkConditions(rule([c]), totals);
      expect(result.matched).toBe(false);
      expect(result.reason).toMatch(/^unsupported condition/);
    }
    // Even under NONE, which would otherwise pass when nothing is true.
    expect(matched(rule([product], "NONE"))).toBe(false);
  });
});

describe("matchesConditions", () => {
  it("adds up the cart and checks it", () => {
    const r = rule([condition("subtotal", "GREATER_OR_EQUAL", 100000)]);
    const cart = (price: number) => ({
      items: [{ quantity: 2, grams: 500, price }],
      currency: "INR",
      destination: { country: "IN" },
    });
    expect(matchesConditions(r, cart(60000))).toBe(true); // ₹1,200
    expect(matchesConditions(r, cart(40000))).toBe(false); // ₹800
  });
});
