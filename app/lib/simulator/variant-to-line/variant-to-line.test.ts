import { describe, expect, it } from "vitest";
import type { SimulatorLine } from "../types";
import {
  linesTotals,
  mergeLines,
  pickedToLines,
  toGrams,
} from "./variant-to-line";

const line = (overrides: Partial<SimulatorLine> = {}): SimulatorLine => ({
  productId: 1,
  variantId: 11,
  title: "Backpack",
  sku: null,
  vendor: null,
  price: 1000,
  grams: 200,
  quantity: "1",
  ...overrides,
});

describe("toGrams", () => {
  it("converts each Shopify weight unit to whole grams", () => {
    expect(toGrams(1.5, "KILOGRAMS")).toBe(1500);
    expect(toGrams(250, "GRAMS")).toBe(250);
    expect(toGrams(1, "POUNDS")).toBe(454);
    expect(toGrams(2, "OUNCES")).toBe(57);
  });

  it("is 0 for no weight or an unknown unit", () => {
    expect(toGrams(0, "GRAMS")).toBe(0);
    expect(toGrams(null, "GRAMS")).toBe(0);
    expect(toGrams(3, "STONES")).toBe(0);
  });
});

describe("pickedToLines", () => {
  it("makes one line per variant, naming non-default variants", () => {
    const lines = pickedToLines(
      [
        {
          id: "gid://shopify/Product/1",
          title: "Backpack",
          vendor: "Acme",
          variants: [
            {
              id: "gid://shopify/ProductVariant/11",
              title: "Khaki",
              price: "12.50",
              sku: "BP-K",
              weight: 0.8,
              weightUnit: "KILOGRAMS",
            },
            { id: "bad" },
          ],
        },
        {
          id: "gid://shopify/Product/2",
          title: "Mug",
          variants: [
            {
              id: "gid://shopify/ProductVariant/21",
              title: "Default Title",
              price: "4",
              sku: "",
            },
          ],
        },
      ],
      "USD",
    );
    expect(lines).toEqual([
      {
        productId: 1,
        variantId: 11,
        title: "Backpack · Khaki",
        sku: "BP-K",
        vendor: "Acme",
        price: 1250,
        grams: 800,
        quantity: "1",
      },
      {
        productId: 2,
        variantId: 21,
        title: "Mug",
        sku: null,
        vendor: null,
        price: 400,
        grams: 0,
        quantity: "1",
      },
    ]);
  });

  it("skips products without a valid id", () => {
    expect(pickedToLines([{ id: "nope", variants: [] }], "USD")).toEqual([]);
  });
});

describe("mergeLines", () => {
  it("adds new variants and keeps existing ones with their quantities", () => {
    const current = [line({ quantity: "3" })];
    const merged = mergeLines(current, [line(), line({ variantId: 12 })]);
    expect(merged.map((l) => [l.variantId, l.quantity])).toEqual([
      [11, "3"],
      [12, "1"],
    ]);
  });
});

describe("linesTotals", () => {
  it("adds up price, weight and items by quantity", () => {
    expect(
      linesTotals([
        line({ quantity: "2" }),
        line({ variantId: 12, price: 500, grams: 0, quantity: "1" }),
        line({ variantId: 13, quantity: "x" }),
      ]),
    ).toEqual({ subtotal: 2500, grams: 400, quantity: 3 });
  });
});
