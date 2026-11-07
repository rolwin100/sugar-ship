import { describe, expect, it } from "vitest";
import type {
  ConditionOperator,
  EngineCondition,
  EngineItem,
  Quantifier,
} from "../../types";
import { checkProductCondition } from "./product-condition";

const vase: EngineItem = {
  quantity: 1,
  grams: 800,
  price: 120000,
  sku: "VASE-01",
  vendor: "Acme Glass",
  tags: ["Fragile", "glass"],
  productType: "Vase",
  collectionIds: [10, 11],
};
const tee: EngineItem = {
  quantity: 2,
  grams: 200,
  price: 50000,
  sku: "TEE-RED",
  vendor: "Cotton Co",
  tags: ["sale"],
  productType: "T-shirt",
  collectionIds: [11],
};
const unknown: EngineItem = { quantity: 1, grams: 0, price: 1000 }; // not in our snapshot

const condition = (
  field: string,
  operator: ConditionOperator,
  value: unknown,
  quantifier: Quantifier = "ANY",
): EngineCondition => ({
  id: "c1",
  subject: "PRODUCT",
  field,
  operator,
  value,
  quantifier,
});

const result = (c: EngineCondition, items: EngineItem[] = [vase, tee]) => {
  const checked = checkProductCondition(c, items);
  if ("unsupported" in checked) throw new Error(checked.unsupported);
  return checked.result;
};

describe("checkProductCondition", () => {
  it("checks tags, ignoring case and spaces", () => {
    expect(result(condition("tag", "EQUALS", " FRAGILE "))).toBe(true);
    expect(result(condition("tag", "EQUALS", "fragile"), [tee])).toBe(false);
    expect(result(condition("tag", "NOT_EQUALS", "fragile"), [tee])).toBe(true);
    expect(result(condition("tag", "CONTAINS", "fra"))).toBe(true);
    expect(result(condition("tag", "NOT_CONTAINS", "fra"), [tee])).toBe(true);
    expect(result(condition("tag", "IN", ["sale", "clearance"]), [tee])).toBe(
      true,
    );
    expect(result(condition("tag", "NOT_IN", ["sale"]), [tee])).toBe(false);
  });

  it("checks type, vendor and SKU", () => {
    expect(result(condition("type", "EQUALS", "vase"))).toBe(true);
    expect(result(condition("vendor", "CONTAINS", "glass"))).toBe(true);
    expect(result(condition("sku", "IN", ["tee-red", "tee-blue"]))).toBe(true);
    expect(result(condition("sku", "EQUALS", "nope"))).toBe(false);
  });

  it("checks collections by id", () => {
    expect(result(condition("collection", "EQUALS", 10))).toBe(true);
    expect(result(condition("collection", "IN", [12, 11]), [tee])).toBe(true);
    expect(result(condition("collection", "NOT_EQUALS", 10), [tee])).toBe(true);
  });

  it("combines items with any / all / none", () => {
    const glass = (q: Quantifier) => condition("tag", "EQUALS", "glass", q);
    expect(result(glass("ANY"))).toBe(true); // the vase
    expect(result(glass("ALL"))).toBe(false); // not the tee
    expect(result(glass("NONE"))).toBe(false);
    expect(result(glass("NONE"), [tee])).toBe(true);
    expect(result(condition("collection", "EQUALS", 11, "ALL"))).toBe(true);
  });

  it("never counts an empty cart as all items", () => {
    expect(result(condition("tag", "NOT_EQUALS", "x", "ALL"), [])).toBe(false);
    expect(result(condition("tag", "EQUALS", "x", "NONE"), [])).toBe(true);
  });

  it("treats products we know nothing about as having no tags, type or collections", () => {
    expect(result(condition("tag", "EQUALS", "fragile"), [unknown])).toBe(
      false,
    );
    expect(result(condition("type", "NOT_EQUALS", "vase"), [unknown])).toBe(
      true,
    );
  });

  it("records how many items matched", () => {
    const checked = checkProductCondition(
      condition("tag", "EQUALS", "Glass", "ALL"),
      [vase, tee, { ...tee, quantity: 0 }],
    );
    expect(checked).toMatchObject({
      result: false,
      checked: {
        subject: "PRODUCT",
        field: "tag",
        operator: "EQUALS",
        quantifier: "ALL",
        values: ["glass"],
        matching: 1,
        total: 2, // the zero-quantity line doesn't count
        result: false,
      },
    });
  });

  it("can't check unknown fields, operators or values", () => {
    const unsupported = (c: EngineCondition) =>
      "unsupported" in checkProductCondition(c, [vase]);
    expect(unsupported(condition("colour", "EQUALS", "red"))).toBe(true);
    expect(unsupported(condition("tag", "GREATER_THAN", "x"))).toBe(true);
    expect(unsupported(condition("collection", "CONTAINS", 1))).toBe(true);
    expect(unsupported(condition("collection", "EQUALS", "10"))).toBe(true);
    expect(unsupported(condition("tag", "EQUALS", ""))).toBe(true);
    expect(unsupported(condition("tag", "IN", []))).toBe(true);
    expect(unsupported(condition("tag", "IN", "sale"))).toBe(true);
    expect(
      unsupported({
        ...condition("tag", "EQUALS", "x"),
        quantifier: "SOME" as Quantifier,
      }),
    ).toBe(true);
  });
});
