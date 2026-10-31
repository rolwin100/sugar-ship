import { describe, expect, it } from "vitest";
import type { StoredCondition } from "../types";
import { toRuleCondition } from "./stored-condition";

const row = (overrides: Partial<StoredCondition> = {}): StoredCondition => ({
  subject: "CART",
  field: "subtotal",
  operator: "GREATER_OR_EQUAL",
  value: 100000,
  ...overrides,
});

describe("toRuleCondition", () => {
  it("reads a cart condition", () => {
    expect(toRuleCondition(row())).toEqual({
      field: "subtotal",
      operator: "GREATER_OR_EQUAL",
      value: 100000,
    });
  });

  it("skips rows that aren't valid cart conditions", () => {
    expect(toRuleCondition(row({ subject: "PRODUCT" }))).toBeNull();
    expect(toRuleCondition(row({ field: "colour" }))).toBeNull();
    expect(toRuleCondition(row({ operator: "CONTAINS" }))).toBeNull();
    expect(toRuleCondition(row({ value: "100000" }))).toBeNull();
    expect(toRuleCondition(row({ value: null }))).toBeNull();
    expect(toRuleCondition(row({ value: -1 }))).toBeNull();
    expect(toRuleCondition(row({ value: 1.5 }))).toBeNull();
  });
});
