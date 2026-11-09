import { describe, expect, it } from "vitest";
import { cartTotals } from "../../engine";
import type { SimulatorDraft, SimulatorLine } from "../types";
import { toSimulatorCart } from "./to-simulator-cart";

const draft = (overrides: Partial<SimulatorDraft> = {}): SimulatorDraft => ({
  country: "IN",
  province: "KA",
  postcode: "560078",
  subtotal: "1000",
  weight: "2.5",
  quantity: "3",
  lines: [],
  ...overrides,
});

const line = (overrides: Partial<SimulatorLine> = {}): SimulatorLine => ({
  productId: 1,
  variantId: 11,
  title: "Lunch Bag",
  sku: "BAG-1",
  vendor: "Acme",
  price: 31000,
  grams: 500,
  quantity: "2",
  ...overrides,
});

const errorKeys = (d: SimulatorDraft) => {
  const result = toSimulatorCart(d, "INR");
  return result.ok ? [] : result.errors.map((e) => e.key);
};

describe("toSimulatorCart", () => {
  it("builds a cart whose totals are what was typed", () => {
    const result = toSimulatorCart(draft(), "INR");
    if (!result.ok) throw new Error("expected a cart");
    expect(result.cart.destination).toEqual({
      country: "IN",
      province: "KA",
      postcode: "560078",
    });
    expect(cartTotals(result.cart)).toEqual({
      subtotal: 100000,
      weight: 2500,
      quantity: 3,
    });
  });

  it("uses one line for a single item and treats empty weight as 0 kg", () => {
    const result = toSimulatorCart(draft({ quantity: "1", weight: "" }), "INR");
    if (!result.ok) throw new Error("expected a cart");
    expect(result.cart.items).toEqual([
      { quantity: 1, grams: 0, price: 100000 },
    ]);
  });

  it("tidies the address", () => {
    const result = toSimulatorCart(
      draft({ country: " in ", province: " ", postcode: "" }),
      "INR",
    );
    if (!result.ok) throw new Error("expected a cart");
    expect(result.cart.destination).toEqual({
      country: "IN",
      province: null,
      postcode: null,
    });
  });

  it("points at each field to fix", () => {
    expect(errorKeys(draft({ country: "" }))).toEqual(["countryRequired"]);
    expect(errorKeys(draft({ subtotal: "" }))).toEqual(["subtotalInvalid"]);
    expect(errorKeys(draft({ subtotal: "abc" }))).toEqual(["subtotalInvalid"]);
    expect(errorKeys(draft({ weight: "1.2345" }))).toEqual(["weightInvalid"]);
    expect(errorKeys(draft({ quantity: "0" }))).toEqual(["quantityInvalid"]);
    expect(errorKeys(draft({ quantity: "2.5" }))).toEqual(["quantityInvalid"]);
  });

  it("builds one item per product line and ignores the typed totals", () => {
    const result = toSimulatorCart(
      draft({
        subtotal: "",
        lines: [line(), line({ variantId: 12, quantity: " 1 ", sku: null })],
      }),
      "INR",
    );
    if (!result.ok) throw new Error("expected a cart");
    expect(result.cart.items[0]).toEqual({
      productId: 1,
      variantId: 11,
      name: "Lunch Bag",
      sku: "BAG-1",
      vendor: "Acme",
      quantity: 2,
      grams: 500,
      price: 31000,
    });
    expect(cartTotals(result.cart)).toEqual({
      subtotal: 93000,
      weight: 1500,
      quantity: 3,
    });
  });

  it("points at each line whose quantity needs fixing", () => {
    const result = toSimulatorCart(
      draft({ lines: [line(), line({ variantId: 12, quantity: "0" })] }),
      "INR",
    );
    expect(result).toEqual({
      ok: false,
      errors: [{ field: "lines", key: "lineQuantityInvalid", line: 1 }],
    });
  });
});
