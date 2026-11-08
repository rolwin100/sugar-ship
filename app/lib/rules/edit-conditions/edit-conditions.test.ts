import { describe, expect, it } from "vitest";
import type { RuleConditionDraft } from "../types";
import { CONDITIONS_MAX } from "../validate-rule";
import {
  addCondition,
  NEW_CONDITION,
  removeCondition,
  newProductCondition,
  replaceConditionCollections,
  replaceConditionField,
  replaceConditionOperator,
  replaceConditionQuantifier,
  replaceConditionValue,
} from "./edit-conditions";

const subtotal: RuleConditionDraft = {
  subject: "CART",
  field: "subtotal",
  operator: "GREATER_OR_EQUAL",
  value: "1000",
};
const weight: RuleConditionDraft = {
  subject: "CART",
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
      {
        subject: "CART",
        field: "weight",
        operator: "GREATER_OR_EQUAL",
        value: "",
      },
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

  it("starts a product condition when switching from a cart field, and back", () => {
    const [tag] = replaceConditionField([subtotal], 0, "tag");
    expect(tag).toEqual({
      subject: "PRODUCT",
      field: "tag",
      operator: "EQUALS",
      quantifier: "ANY",
      value: "",
      collections: [],
    });
    expect(replaceConditionField([tag], 0, "weight")[0]).toEqual({
      ...NEW_CONDITION,
      field: "weight",
    });
  });

  it("keeps the quantifier between product fields, and resets operators for collections", () => {
    const tag = {
      ...newProductCondition("tag"),
      quantifier: "ALL" as const,
      operator: "CONTAINS" as const,
      value: "fra",
    };
    expect(replaceConditionField([tag], 0, "sku")[0]).toMatchObject({
      field: "sku",
      quantifier: "ALL",
      operator: "CONTAINS",
      value: "",
    });
    expect(replaceConditionField([tag], 0, "collection")[0]).toMatchObject({
      field: "collection",
      quantifier: "ALL",
      operator: "IN",
    });
  });

  it("only accepts operators that fit the condition", () => {
    expect(replaceConditionOperator([subtotal], 0, "CONTAINS")[0]).toBe(
      subtotal,
    );
    const tag = newProductCondition("tag");
    expect(replaceConditionOperator([tag], 0, "GREATER_THAN")[0]).toBe(tag);
    expect(replaceConditionOperator([tag], 0, "IN")[0]).toMatchObject({
      operator: "IN",
    });
  });

  it("sets the quantifier and collections of product conditions only", () => {
    const shoes = [{ id: 7, title: "Shoes" }];
    const collection = newProductCondition("collection");
    expect(
      replaceConditionQuantifier([collection], 0, "NONE")[0],
    ).toMatchObject({ quantifier: "NONE" });
    expect(
      replaceConditionCollections([collection], 0, shoes)[0],
    ).toMatchObject({ collections: shoes });
    expect(replaceConditionQuantifier([subtotal], 0, "NONE")[0]).toBe(subtotal);
  });
});
