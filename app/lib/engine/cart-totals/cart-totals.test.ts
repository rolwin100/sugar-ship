import { describe, expect, it } from "vitest";
import type { EngineCart, EngineItem } from "../types";
import { cartTotals } from "./cart-totals";

const item = (overrides: Partial<EngineItem> = {}): EngineItem => ({
  quantity: 1,
  grams: 500,
  price: 25000,
  ...overrides,
});

const cart = (items: EngineItem[]): EngineCart => ({
  items,
  currency: "INR",
  destination: { country: "IN" },
});

describe("cartTotals", () => {
  it("adds up subtotal, weight and quantity across lines", () => {
    const totals = cartTotals(
      cart([
        item({ quantity: 2, grams: 500, price: 25000 }),
        item({ quantity: 1, grams: 1200, price: 70000 }),
      ]),
    );
    expect(totals).toEqual({ subtotal: 120000, weight: 2200, quantity: 3 });
  });

  it("returns zeros for an empty cart", () => {
    expect(cartTotals(cart([]))).toEqual({
      subtotal: 0,
      weight: 0,
      quantity: 0,
    });
  });

  it("counts weightless and free items correctly", () => {
    const totals = cartTotals(
      cart([item({ quantity: 3, grams: 0, price: 0 })]),
    );
    expect(totals).toEqual({ subtotal: 0, weight: 0, quantity: 3 });
  });

  it("ignores negative or missing numbers", () => {
    const totals = cartTotals(
      cart([
        item({ quantity: -2 }),
        item({ quantity: 1, grams: -100, price: Number.NaN }),
      ]),
    );
    expect(totals).toEqual({ subtotal: 0, weight: 0, quantity: 1 });
  });
});
