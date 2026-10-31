import { describe, expect, it } from "vitest";
import { priceByBands } from "./bands";
import { rate, totals } from "./test-helpers";

// 0–1 kg ₹60 · 1–5 kg ₹120 · 5 kg+ ₹250
const byWeight = rate({
  mode: "BANDS",
  basis: "WEIGHT",
  bands: [
    { from: 5000, to: null, price: 25000 },
    { from: 0, to: 1000, price: 6000 },
    { from: 1000, to: 5000, price: 12000 },
  ],
});

const at = (weight: number) => priceByBands(byWeight, totals({ weight }));

describe("priceByBands", () => {
  it("picks the band the cart falls in, whatever order bands are saved in", () => {
    expect(at(1200)).toEqual({ ok: true, price: 12000 });
    expect(at(0)).toEqual({ ok: true, price: 6000 });
    expect(at(999)).toEqual({ ok: true, price: 6000 });
  });

  it("puts a value exactly on an edge in the higher band", () => {
    expect(at(1000)).toEqual({ ok: true, price: 12000 });
    expect(at(5000)).toEqual({ ok: true, price: 25000 });
  });

  it("treats an empty `to` as 'and above'", () => {
    expect(at(1_000_000)).toEqual({ ok: true, price: 25000 });
  });

  it("gives no price when no band covers the cart", () => {
    const capped = rate({
      mode: "BANDS",
      basis: "WEIGHT",
      bands: [{ from: 0, to: 5000, price: 6000 }],
    });
    expect(priceByBands(capped, totals({ weight: 7200 }))).toEqual({
      ok: false,
      reason: "no band covers weight 7200",
    });
  });

  it("works on subtotal and quantity too", () => {
    const bySubtotal = rate({
      mode: "BANDS",
      basis: "SUBTOTAL",
      bands: [
        { from: 0, to: 100000, price: 8000 },
        { from: 100000, to: null, price: 0 },
      ],
    });
    expect(priceByBands(bySubtotal, totals({ subtotal: 180000 }))).toEqual({
      ok: true,
      price: 0,
    });

    const byQuantity = rate({
      mode: "BANDS",
      basis: "QUANTITY",
      bands: [{ from: 1, to: null, price: 5000 }],
    });
    expect(priceByBands(byQuantity, totals({ quantity: 0 })).ok).toBe(false);
  });

  it("reports broken settings instead of guessing", () => {
    expect(
      priceByBands(rate({ mode: "BANDS", basis: "WEIGHT" }), totals()),
    ).toEqual({
      ok: false,
      reason: "BANDS rate has no bands",
    });
    expect(
      priceByBands(rate({ mode: "BANDS", bands: byWeight.bands }), totals()),
    ).toEqual({ ok: false, reason: "BANDS rate has no basis" });
  });
});
