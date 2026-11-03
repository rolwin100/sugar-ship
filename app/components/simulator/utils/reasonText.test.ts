import { describe, expect, it } from "vitest";
import type { CheckedCondition, TraceReason } from "../../../lib/engine";
import { createI18n } from "../../../lib/i18n";
import { amountText, reasonText } from "./reasonText";

const t = createI18n("en").t;
const format = { t, currency: "INR", locale: "en" };
const text = (reason: TraceReason) => reasonText(reason, format);

const subtotal: CheckedCondition = {
  field: "subtotal",
  operator: "GREATER_OR_EQUAL",
  value: 250000,
  actual: 100000,
  result: false,
};
const weight: CheckedCondition = {
  field: "weight",
  operator: "GREATER_THAN",
  value: 2000,
  actual: 3000,
  result: true,
};

describe("amountText", () => {
  it("shows each field in its unit", () => {
    expect(amountText("subtotal", 100000, format)).toBe("₹1,000.00");
    expect(amountText("weight", 2500, format)).toBe("2.5 kg");
    expect(amountText("quantity", 1, format)).toBe("1 item");
    expect(amountText("quantity", 3, format)).toBe("3 items");
  });
});

describe("reasonText", () => {
  it("explains rates that were skipped before their conditions", () => {
    expect(text({ kind: "inactive" })).toBe("Inactive");
    expect(text({ kind: "out_of_schedule" })).toBe("Outside its schedule");
    expect(text({ kind: "after_exclusive", ruleName: "VIP" })).toBe(
      "Skipped because “VIP” showed first",
    );
  });

  it("explains zone and price problems", () => {
    expect(text({ kind: "no_zone" })).toBe(
      "This address isn't in any of your zones",
    );
    expect(text({ kind: "not_in_zone", zoneName: "Domestic" })).toBe(
      "Not offered in Domestic",
    );
    expect(text({ kind: "not_priced" })).toBe(
      "Its price for this zone couldn't be worked out",
    );
  });

  it("explains conditions with the cart's own value", () => {
    const failure = (match: "ALL" | "ANY" | "NONE", conditions = [subtotal]) =>
      text({ kind: "conditions", failure: { match, conditions } });

    expect(failure("ALL")).toBe(
      "Needs: Cart subtotal is at least ₹2,500.00 (this cart: ₹1,000.00)",
    );
    expect(failure("ANY", [subtotal, { ...weight, result: false }])).toBe(
      "Needs one of: Cart subtotal is at least ₹2,500.00 (this cart: ₹1,000.00), or Cart weight is more than 2 kg (this cart: 3 kg)",
    );
    expect(failure("NONE", [weight])).toBe(
      "Must not have: Cart weight is more than 2 kg (this cart: 3 kg)",
    );
    expect(text({ kind: "conditions", failure: { unsupported: true } })).toBe(
      "Has a condition Sugar Ship can't check yet",
    );
  });
});
