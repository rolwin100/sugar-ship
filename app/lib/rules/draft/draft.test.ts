import { describe, expect, it } from "vitest";
import {
  draftToInput,
  emptyRuleDraft,
  parseRuleDraft,
  ruleToDraft,
} from "./draft";
import { emptyZonePricingDraft } from "./pricing-draft";
import type { Rule } from "../types";
import { NO_ADJUSTMENTS } from "../../engine";

const rule: Rule = {
  id: "r1",
  name: "Standard shipping",
  status: "ACTIVE",
  preset: "standard",
  customName: "",
  description: "Tracked and insured",
  minDeliveryDays: 3,
  maxDeliveryDays: 5,
  prices: [
    {
      zoneId: "domestic",
      adjustments: NO_ADJUSTMENTS,
      mode: "FLAT",
      price: 8000,
    },
    {
      zoneId: "intl",
      adjustments: NO_ADJUSTMENTS,
      mode: "FLAT",
      price: 150000,
    },
  ],
  match: "ANY",
  conditions: [
    {
      subject: "CART",
      field: "subtotal",
      operator: "GREATER_OR_EQUAL",
      value: 100000,
    },
    { subject: "CART", field: "weight", operator: "LESS_THAN", value: 1500 },
  ],
};

describe("rule drafts", () => {
  it("round-trips a saved rule through the form", () => {
    const draft = ruleToDraft(rule, "INR");
    expect(draft.prices.domestic).toMatchObject({
      offered: true,
      mode: "FLAT",
      price: "80.00",
    });
    expect(draft.prices.intl).toMatchObject({ price: "1500.00" });
    expect(draft.minDeliveryDays).toBe("3");
    expect(draft.conditions).toEqual([
      {
        subject: "CART",
        field: "subtotal",
        operator: "GREATER_OR_EQUAL",
        value: "1000.00",
      },
      { subject: "CART", field: "weight", operator: "LESS_THAN", value: "1.5" },
    ]);
    expect(draftToInput(draft, "INR")).toEqual({
      name: rule.name,
      status: rule.status,
      preset: rule.preset,
      customName: "",
      description: "Tracked and insured",
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

  it("leaves out zones that aren't offered and marks bad text as NaN", () => {
    const zone = (offered: boolean, price: string) => ({
      ...emptyZonePricingDraft(),
      offered,
      price,
    });
    const draft = {
      ...emptyRuleDraft(),
      prices: { a: zone(false, ""), b: zone(true, "50"), c: zone(true, "abc") },
      minDeliveryDays: "2.5",
    };
    const input = draftToInput(draft, "INR");
    expect(input.prices).toEqual([
      { zoneId: "b", adjustments: NO_ADJUSTMENTS, mode: "FLAT", price: 5000 },
      {
        zoneId: "c",
        adjustments: NO_ADJUSTMENTS,
        mode: "FLAT",
        price: Number.NaN,
      },
    ]);
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
    const ok = {
      subject: "CART",
      field: "weight",
      operator: "LESS_THAN",
      value: "1.5",
    };

    expect(withConditions([ok])).not.toBeNull();
    expect(withConditions([ok], "SOME")).toBeNull();
    expect(withConditions("nope")).toBeNull();
    expect(withConditions([{ ...ok, field: "colour" }])).toBeNull();
    expect(withConditions([{ ...ok, operator: "CONTAINS" }])).toBeNull();
    expect(withConditions([{ ...ok, value: 1.5 }])).toBeNull();
    expect(withConditions([null])).toBeNull();
  });

  it("accepts posted product conditions and rejects bad ones", () => {
    const draft = ruleToDraft(rule, "INR");
    const withConditions = (conditions: unknown) =>
      parseRuleDraft(JSON.stringify({ ...draft, conditions }));
    const ok = {
      subject: "PRODUCT",
      field: "collection",
      operator: "IN",
      quantifier: "ALL",
      value: "",
      collections: [{ id: 7, title: "Shoes" }],
    };

    expect(withConditions([ok])).not.toBeNull();
    expect(withConditions([{ ...ok, quantifier: "SOME" }])).toBeNull();
    expect(withConditions([{ ...ok, operator: "GREATER_THAN" }])).toBeNull();
    expect(withConditions([{ ...ok, collections: [{ id: "7" }] }])).toBeNull();
    expect(withConditions([{ ...ok, subject: "ADDRESS" }])).toBeNull();
  });
});
