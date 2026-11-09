import { describe, expect, it } from "vitest";
import { createI18n } from "../../../lib/i18n";
import { emptyAdjustmentsDraft } from "../../../lib/rules/draft/adjustments-draft";
import { adjustmentsSummary } from "./adjustmentsSummary";

const t = createI18n("en").t;
const summary = (
  adjustments: Partial<ReturnType<typeof emptyAdjustmentsDraft>>,
) =>
  adjustmentsSummary(
    { ...emptyAdjustmentsDraft(), ...adjustments },
    t,
    "INR",
    "en",
  );

describe("adjustmentsSummary", () => {
  it("is null when no adjustments are filled", () => {
    expect(summary({ freeOver: "  " })).toBeNull();
  });

  it("lists the filled adjustments in the order they apply", () => {
    expect(
      summary({
        maxPrice: "300",
        handlingFee: "15",
        freeOver: "1000",
        roundTo: "10",
        minPrice: "50",
      }),
    ).toBe(
      "Free shipping over ₹1,000.00 · +₹15.00 handling · Round up to nearest ₹10.00 · Min ₹50.00 · Max ₹300.00",
    );
  });

  it("shows a percent handling fee as a percent", () => {
    expect(summary({ handlingFee: "5", handlingType: "PERCENT" })).toBe(
      "+5% handling",
    );
  });

  it("shows amounts it can't read as typed", () => {
    expect(summary({ minPrice: "abc" })).toBe("Min abc");
  });
});
