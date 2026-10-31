import { describe, expect, it } from "vitest";
import { priceRate } from "./pricing";
import { rate, totals } from "./test-helpers";

describe("priceRate", () => {
  it("prices each mode", () => {
    const t = totals(); // 1.2 kg, ₹1,800
    expect(priceRate(rate({ mode: "FLAT", price: 8000 }), t)).toEqual({
      ok: true,
      price: 8000,
    });
    expect(
      priceRate(
        rate({
          mode: "BANDS",
          basis: "WEIGHT",
          bands: [{ from: 1000, to: null, price: 12000 }],
        }),
        t,
      ),
    ).toEqual({ ok: true, price: 12000 });
    expect(
      priceRate(
        rate({
          mode: "INCREMENTAL",
          basis: "WEIGHT",
          price: 5000,
          stepSize: 500,
          stepPrice: 2000,
        }),
        t,
      ),
    ).toEqual({ ok: true, price: 9000 });
    expect(priceRate(rate({ mode: "PERCENT", percentBps: 500 }), t)).toEqual({
      ok: true,
      price: 9000,
    });
  });

  it("reports a flat rate with no price", () => {
    expect(priceRate(rate({ mode: "FLAT" }), totals())).toEqual({
      ok: false,
      reason: "FLAT rate has no price",
    });
  });

  it("rejects prices checkout can't use", () => {
    expect(priceRate(rate({ mode: "FLAT", price: -100 }), totals())).toEqual({
      ok: false,
      reason: "FLAT rate gave an invalid price",
    });
    expect(
      priceRate(
        rate({ mode: "PERCENT", percentBps: 500 }),
        totals({ subtotal: Number.MAX_VALUE }),
      ).ok,
    ).toBe(false);
  });
});
