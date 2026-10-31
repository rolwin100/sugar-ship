import { describe, expect, it } from "vitest";
import {
  draftToInput,
  emptyRuleDraft,
  parseRuleDraft,
  ruleToDraft,
} from "./draft";
import type { Rule } from "../types";

const rule: Rule = {
  id: "r1",
  name: "Standard shipping",
  status: "ACTIVE",
  preset: "standard",
  customName: "",
  minDeliveryDays: 3,
  maxDeliveryDays: 5,
  prices: [
    { zoneId: "domestic", price: 8000 },
    { zoneId: "intl", price: 150000 },
  ],
  match: "ANY",
  conditions: [
    { field: "subtotal", operator: "GREATER_OR_EQUAL", value: 100000 },
    { field: "weight", operator: "LESS_THAN", value: 1500 },
  ],
};

describe("rule drafts", () => {
  it("round-trips a saved rule through the form", () => {
    const draft = ruleToDraft(rule, "INR");
    expect(draft.prices).toEqual({ domestic: "80.00", intl: "1500.00" });
    expect(draft.minDeliveryDays).toBe("3");
    expect(draft.conditions).toEqual([
      { field: "subtotal", operator: "GREATER_OR_EQUAL", value: "1000.00" },
      { field: "weight", operator: "LESS_THAN", value: "1.5" },
    ]);
    expect(draftToInput(draft, "INR")).toEqual({
      name: rule.name,
      status: rule.status,
      preset: rule.preset,
      customName: "",
      minDeliveryDays: 3,
      maxDeliveryDays: 5,
      prices: rule.prices,
      match: "ANY",
      conditions: rule.conditions,
    });
  });

  it("starts new rates with no conditions, matching all", () => {
    expect(emptyRuleDraft()).toMatchObject({ match: "ALL", conditions: [] });
  });

  it("uses 'custom' for rules without a preset", () => {
    const draft = ruleToDraft(
      { ...rule, preset: null, customName: "Courier" },
      "INR",
    );
    expect(draft.preset).toBe("custom");
    expect(draftToInput(draft, "INR")).toMatchObject({
      preset: null,
      customName: "Courier",
    });
  });

  it("leaves out empty prices and marks bad text as NaN", () => {
    const draft = {
      ...emptyRuleDraft(),
      prices: { a: "", b: "50", c: "abc" },
      minDeliveryDays: "2.5",
    };
    const input = draftToInput(draft, "INR");
    expect(input.prices.map((p) => p.zoneId)).toEqual(["b", "c"]);
    expect(input.prices[0].price).toBe(5000);
    expect(input.prices[1].price).toBeNaN();
    expect(input.minDeliveryDays).toBeNaN();
    expect(input.maxDeliveryDays).toBeNull();
  });

  it("reads a posted draft and rejects bad shapes", () => {
    const draft = ruleToDraft(rule, "INR");
    expect(parseRuleDraft(JSON.stringify(draft))).toEqual(draft);
    expect(parseRuleDraft(null)).toBeNull();
    expect(parseRuleDraft("nope")).toBeNull();
    expect(
      parseRuleDraft(JSON.stringify({ ...draft, status: "ON" })),
    ).toBeNull();
    expect(
      parseRuleDraft(JSON.stringify({ ...draft, preset: "teleport" })),
    ).toBeNull();
    expect(
      parseRuleDraft(JSON.stringify({ ...draft, prices: { a: 5 } })),
    ).toBeNull();
    expect(parseRuleDraft(JSON.stringify({ ...draft, name: 1 }))).toBeNull();
  });

  it("rejects posted conditions with the wrong shape", () => {
    const draft = ruleToDraft(rule, "INR");
    const withConditions = (conditions: unknown, match: unknown = "ALL") =>
      parseRuleDraft(JSON.stringify({ ...draft, match, conditions }));
    const ok = { field: "weight", operator: "LESS_THAN", value: "1.5" };

    expect(withConditions([ok])).not.toBeNull();
    expect(withConditions([ok], "SOME")).toBeNull();
    expect(withConditions("nope")).toBeNull();
    expect(withConditions([{ ...ok, field: "colour" }])).toBeNull();
    expect(withConditions([{ ...ok, operator: "CONTAINS" }])).toBeNull();
    expect(withConditions([{ ...ok, value: 1.5 }])).toBeNull();
    expect(withConditions([null])).toBeNull();
  });
});
