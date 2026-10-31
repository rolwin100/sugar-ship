import { describe, expect, it } from "vitest";
import type { RuleCondition } from "../types";
import { conditionToDraft, draftToCondition } from "./condition-draft";

describe("condition drafts", () => {
  it("shows each field in the merchant's units", () => {
    const at = (field: RuleCondition["field"], value: number) =>
      conditionToDraft({ field, operator: "GREATER_OR_EQUAL", value }, "INR")
        .value;

    expect(at("subtotal", 100000)).toBe("1000.00");
    expect(at("weight", 1500)).toBe("1.5");
    expect(at("quantity", 10)).toBe("10");
  });

  it("round-trips through the form", () => {
    const conditions: RuleCondition[] = [
      { field: "subtotal", operator: "GREATER_OR_EQUAL", value: 100000 },
      { field: "weight", operator: "LESS_THAN", value: 1500 },
      { field: "quantity", operator: "EQUALS", value: 3 },
    ];
    for (const c of conditions) {
      expect(draftToCondition(conditionToDraft(c, "INR"), "INR")).toEqual(c);
    }
  });

  it("uses the shop's currency for subtotals", () => {
    expect(
      draftToCondition(
        { field: "subtotal", operator: "GREATER_THAN", value: "500" },
        "JPY",
      ).value,
    ).toBe(500);
  });

  it("marks empty or invalid text as NaN", () => {
    const value = (field: RuleCondition["field"], text: string) =>
      draftToCondition({ field, operator: "GREATER_THAN", value: text }, "INR")
        .value;

    expect(value("subtotal", "")).toBeNaN();
    expect(value("subtotal", "abc")).toBeNaN();
    expect(value("weight", "")).toBeNaN();
    expect(value("weight", "1.2345")).toBeNaN();
    expect(value("quantity", "2.5")).toBeNaN();
    expect(value("quantity", "")).toBeNaN();
  });
});
