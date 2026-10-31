import { describe, expect, it } from "vitest";
import type { RuleConditionDraft } from "../types";
import { CONDITIONS_MAX } from "../validate-rule";
import {
  addCondition,
  NEW_CONDITION,
  removeCondition,
  replaceConditionField,
  replaceConditionOperator,
  replaceConditionValue,
} from "./edit-conditions";

const subtotal: RuleConditionDraft = {
  field: "subtotal",
  operator: "GREATER_OR_EQUAL",
  value: "1000",
};
const weight: RuleConditionDraft = {
  field: "weight",
  operator: "LESS_THAN",
  value: "5",
};

describe("editing conditions", () => {
  it("adds a new condition at the end, up to the limit", () => {
    expect(addCondition([])).toEqual([NEW_CONDITION]);
    expect(addCondition([subtotal])).toEqual([subtotal, NEW_CONDITION]);

    const full = Array(CONDITIONS_MAX).fill(subtotal);
    expect(addCondition(full)).toBe(full);
  });

  it("gives each new condition its own object", () => {
    const [added] = addCondition([]);
    expect(added).not.toBe(NEW_CONDITION);
  });

  it("removes a condition by position", () => {
    expect(removeCondition([subtotal, weight], 0)).toEqual([weight]);
    expect(removeCondition([subtotal, weight], 5)).toEqual([subtotal, weight]);
  });

  it("clears the value when the field changes", () => {
    expect(replaceConditionField([subtotal, weight], 0, "weight")).toEqual([
      { field: "weight", operator: "GREATER_OR_EQUAL", value: "" },
      weight,
    ]);
    // Same field: nothing changes.
    expect(replaceConditionField([subtotal], 0, "subtotal")).toEqual([
      subtotal,
    ]);
  });

  it("changes the operator or value of one condition", () => {
    expect(replaceConditionOperator([subtotal, weight], 1, "EQUALS")).toEqual([
      subtotal,
      { ...weight, operator: "EQUALS" },
    ]);
    expect(replaceConditionValue([subtotal], 0, "2000")).toEqual([
      { ...subtotal, value: "2000" },
    ]);
  });

  it("never changes the original list", () => {
    const original = [subtotal, weight];
    const copy = structuredClone(original);
    addCondition(original);
    removeCondition(original, 0);
    replaceConditionField(original, 0, "quantity");
    replaceConditionOperator(original, 0, "EQUALS");
    replaceConditionValue(original, 0, "1");
    expect(original).toEqual(copy);
  });
});
