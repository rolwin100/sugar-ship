import { describe, expect, it } from "vitest";
import type { RuleInput } from "../types";
import { validateRule } from "./validate-rule";

const zones = new Set(["domestic", "intl"]);

const input = (overrides: Partial<RuleInput> = {}): RuleInput => ({
  name: "Standard shipping",
  status: "ACTIVE",
  preset: "standard",
  customName: "",
  description: "",
  minDeliveryDays: 3,
  maxDeliveryDays: 5,
  prices: [{ zoneId: "domestic", mode: "FLAT", price: 8000 }],
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

  it("trims the description and limits its length", () => {
    const ok = validateRule(input({ description: "  Tracked  " }), zones);
    expect(ok.ok && ok.rule.description).toBe("Tracked");
    expect(
      validateRule(input({ description: "x".repeat(100) }), zones).ok,
    ).toBe(true);
    expect(
      keys(validateRule(input({ description: "x".repeat(101) }), zones)),
    ).toEqual(["descriptionTooLong"]);
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
      validateRule(
        input({ prices: [{ zoneId: "domestic", mode: "FLAT", price: 0 }] }),
        zones,
      ).ok,
    ).toBe(true);
    const result = validateRule(
      input({
        prices: [
          { zoneId: "domestic", mode: "FLAT", price: Number.NaN },
          { zoneId: "intl", mode: "FLAT", price: -1 },
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
          input({ prices: [{ zoneId: "other-shop", mode: "FLAT", price: 1 }] }),
          zones,
        ),
      ),
    ).toEqual(["zoneUnknown"]);
    expect(
      keys(
        validateRule(
          input({
            prices: [
              { zoneId: "domestic", mode: "FLAT", price: 1 },
              { zoneId: "domestic", mode: "FLAT", price: 2 },
            ],
          }),
          zones,
        ),
      ),
    ).toEqual(["zoneDuplicate"]);
  });

  it("accepts valid conditions", () => {
    const result = validateRule(
      input({
        match: "ANY",
        conditions: [
          {
            subject: "CART",
            field: "subtotal",
            operator: "GREATER_OR_EQUAL",
            value: 100000,
          },
          {
            subject: "CART",
            field: "weight",
            operator: "LESS_THAN",
            value: 1500,
          },
          { subject: "CART", field: "quantity", operator: "EQUALS", value: 0 },
        ],
      }),
      zones,
    );
    expect(result.ok).toBe(true);
  });

  it("flags condition values that aren't whole numbers from 0, by position", () => {
    const result = validateRule(
      input({
        conditions: [
          {
            subject: "CART",
            field: "subtotal",
            operator: "GREATER_THAN",
            value: 100,
          },
          {
            subject: "CART",
            field: "weight",
            operator: "LESS_THAN",
            value: Number.NaN,
          },
          { subject: "CART", field: "quantity", operator: "EQUALS", value: -1 },
          {
            subject: "CART",
            field: "quantity",
            operator: "EQUALS",
            value: 2.5,
          },
          {
            subject: "CART",
            field: "subtotal",
            operator: "EQUALS",
            value: 2_000_000_000,
          },
        ],
      }),
      zones,
    );
    expect(result.ok ? [] : result.errors).toEqual([
      {
        field: "conditions",
        key: "conditionValueInvalid",
        index: 1,
        conditionField: "weight",
      },
      {
        field: "conditions",
        key: "conditionValueInvalid",
        index: 2,
        conditionField: "quantity",
      },
      {
        field: "conditions",
        key: "conditionValueInvalid",
        index: 3,
        conditionField: "quantity",
      },
      {
        field: "conditions",
        key: "conditionValueInvalid",
        index: 4,
        conditionField: "subtotal",
      },
    ]);
  });

  it("rejects fields and operators the engine can't check", () => {
    const result = validateRule(
      input({
        conditions: [
          // Wrong shapes can only arrive from outside the form, hence the casts.
          {
            subject: "CART",
            field: "colour" as never,
            operator: "EQUALS",
            value: 1,
          },
          {
            subject: "CART",
            field: "subtotal",
            operator: "CONTAINS" as never,
            value: 1,
          },
        ],
      }),
      zones,
    );
    expect(result.ok ? [] : result.errors).toEqual([
      { field: "conditions", key: "conditionUnsupported", index: 0 },
      { field: "conditions", key: "conditionUnsupported", index: 1 },
    ]);
  });

  it("allows at most 10 conditions and a known match mode", () => {
    const condition = {
      subject: "CART",
      field: "quantity",
      operator: "GREATER_THAN",
      value: 1,
    } as const;
    expect(
      keys(
        validateRule(input({ conditions: Array(11).fill(condition) }), zones),
      ),
    ).toEqual(["tooManyConditions"]);
    expect(
      validateRule(input({ conditions: Array(10).fill(condition) }), zones).ok,
    ).toBe(true);
    expect(
      keys(validateRule(input({ match: "SOME" as never }), zones)),
    ).toEqual(["matchInvalid"]);
  });

  it("checks each zone's pricing in any mode", () => {
    const tableAndPercent = input({
      prices: [
        {
          zoneId: "domestic",
          mode: "BANDS",
          basis: "WEIGHT",
          bands: [{ from: 0, to: null, price: 8000 }],
        },
        { zoneId: "intl", mode: "PERCENT", percentBps: 500 },
      ],
    });
    expect(validateRule(tableAndPercent, zones).ok).toBe(true);

    const badStep = input({
      prices: [
        {
          zoneId: "domestic",
          mode: "INCREMENTAL",
          basis: "WEIGHT",
          basePrice: 5000,
          stepSize: 0,
          stepPrice: 2000,
        },
      ],
    });
    expect(keys(validateRule(badStep, zones))).toEqual(["stepSizeInvalid"]);
  });

  it("checks product conditions", () => {
    const tag = {
      subject: "PRODUCT" as const,
      field: "tag" as const,
      operator: "EQUALS" as const,
      quantifier: "ANY" as const,
      value: "fragile",
    };
    const errors = (condition: unknown) =>
      keys(
        validateRule(input({ conditions: [condition as typeof tag] }), zones),
      );

    expect(errors(tag)).toEqual([]);
    expect(errors({ ...tag, value: "" })).toEqual(["productValueRequired"]);
    expect(errors({ ...tag, operator: "IN", value: [] })).toEqual([
      "productValueRequired",
    ]);
    expect(
      errors({ ...tag, operator: "IN", value: Array(21).fill("x") }),
    ).toEqual(["tooManyProductValues"]);
    expect(errors({ ...tag, value: "x".repeat(256) })).toEqual([
      "productValueTooLong",
    ]);
    expect(errors({ ...tag, quantifier: "SOME" })).toEqual([
      "conditionUnsupported",
    ]);
    expect(
      errors({ ...tag, field: "collection", operator: "EQUALS", value: [7] }),
    ).toEqual(["conditionUnsupported"]);
    expect(
      errors({ ...tag, field: "collection", operator: "IN", value: [7, 12] }),
    ).toEqual([]);
  });
});
