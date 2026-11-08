import { describe, expect, it } from "vitest";
import type { StoredCondition } from "../types";
import { toRuleCondition } from "./stored-condition";

const row = (overrides: Partial<StoredCondition> = {}): StoredCondition => ({
  subject: "CART",
  field: "subtotal",
  operator: "GREATER_OR_EQUAL",
  value: 100000,
  quantifier: null,
  ...overrides,
});

describe("toRuleCondition", () => {
  it("reads a cart condition", () => {
    expect(toRuleCondition(row())).toEqual({
      subject: "CART",
      field: "subtotal",
      operator: "GREATER_OR_EQUAL",
      value: 100000,
    });
  });

  it("skips rows that aren't valid cart conditions", () => {
    expect(toRuleCondition(row({ subject: "ADDRESS" }))).toBeNull();
    expect(toRuleCondition(row({ field: "colour" }))).toBeNull();
    expect(toRuleCondition(row({ operator: "CONTAINS" }))).toBeNull();
    expect(toRuleCondition(row({ value: "100000" }))).toBeNull();
    expect(toRuleCondition(row({ value: null }))).toBeNull();
    expect(toRuleCondition(row({ value: -1 }))).toBeNull();
    expect(toRuleCondition(row({ value: 1.5 }))).toBeNull();
  });

  const product = (overrides: Partial<StoredCondition> = {}) =>
    row({
      subject: "PRODUCT",
      field: "tag",
      operator: "EQUALS",
      value: "fragile",
      quantifier: "ANY",
      ...overrides,
    });

  it("reads product conditions", () => {
    expect(toRuleCondition(product())).toEqual({
      subject: "PRODUCT",
      field: "tag",
      operator: "EQUALS",
      quantifier: "ANY",
      value: "fragile",
    });
    expect(
      toRuleCondition(product({ operator: "IN", value: ["a", "b"] })),
    ).toMatchObject({ value: ["a", "b"] });
    expect(
      toRuleCondition(
        product({ field: "collection", operator: "IN", value: [7] }),
      ),
    ).toMatchObject({ value: [7] });
  });

  it("skips product rows with a bad quantifier, operator or value", () => {
    expect(toRuleCondition(product({ quantifier: null }))).toBeNull();
    expect(toRuleCondition(product({ operator: "GREATER_THAN" }))).toBeNull();
    expect(toRuleCondition(product({ value: "" }))).toBeNull();
    expect(toRuleCondition(product({ value: ["a"] }))).toBeNull(); // list for "is"
    expect(toRuleCondition(product({ operator: "IN", value: [] }))).toBeNull();
    expect(
      toRuleCondition(product({ field: "collection", value: 7 })),
    ).toBeNull(); // collections use is in any of / none of
    expect(
      toRuleCondition(
        product({ field: "collection", operator: "IN", value: ["7"] }),
      ),
    ).toBeNull();
  });
});
