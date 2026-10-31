import { describe, expect, it } from "vitest";
import type { RuleInput } from "../types";
import { validateRule } from "./validate-rule";

const zones = new Set(["domestic", "intl"]);

const input = (overrides: Partial<RuleInput> = {}): RuleInput => ({
  name: "Standard shipping",
  status: "ACTIVE",
  preset: "standard",
  customName: "",
  minDeliveryDays: 3,
  maxDeliveryDays: 5,
  prices: [{ zoneId: "domestic", price: 8000 }],
  match: "ALL",
  conditions: [],
  ...overrides,
});

const keys = (result: ReturnType<typeof validateRule>) =>
  result.ok ? [] : result.errors.map((e) => e.key);

describe("validateRule", () => {
  it("accepts a valid rule and trims names", () => {
    const result = validateRule(input({ name: "  Standard  " }), zones);
    expect(result.ok && result.rule.name).toBe("Standard");
  });

  it("requires a name of a sensible length", () => {
    expect(keys(validateRule(input({ name: " " }), zones))).toEqual([
      "nameRequired",
    ]);
    expect(keys(validateRule(input({ name: "x".repeat(101) }), zones))).toEqual(
      ["nameTooLong"],
    );
  });

  it("requires a custom checkout name when no preset is chosen", () => {
    expect(
      keys(validateRule(input({ preset: null, customName: "" }), zones)),
    ).toEqual(["customNameRequired"]);
    expect(
      keys(
        validateRule(
          input({ preset: null, customName: "x".repeat(61) }),
          zones,
        ),
      ),
    ).toEqual(["customNameTooLong"]);
    const ok = validateRule(
      input({ preset: null, customName: " Courier " }),
      zones,
    );
    expect(ok.ok && ok.rule.customName).toBe("Courier");
  });

  it("clears the custom name when a preset is used", () => {
    const result = validateRule(input({ customName: "leftover" }), zones);
    expect(result.ok && result.rule.customName).toBe("");
  });

  it("checks delivery days", () => {
    expect(
      validateRule(
        input({ minDeliveryDays: null, maxDeliveryDays: null }),
        zones,
      ).ok,
    ).toBe(true);
    expect(
      keys(validateRule(input({ minDeliveryDays: Number.NaN }), zones)),
    ).toEqual(["daysInvalid"]);
    expect(keys(validateRule(input({ maxDeliveryDays: 400 }), zones))).toEqual([
      "daysInvalid",
    ]);
    expect(
      keys(
        validateRule(input({ minDeliveryDays: 6, maxDeliveryDays: 2 }), zones),
      ),
    ).toEqual(["daysOrder"]);
  });

  it("needs at least one priced zone", () => {
    expect(keys(validateRule(input({ prices: [] }), zones))).toEqual([
      "pricesRequired",
    ]);
  });

  it("allows free (0) and flags bad prices per zone", () => {
    expect(
      validateRule(input({ prices: [{ zoneId: "domestic", price: 0 }] }), zones)
        .ok,
    ).toBe(true);
    const result = validateRule(
      input({
        prices: [
          { zoneId: "domestic", price: Number.NaN },
          { zoneId: "intl", price: -1 },
        ],
      }),
      zones,
    );
    expect(result.ok ? [] : result.errors).toEqual([
      { field: "prices", key: "priceInvalid", zoneId: "domestic" },
      { field: "prices", key: "priceInvalid", zoneId: "intl" },
    ]);
  });

  it("rejects unknown and repeated zones", () => {
    expect(
      keys(
        validateRule(
          input({ prices: [{ zoneId: "other-shop", price: 1 }] }),
          zones,
        ),
      ),
    ).toEqual(["zoneUnknown"]);
    expect(
      keys(
        validateRule(
          input({
            prices: [
              { zoneId: "domestic", price: 1 },
              { zoneId: "domestic", price: 2 },
            ],
          }),
          zones,
        ),
      ),
    ).toEqual(["zoneDuplicate"]);
  });
});
