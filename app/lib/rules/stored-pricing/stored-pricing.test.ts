import { describe, expect, it } from "vitest";
import type { StoredPricing, ZonePricing } from "../types";
import {
  toAdjustmentColumns,
  toAdjustments,
  toPricingColumns,
  toZonePricing,
} from "./stored-pricing";
import { NO_ADJUSTMENTS } from "../../engine";

const row = (overrides: Partial<StoredPricing> = {}): StoredPricing => ({
  zoneId: "z1",
  adjustments: null,
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
  { zoneId: "z1", adjustments: NO_ADJUSTMENTS, mode: "FLAT", price: 5000 },
  {
    zoneId: "z1",
    adjustments: NO_ADJUSTMENTS,
    mode: "BANDS",
    basis: "WEIGHT",
    bands: [
      { from: 0, to: 1000, price: 5000 },
      { from: 1000, to: null, price: 9000 },
    ],
  },
  {
    zoneId: "z1",
    adjustments: NO_ADJUSTMENTS,
    mode: "INCREMENTAL",
    basis: "QUANTITY",
    basePrice: 4000,
    stepSize: 2,
    stepPrice: 1500,
  },
  {
    zoneId: "z1",
    adjustments: NO_ADJUSTMENTS,
    mode: "PERCENT",
    percentBps: 250,
  },
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
        adjustments: NO_ADJUSTMENTS,
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
      adjustments: null,
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
      adjustments: NO_ADJUSTMENTS,
      mode: "BANDS",
      basis: "SUBTOTAL",
      bands: [{ from: 0, to: null, price: 100 }],
    });
  });

  it("stores used adjustments as one row and reads them back", () => {
    const pricing: ZonePricing = {
      zoneId: "z1",
      mode: "FLAT",
      price: 5000,
      adjustments: {
        ...NO_ADJUSTMENTS,
        freeOver: 100000,
        handlingFee: { type: "PERCENT", value: 500 },
        maxPrice: 30000,
      },
    };
    const { adjustments, ...columns } = toPricingColumns(pricing);
    expect(adjustments).toEqual({
      freeOver: 100000,
      handlingFee: 500,
      handlingFeeType: "PERCENT",
      roundTo: null,
      minPrice: null,
      maxPrice: 30000,
    });
    expect(toZonePricing({ zoneId: "z1", ...columns, adjustments })).toEqual(
      pricing,
    );
  });
});

describe("toAdjustments", () => {
  it("is all null when the rate has no row", () => {
    expect(toAdjustments(null)).toEqual(NO_ADJUSTMENTS);
  });

  it("drops a handling fee without its type", () => {
    expect(
      toAdjustments({
        freeOver: null,
        handlingFee: 1500,
        handlingFeeType: null,
        roundTo: null,
        minPrice: null,
        maxPrice: null,
      }).handlingFee,
    ).toBeNull();
  });
});

describe("toAdjustmentColumns", () => {
  it("is null when nothing is used, so no row is saved", () => {
    expect(toAdjustmentColumns(NO_ADJUSTMENTS)).toBeNull();
  });
});
