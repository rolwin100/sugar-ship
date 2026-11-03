import { describe, expect, it } from "vitest";
import type { StoredRateLog } from "../types";
import { toHistoryItem } from "./to-history-item";

const row = (overrides: Partial<StoredRateLog> = {}): StoredRateLog => ({
  id: "log1",
  createdAt: new Date("2026-11-03T10:00:00Z"),
  currency: "INR",
  locale: "en",
  destination: {
    country: "IN",
    province: "KA",
    city: "Bengaluru",
    postal_code: "560078",
  },
  items: [
    { name: "T-shirt", sku: "TS-1", quantity: 2, grams: 200, price: 50000 },
    { name: "Cap", sku: null, quantity: 1, grams: 100, price: 30000 },
  ],
  rates: [
    {
      service_name: "Express",
      service_code: "sugar_ship_r1",
      description: "Tracked",
      total_price: "19000",
      currency: "INR",
      min_delivery_date: "2026-11-04 00:00:00 +0000",
      max_delivery_date: "2026-11-05 00:00:00 +0000",
    },
  ],
  outcome: "rates",
  testMode: true,
  durationMs: 14,
  error: null,
  ...overrides,
});

describe("toHistoryItem", () => {
  it("reads a logged checkout and adds up its cart", () => {
    expect(toHistoryItem(row())).toEqual({
      id: "log1",
      createdAt: "2026-11-03T10:00:00.000Z",
      currency: "INR",
      destination: {
        country: "IN",
        province: "KA",
        city: "Bengaluru",
        postcode: "560078",
      },
      lines: [
        { name: "T-shirt", sku: "TS-1", quantity: 2, grams: 200, price: 50000 },
        { name: "Cap", sku: null, quantity: 1, grams: 100, price: 30000 },
      ],
      totals: { subtotal: 130000, weight: 500, quantity: 3 },
      rates: [
        {
          name: "Express",
          description: "Tracked",
          price: 19000,
          minDeliveryDate: "2026-11-04",
          maxDeliveryDate: "2026-11-05",
        },
      ],
      outcome: "rates",
      testMode: true,
      durationMs: 14,
      error: null,
    });
  });

  it("copes with missing or odd JSON instead of failing", () => {
    const item = toHistoryItem(
      row({
        destination: null,
        items: [null, { quantity: "2", price: -5 }],
        rates: "nope",
        outcome: "weird",
      }),
    );
    expect(item.destination).toEqual({
      country: null,
      province: null,
      city: null,
      postcode: null,
    });
    expect(item.lines).toEqual([
      { name: "", sku: null, quantity: 0, grams: 0, price: 0 },
    ]);
    expect(item.totals).toEqual({ subtotal: 0, weight: 0, quantity: 0 });
    expect(item.rates).toEqual([]);
    expect(item.outcome).toBe("error");
  });
});
