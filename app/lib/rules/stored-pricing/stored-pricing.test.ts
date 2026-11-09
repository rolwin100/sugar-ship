import { describe, expect, it } from "vitest";
import type { StoredPricing, ZonePricing } from "../types";
import { toPricingColumns, toZonePricing } from "./stored-pricing";

const row = (overrides: Partial<StoredPricing> = {}): StoredPricing => ({
  zoneId: "z1",
  adjustments: [],
  mode: "FLAT",
  basis: null,
  price: 5000,
  stepSize: null,
  stepPrice: null,
  percentBps: null,
  bands: [],
  ...overrides,
});

const pricings: ZonePricing[] = [
  { zoneId: "z1", adjustments: [], mode: "FLAT", price: 5000 },
  {
    zoneId: "z1",
    adjustments: [],
    mode: "BANDS",
    basis: "WEIGHT",
    bands: [
      { from: 0, to: 1000, price: 5000 },
      { from: 1000, to: null, price: 9000 },
    ],
  },
  {
    zoneId: "z1",
    adjustments: [],
    mode: "INCREMENTAL",
    basis: "QUANTITY",
    basePrice: 4000,
    stepSize: 2,
    stepPrice: 1500,
  },
  { zoneId: "z1", adjustments: [], mode: "PERCENT", percentBps: 250 },
];

describe("toPricingColumns / toZonePricing", () => {
  it.each(pricings)("round-trips $mode", (pricing) => {
    const { bands, adjustments, ...columns } = toPricingColumns(pricing);
    expect(
      toZonePricing({ zoneId: "z1", ...columns, bands, adjustments }),
    ).toEqual(pricing);
  });

  it("leaves columns other modes use empty", () => {
    expect(
      toPricingColumns({
        zoneId: "z1",
        adjustments: [],
        mode: "PERCENT",
        percentBps: 250,
      }),
    ).toEqual({
      mode: "PERCENT",
      basis: null,
      price: null,
      stepSize: null,
      stepPrice: null,
      percentBps: 250,
      bands: [],
      adjustments: [],
    });
  });

  it("numbers bands in order", () => {
    const { bands } = toPricingColumns(pricings[1]);
    expect(bands.map((b) => b.sortOrder)).toEqual([0, 1]);
  });
});

describe("toZonePricing", () => {
  it("returns null when a mode's columns are missing", () => {
    expect(toZonePricing(row({ price: null }))).toBeNull();
    expect(toZonePricing(row({ mode: "BANDS", basis: "WEIGHT" }))).toBeNull();
    expect(
      toZonePricing(
        row({ mode: "BANDS", bands: [{ from: 0, to: null, price: 1 }] }),
      ),
    ).toBeNull();
    expect(
      toZonePricing(row({ mode: "INCREMENTAL", basis: "WEIGHT" })),
    ).toBeNull();
    expect(toZonePricing(row({ mode: "PERCENT" }))).toBeNull();
  });

  it("drops extra band columns", () => {
    const band = { from: 0, to: null, price: 100, id: "b1", sortOrder: 0 };
    expect(
      toZonePricing(row({ mode: "BANDS", basis: "SUBTOTAL", bands: [band] })),
    ).toEqual({
      zoneId: "z1",
      adjustments: [],
      mode: "BANDS",
      basis: "SUBTOTAL",
      bands: [{ from: 0, to: null, price: 100 }],
    });
  });

  it("round-trips adjustments as numbered rows", () => {
    const pricing: ZonePricing = {
      zoneId: "z1",
      mode: "FLAT",
      price: 5000,
      adjustments: [
        { kind: "FREE_OVER", type: "FIXED", value: 100000 },
        { kind: "MAX_PRICE", type: "FIXED", value: 30000 },
      ],
    };
    const { adjustments, ...columns } = toPricingColumns(pricing);
    expect(adjustments.map((a) => a.sortOrder)).toEqual([0, 1]);
    const stored = adjustments.map((a) => ({ ...a, id: "a", rateId: "r" }));
    expect(
      toZonePricing({ zoneId: "z1", ...columns, adjustments: stored }),
    ).toEqual(pricing);
  });
});
