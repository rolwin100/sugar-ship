import { describe, expect, it } from "vitest";
import { priceIncrementally } from "./incremental";
import { rate, totals } from "./test-helpers";

// ₹50 for the first 500 g, then ₹20 per extra 500 g.
const perWeight = rate({
  mode: "INCREMENTAL",
  basis: "WEIGHT",
  price: 5000,
  stepSize: 500,
  stepPrice: 2000,
});

const at = (weight: number) =>
  priceIncrementally(perWeight, totals({ weight }));

describe("priceIncrementally", () => {
  it("charges the base for the first step", () => {
    expect(at(0)).toEqual({ ok: true, price: 5000 });
    expect(at(500)).toEqual({ ok: true, price: 5000 });
  });

  it("adds a step price for each further step, rounding partial steps up", () => {
    expect(at(501)).toEqual({ ok: true, price: 7000 });
    expect(at(1000)).toEqual({ ok: true, price: 7000 });
    expect(at(1200)).toEqual({ ok: true, price: 9000 }); // ₹50 + 2 × ₹20
  });

  it("works per item", () => {
    // ₹50 for the first item, ₹10 per extra item.
    const perItem = rate({
      mode: "INCREMENTAL",
      basis: "QUANTITY",
      price: 5000,
      stepSize: 1,
      stepPrice: 1000,
    });
    expect(priceIncrementally(perItem, totals({ quantity: 3 }))).toEqual({
      ok: true,
      price: 7000,
    });
  });

  it("reports broken settings instead of guessing", () => {
    expect(priceIncrementally({ ...perWeight, stepSize: 0 }, totals())).toEqual(
      { ok: false, reason: "INCREMENTAL rate has no step size" },
    );
    expect(
      priceIncrementally({ ...perWeight, stepPrice: null }, totals()),
    ).toEqual({ ok: false, reason: "INCREMENTAL rate is missing a price" });
    expect(priceIncrementally({ ...perWeight, basis: null }, totals())).toEqual(
      { ok: false, reason: "INCREMENTAL rate has no basis" },
    );
  });
});
