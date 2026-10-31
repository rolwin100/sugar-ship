import { describe, expect, it } from "vitest";
import { priceByPercent } from "./percent";
import { rate, totals } from "./test-helpers";

const fivePercent = rate({ mode: "PERCENT", percentBps: 500 });

describe("priceByPercent", () => {
  it("charges a share of the subtotal", () => {
    expect(priceByPercent(fivePercent, totals({ subtotal: 180000 }))).toEqual({
      ok: true,
      price: 9000, // 5% of ₹1,800 = ₹90
    });
  });

  it("rounds to the nearest subunit", () => {
    // 5% of 12345 = 617.25 → 617; 2.5% of 12345 = 308.625 → 309
    expect(priceByPercent(fivePercent, totals({ subtotal: 12345 }))).toEqual({
      ok: true,
      price: 617,
    });
    expect(
      priceByPercent(
        rate({ mode: "PERCENT", percentBps: 250 }),
        totals({ subtotal: 12345 }),
      ),
    ).toEqual({ ok: true, price: 309 });
  });

  it("is free for an empty cart", () => {
    expect(priceByPercent(fivePercent, totals({ subtotal: 0 }))).toEqual({
      ok: true,
      price: 0,
    });
  });

  it("reports a missing percentage", () => {
    expect(priceByPercent(rate({ mode: "PERCENT" }), totals())).toEqual({
      ok: false,
      reason: "PERCENT rate has no percentage",
    });
  });
});
