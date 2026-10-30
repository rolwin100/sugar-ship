import { describe, expect, it } from "vitest";
import { quote } from "./quote";
import type {
  EngineCart,
  EngineRate,
  EngineRule,
  EngineSettings,
  EngineZone,
} from "../types";

const cart: EngineCart = {
  items: [{ quantity: 1, grams: 500, price: 50000 }],
  currency: "INR",
  destination: { country: "IN", province: "KA", postcode: "560078" },
};

const settings: EngineSettings = { combineStrategy: "SUM" };
const zones: EngineZone[] = [
  {
    id: "zone-in",
    name: "Domestic",
    restOfWorld: false,
    regions: [{ country: "IN", provinces: null }],
  },
];
const NOW = new Date("2026-10-27T12:00:00Z");

function flatRate(id: string, price: number): EngineRate {
  return {
    id,
    zoneId: "zone-in",
    preset: "standard",
    mode: "FLAT",
    price,
    bands: [],
    adjustments: [],
  };
}

function rule(overrides: Partial<EngineRule> & { id: string }): EngineRule {
  return {
    name: overrides.id,
    status: "ACTIVE",
    priority: 0,
    match: "ALL",
    exclusive: false,
    conditions: [],
    rates: [flatRate(`${overrides.id}-rate`, 5000)],
    ...overrides,
  };
}

describe("quote", () => {
  it("returns a flat rate for a matching rule", () => {
    const result = quote(cart, [rule({ id: "r1" })], zones, settings, NOW);
    expect(result.rates).toHaveLength(1);
    expect(result.rates[0]).toMatchObject({
      ruleId: "r1",
      price: 5000,
      preset: "standard",
    });
    expect(result.trace).toEqual([
      { ruleId: "r1", ruleName: "r1", outcome: "matched" },
    ]);
  });

  it("runs rules in priority order, lowest first, keeping ties in order", () => {
    const rules = [
      rule({ id: "late", priority: 5 }),
      rule({ id: "early", priority: 1 }),
      rule({ id: "tie-a", priority: 3 }),
      rule({ id: "tie-b", priority: 3 }),
    ];
    const result = quote(cart, rules, zones, settings, NOW);
    expect(result.trace.map((t) => t.ruleId)).toEqual([
      "early",
      "tie-a",
      "tie-b",
      "late",
    ]);
  });

  it("skips inactive rules", () => {
    const result = quote(
      cart,
      [rule({ id: "off", status: "INACTIVE" })],
      zones,
      settings,
      NOW,
    );
    expect(result.rates).toHaveLength(0);
    expect(result.trace[0].outcome).toBe("skipped_inactive");
  });

  it("skips rules outside their schedule", () => {
    const rules = [
      rule({ id: "future", startsAt: new Date("2026-11-01T00:00:00Z") }),
      rule({ id: "ended", endsAt: new Date("2026-10-01T00:00:00Z") }),
      rule({
        id: "running",
        startsAt: new Date("2026-10-01T00:00:00Z"),
        endsAt: new Date("2026-11-01T00:00:00Z"),
      }),
    ];
    const result = quote(cart, rules, zones, settings, NOW);
    const outcomes = Object.fromEntries(
      result.trace.map((t) => [t.ruleId, t.outcome]),
    );
    expect(outcomes).toEqual({
      future: "skipped_schedule",
      ended: "skipped_schedule",
      running: "matched",
    });
    expect(result.rates.map((r) => r.ruleId)).toEqual(["running"]);
  });

  it("stops after a matching exclusive rule", () => {
    const rules = [
      rule({ id: "vip", priority: 1, exclusive: true }),
      rule({ id: "standard", priority: 2 }),
    ];
    const result = quote(cart, rules, zones, settings, NOW);
    expect(result.rates.map((r) => r.ruleId)).toEqual(["vip"]);
    expect(result.trace[1]).toMatchObject({
      ruleId: "standard",
      outcome: "skipped_after_exclusive",
    });
  });

  it("does not let an inactive exclusive rule stop later rules", () => {
    const rules = [
      rule({ id: "vip", priority: 1, exclusive: true, status: "INACTIVE" }),
      rule({ id: "standard", priority: 2 }),
    ];
    const result = quote(cart, rules, zones, settings, NOW);
    expect(result.rates.map((r) => r.ruleId)).toEqual(["standard"]);
  });

  it("notes rates whose pricing mode is not supported yet", () => {
    const bands: EngineRate = {
      ...flatRate("bands", 0),
      mode: "BANDS",
      basis: "WEIGHT",
      price: null,
    };
    const result = quote(
      cart,
      [rule({ id: "r1", rates: [bands] })],
      zones,
      settings,
      NOW,
    );
    expect(result.rates).toHaveLength(0);
    expect(result.trace[0]).toMatchObject({ outcome: "matched" });
    expect(result.trace[0].detail).toContain("BANDS pricing not supported yet");
  });

  it("only returns rates for the address's zone", () => {
    const multiZone = [
      ...zones,
      {
        id: "zone-eu",
        name: "Europe",
        restOfWorld: false,
        regions: [{ country: "FR", provinces: null }],
      },
    ];
    const rates = [
      flatRate("in-rate", 5000),
      { ...flatRate("eu-rate", 900), zoneId: "zone-eu" },
    ];
    const result = quote(
      cart,
      [rule({ id: "r1", rates })],
      multiZone,
      settings,
      NOW,
    );
    expect(result.rates.map((r) => r.rateId)).toEqual(["in-rate"]);
    expect(result.trace[0].detail).toContain(
      'for another zone (address is in "Domestic")',
    );
  });

  it("returns no rates when the address is in no zone", () => {
    const usCart = { ...cart, destination: { country: "US", province: "CA" } };
    const result = quote(usCart, [rule({ id: "r1" })], zones, settings, NOW);
    expect(result.rates).toHaveLength(0);
    expect(result.trace[0].detail).toContain("address is not in any zone");
  });

  it("applies cart conditions and explains rules that don't match", () => {
    const freeOver1000 = rule({
      id: "free",
      conditions: [
        {
          id: "c1",
          subject: "CART",
          field: "subtotal",
          operator: "GREATER_OR_EQUAL",
          value: 100000,
        },
      ],
      rates: [flatRate("free-rate", 0)],
    });
    const cartOf = (price: number): EngineCart => ({
      ...cart,
      items: [{ quantity: 1, grams: 500, price }],
    });

    const big = quote(cartOf(120000), [freeOver1000], zones, settings, NOW);
    expect(big.rates.map((r) => r.rateId)).toEqual(["free-rate"]);

    const small = quote(cartOf(80000), [freeOver1000], zones, settings, NOW);
    expect(small.rates).toEqual([]);
    expect(small.trace).toEqual([
      {
        ruleId: "free",
        ruleName: "free",
        outcome: "not_matched",
        detail: "needs all conditions; subtotal 80000 ≥ 100000 is false",
      },
    ]);
  });
});
