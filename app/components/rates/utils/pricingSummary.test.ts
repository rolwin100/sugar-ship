import { describe, expect, it } from "vitest";
import { createI18n } from "../../../lib/i18n";
import { pricingSummary } from "./pricingSummary";
import { RATE_BASIS, RATE_MODE } from "../../../lib/engine";

const t = createI18n("en").t;
const summary = (pricing: Parameters<typeof pricingSummary>[0]) =>
  pricingSummary(pricing, t, "INR", "en");

describe("pricingSummary", () => {
  it("shows a flat price", () => {
    expect(summary({ zoneId: "z", mode: RATE_MODE.FLAT, price: 8000 })).toBe(
      "₹80.00",
    );
  });

  it("shows a price table's range and basis", () => {
    expect(
      summary({
        zoneId: "z",
        mode: RATE_MODE.BANDS,
        basis: RATE_BASIS.WEIGHT,
        bands: [
          { from: 0, to: 1000, price: 5000 },
          { from: 1000, to: null, price: 9000 },
        ],
      }),
    ).toBe("₹50.00–₹90.00 by weight");
  });

  it("shows step pricing in the basis's unit", () => {
    const step = {
      zoneId: "z",
      mode: RATE_MODE.INCREMENTAL,
      basePrice: 4000,
      stepPrice: 1500,
    } as const;
    expect(summary({ ...step, basis: RATE_BASIS.QUANTITY, stepSize: 2 })).toBe(
      "₹40.00 + ₹15.00 per 2 items",
    );
    expect(summary({ ...step, basis: RATE_BASIS.QUANTITY, stepSize: 1 })).toBe(
      "₹40.00 + ₹15.00 per item",
    );
    expect(summary({ ...step, basis: RATE_BASIS.WEIGHT, stepSize: 500 })).toBe(
      "₹40.00 + ₹15.00 per 0.5 kg",
    );
  });

  it("shows a percentage", () => {
    expect(
      summary({ zoneId: "z", mode: RATE_MODE.PERCENT, percentBps: 250 }),
    ).toBe("2.5% of subtotal");
  });
});
