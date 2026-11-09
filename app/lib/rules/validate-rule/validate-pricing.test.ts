import { describe, expect, it } from "vitest";
import type { PriceAdjustments, PriceBand, ZonePricing } from "../types";
import { BANDS_MAX } from "./limits";
import { validatePricing } from "./validate-pricing";
import { NO_ADJUSTMENTS } from "../../engine";

const keys = (pricing: ZonePricing) =>
  validatePricing(pricing).map((e) =>
    e.bandIndex === undefined ? e.key : `${e.key}@${e.bandIndex}`,
  );

const bands = (rows: PriceBand[]): ZonePricing => ({
  zoneId: "z",
  adjustments: NO_ADJUSTMENTS,
  mode: "BANDS",
  basis: "WEIGHT",
  bands: rows,
});

// 0–1 kg ₹60 · 1–5 kg ₹120 · 5 kg+ ₹250
const good: PriceBand[] = [
  { from: 0, to: 1000, price: 6000 },
  { from: 1000, to: 5000, price: 12000 },
  { from: 5000, to: null, price: 25000 },
];

describe("validatePricing", () => {
  it("checks flat prices", () => {
    expect(
      keys({
        zoneId: "z",
        adjustments: NO_ADJUSTMENTS,
        mode: "FLAT",
        price: 0,
      }),
    ).toEqual([]);
    expect(
      keys({
        zoneId: "z",
        adjustments: NO_ADJUSTMENTS,
        mode: "FLAT",
        price: Number.NaN,
      }),
    ).toEqual(["priceInvalid"]);
    expect(
      keys({
        zoneId: "z",
        adjustments: NO_ADJUSTMENTS,
        mode: "FLAT",
        price: -1,
      }),
    ).toEqual(["priceInvalid"]);
  });

  it("accepts a continuous price table starting at 0", () => {
    expect(keys(bands(good))).toEqual([]);
    // Ending without an open last band is allowed (bigger carts get no rate here).
    expect(keys(bands(good.slice(0, 2)))).toEqual([]);
  });

  it("needs 1 to 20 bands and a known basis", () => {
    expect(keys(bands([]))).toEqual(["bandsRequired"]);
    const many = Array.from({ length: BANDS_MAX + 1 }, (_, i) => ({
      from: i,
      to: i + 1,
      price: 100,
    }));
    expect(keys(bands(many))).toEqual(["tooManyBands"]);
    expect(
      keys({ ...bands(good), basis: "VOLUME" as never } as ZonePricing),
    ).toEqual(["pricingBasisInvalid"]);
  });

  it("requires the first band to start at 0", () => {
    expect(keys(bands([{ from: 500, to: null, price: 6000 }]))).toEqual([
      "bandsStartAtZero@0",
    ]);
  });

  it("finds gaps and overlaps between bands", () => {
    const gap = [good[0], { ...good[1], from: 1200 }, good[2]];
    expect(keys(bands(gap))).toEqual(["bandNotContinuous@1"]);

    const overlap = [good[0], { ...good[1], from: 800 }, good[2]];
    expect(keys(bands(overlap))).toEqual(["bandNotContinuous@1"]);
  });

  it("only lets the last band be open-ended", () => {
    const openMiddle = [good[0], { ...good[1], to: null }, good[2]];
    expect(keys(bands(openMiddle))).toEqual([
      "bandOpenNotLast@1",
      // band 3 then can't follow an open band
      "bandNotContinuous@2",
    ]);
  });

  it("flags bad ranges and prices by band", () => {
    expect(
      keys(
        bands([
          { from: 0, to: 0, price: 6000 }, // to must be above from
          { from: Number.NaN, to: null, price: Number.NaN },
        ]),
      ),
    ).toEqual([
      "bandRangeInvalid@0",
      "bandRangeInvalid@1",
      "bandPriceInvalid@1",
    ]);
  });

  it("checks incremental pricing", () => {
    const steps: ZonePricing = {
      zoneId: "z",
      adjustments: NO_ADJUSTMENTS,
      mode: "INCREMENTAL",
      basis: "WEIGHT",
      basePrice: 5000,
      stepSize: 500,
      stepPrice: 2000,
    };
    expect(keys(steps)).toEqual([]);
    expect(keys({ ...steps, basePrice: 0, stepPrice: 0 })).toEqual([]);
    expect(keys({ ...steps, stepSize: 0 })).toEqual(["stepSizeInvalid"]);
    expect(
      keys({
        ...steps,
        basePrice: Number.NaN,
        stepSize: Number.NaN,
        stepPrice: -1,
      }),
    ).toEqual(["basePriceInvalid", "stepSizeInvalid", "stepPriceInvalid"]);
  });

  it("checks percentages: above 0, up to 100%", () => {
    const percent = (bps: number): ZonePricing => ({
      zoneId: "z",
      adjustments: NO_ADJUSTMENTS,
      mode: "PERCENT",
      percentBps: bps,
    });
    expect(keys(percent(500))).toEqual([]);
    expect(keys(percent(10_000))).toEqual([]);
    expect(keys(percent(1))).toEqual([]);
    expect(keys(percent(0))).toEqual(["percentInvalid"]);
    expect(keys(percent(10_001))).toEqual(["percentInvalid"]);
    expect(keys(percent(Number.NaN))).toEqual(["percentInvalid"]);
  });

  it("names the zone on every error", () => {
    const [error] = validatePricing({
      zoneId: "intl",
      adjustments: NO_ADJUSTMENTS,
      mode: "FLAT",
      price: -1,
    });
    expect(error).toEqual({
      field: "prices",
      key: "priceInvalid",
      zoneId: "intl",
    });
  });

  describe("adjustments", () => {
    const withAdjustments = (
      adjustments: Partial<PriceAdjustments>,
    ): ZonePricing => ({
      zoneId: "z",
      mode: "FLAT",
      price: 8000,
      adjustments: { ...NO_ADJUSTMENTS, ...adjustments },
    });

    it("accepts valid adjustments", () => {
      expect(
        keys(
          withAdjustments({
            freeOver: 100000,
            handlingFee: { type: "PERCENT", value: 10_000 },
            roundTo: 1000,
            minPrice: 5000,
            maxPrice: 5000,
          }),
        ),
      ).toEqual([]);
    });

    it("points at each unreadable amount, in the order they apply", () => {
      expect(
        keys(
          withAdjustments({
            maxPrice: Number.NaN,
            freeOver: Number.NaN,
            handlingFee: { type: "FIXED", value: -1 },
            minPrice: Number.NaN,
          }),
        ),
      ).toEqual([
        "freeOverInvalid",
        "handlingFeeInvalid",
        "minPriceInvalid",
        "maxPriceInvalid",
      ]);
    });

    it("needs rounding above 0 and a percent fee up to 100%", () => {
      expect(keys(withAdjustments({ roundTo: 0 }))).toEqual(["roundToInvalid"]);
      expect(
        keys(
          withAdjustments({ handlingFee: { type: "PERCENT", value: 10_001 } }),
        ),
      ).toEqual(["handlingFeeInvalid"]);
    });

    it("stops a minimum above the maximum", () => {
      expect(keys(withAdjustments({ minPrice: 9000, maxPrice: 5000 }))).toEqual(
        ["minAboveMax"],
      );
    });
  });
});
