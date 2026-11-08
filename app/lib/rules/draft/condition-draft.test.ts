import { describe, expect, it } from "vitest";
import type { CartConditionField } from "../../engine";
import type {
  ProductRuleCondition,
  RuleCondition,
  RuleConditionDraft,
} from "../types";
import {
  collectionIdsIn,
  conditionToDraft,
  draftToCondition,
  fillCollectionTitles,
} from "./condition-draft";

describe("condition drafts", () => {
  it("shows each field in the merchant's units", () => {
    const at = (field: CartConditionField, value: number) =>
      conditionToDraft(
        { subject: "CART", field, operator: "GREATER_OR_EQUAL", value },
        "INR",
      ).value;

    expect(at("subtotal", 100000)).toBe("1000.00");
    expect(at("weight", 1500)).toBe("1.5");
    expect(at("quantity", 10)).toBe("10");
  });

  it("round-trips through the form", () => {
    const conditions: RuleCondition[] = [
      {
        subject: "CART",
        field: "subtotal",
        operator: "GREATER_OR_EQUAL",
        value: 100000,
      },
      { subject: "CART", field: "weight", operator: "LESS_THAN", value: 1500 },
      { subject: "CART", field: "quantity", operator: "EQUALS", value: 3 },
    ];
    for (const c of conditions) {
      expect(draftToCondition(conditionToDraft(c, "INR"), "INR")).toEqual(c);
    }
  });

  it("uses the shop's currency for subtotals", () => {
    expect(
      draftToCondition(
        {
          subject: "CART",
          field: "subtotal",
          operator: "GREATER_THAN",
          value: "500",
        },
        "JPY",
      ).value,
    ).toBe(500);
  });

  it("marks empty or invalid text as NaN", () => {
    const value = (field: CartConditionField, text: string) =>
      draftToCondition(
        { subject: "CART", field, operator: "GREATER_THAN", value: text },
        "INR",
      ).value;

    expect(value("subtotal", "")).toBeNaN();
    expect(value("subtotal", "abc")).toBeNaN();
    expect(value("weight", "")).toBeNaN();
    expect(value("weight", "1.2345")).toBeNaN();
    expect(value("quantity", "2.5")).toBeNaN();
    expect(value("quantity", "")).toBeNaN();
  });

  it("round-trips product conditions", () => {
    const conditions: ProductRuleCondition[] = [
      {
        subject: "PRODUCT",
        field: "tag",
        operator: "EQUALS",
        quantifier: "ANY",
        value: "fragile",
      },
      {
        subject: "PRODUCT",
        field: "sku",
        operator: "IN",
        quantifier: "NONE",
        value: ["TEE-RED", "TEE-BLUE"],
      },
      {
        subject: "PRODUCT",
        field: "collection",
        operator: "IN",
        quantifier: "ALL",
        value: [7, 12],
      },
    ];
    for (const c of conditions) {
      expect(draftToCondition(conditionToDraft(c, "INR"), "INR")).toEqual(c);
    }
  });

  it("shows product lists as comma-separated text and collections by id", () => {
    expect(
      conditionToDraft(
        {
          subject: "PRODUCT",
          field: "tag",
          operator: "IN",
          quantifier: "ANY",
          value: ["fragile", "glass"],
        },
        "INR",
      ),
    ).toMatchObject({ value: "fragile, glass", collections: [] });
    expect(
      conditionToDraft(
        {
          subject: "PRODUCT",
          field: "collection",
          operator: "IN",
          quantifier: "ANY",
          value: [7],
        },
        "INR",
      ),
    ).toMatchObject({ value: "", collections: [{ id: 7, title: "" }] });
  });

  it("splits typed lists and trims single values", () => {
    const typed = (operator: "EQUALS" | "IN", value: string) =>
      draftToCondition(
        {
          subject: "PRODUCT",
          field: "tag",
          operator,
          quantifier: "ANY",
          value,
          collections: [],
        },
        "INR",
      );
    expect(typed("IN", " fragile , , glass ")).toMatchObject({
      value: ["fragile", "glass"],
    });
    expect(typed("EQUALS", "  fragile ")).toMatchObject({ value: "fragile" });
  });

  it("finds collection ids and fills in their titles", () => {
    const drafts: RuleConditionDraft[] = [
      { subject: "CART", field: "weight", operator: "LESS_THAN", value: "2" },
      {
        subject: "PRODUCT",
        field: "collection",
        operator: "IN",
        quantifier: "ANY",
        value: "",
        collections: [
          { id: 7, title: "" },
          { id: 9, title: "" },
        ],
      },
    ];
    expect(collectionIdsIn(drafts)).toEqual([7, 9]);
    const filled = fillCollectionTitles(drafts, { 7: "Shoes" });
    expect(filled[0]).toBe(drafts[0]);
    expect(filled[1]).toMatchObject({
      collections: [
        { id: 7, title: "Shoes" },
        { id: 9, title: "" }, // deleted or unknown: shown as "Collection 9"
      ],
    });
  });
});
