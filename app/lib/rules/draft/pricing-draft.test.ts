import { describe, expect, it } from "vitest";
import type { ZonePricing } from "../types";
import {
  bpsToPercent,
  draftToPricing,
  emptyZonePricingDraft,
  isZonePricingDraft,
  percentToBps,
  pricingToDraft,
} from "./pricing-draft";

const roundTrip = (pricing: ZonePricing, currency = "INR") =>
  draftToPricing(pricing.zoneId, pricingToDraft(pricing, currency), currency);

describe("zone pricing drafts", () => {
  it("starts a zone as not offered, flat by weight, with one band from 0", () => {
    expect(emptyZonePricingDraft()).toMatchObject({
      offered: false,
      mode: "FLAT",
      basis: "WEIGHT",
      bands: [{ from: "0", to: "", price: "" }],
    });
  });

  it("starts with no adjustments and a fixed handling fee", () => {
    expect(emptyZonePricingDraft().adjustments).toEqual({
      freeOver: "",
      handlingFee: "",
      handlingType: "FIXED",
      roundTo: "",
      minPrice: "",
      maxPrice: "",
    });
  });

  it("round-trips every mode through the form", () => {
    const pricings: ZonePricing[] = [
      { zoneId: "z", mode: "FLAT", price: 8000 },
      {
        zoneId: "z",
        mode: "BANDS",
        basis: "WEIGHT",
        bands: [
          { from: 0, to: 1000, price: 6000 },
          { from: 1000, to: null, price: 12000 },
        ],
      },
      {
        zoneId: "z",
        mode: "INCREMENTAL",
        basis: "WEIGHT",
        basePrice: 5000,
        stepSize: 500,
        stepPrice: 2000,
      },
      { zoneId: "z", mode: "PERCENT", percentBps: 250 },
    ];
    for (const pricing of pricings) {
      expect(roundTrip(pricing)).toEqual(pricing);
    }
  });

  it("shows amounts in the merchant's units for each basis", () => {
    const bands = (basis: "WEIGHT" | "SUBTOTAL" | "QUANTITY", from: number) =>
      pricingToDraft(
        {
          zoneId: "z",
          mode: "BANDS",
          basis,
          bands: [{ from, to: null, price: 6000 }],
        },
        "INR",
      ).bands[0];

    expect(bands("WEIGHT", 1500)).toEqual({
      from: "1.5",
      to: "",
      price: "60.00",
    });
    expect(bands("SUBTOTAL", 100000).from).toBe("1000.00");
    expect(bands("QUANTITY", 10).from).toBe("10");

    const steps = pricingToDraft(
      {
        zoneId: "z",
        mode: "INCREMENTAL",
        basis: "WEIGHT",
        basePrice: 5000,
        stepSize: 500,
        stepPrice: 2000,
      },
      "INR",
    );
    expect(steps).toMatchObject({
      basePrice: "50.00",
      stepSize: "0.5",
      stepPrice: "20.00",
    });
  });

  it("returns nothing for a zone that isn't offered", () => {
    expect(draftToPricing("z", emptyZonePricingDraft(), "INR")).toBeNull();
  });

  it("marks empty or unreadable text as NaN in the chosen mode only", () => {
    const draft = {
      ...emptyZonePricingDraft(),
      offered: true,
      mode: "INCREMENTAL" as const,
      basePrice: "50",
      stepSize: "",
      stepPrice: "abc",
      price: "not read in this mode",
    };
    expect(draftToPricing("z", draft, "INR")).toEqual({
      zoneId: "z",
      mode: "INCREMENTAL",
      basis: "WEIGHT",
      basePrice: 5000,
      stepSize: Number.NaN,
      stepPrice: Number.NaN,
    });

    const bands = draftToPricing(
      "z",
      {
        ...emptyZonePricingDraft(),
        offered: true,
        mode: "BANDS",
        basis: "QUANTITY",
        bands: [{ from: "1.5", to: "", price: "" }],
      },
      "INR",
    );
    expect(bands).toEqual({
      zoneId: "z",
      mode: "BANDS",
      basis: "QUANTITY",
      bands: [{ from: Number.NaN, to: null, price: Number.NaN }],
    });
  });

  it("converts percentages to basis points and back", () => {
    expect(percentToBps("5")).toBe(500);
    expect(percentToBps("2.5")).toBe(250);
    expect(percentToBps("0.05")).toBe(5);
    expect(percentToBps("")).toBeNull();
    expect(percentToBps("2.555")).toBeNaN();
    expect(percentToBps("-1")).toBeNaN();
    expect(bpsToPercent(500)).toBe("5");
    expect(bpsToPercent(250)).toBe("2.5");
  });

  it("checks the shape of a posted zone pricing", () => {
    const ok = emptyZonePricingDraft();
    expect(isZonePricingDraft(ok)).toBe(true);
    expect(isZonePricingDraft({ ...ok, mode: "TELEPORT" })).toBe(false);
    expect(isZonePricingDraft({ ...ok, basis: "VOLUME" })).toBe(false);
    expect(isZonePricingDraft({ ...ok, offered: "yes" })).toBe(false);
    expect(isZonePricingDraft({ ...ok, price: 80 })).toBe(false);
    expect(
      isZonePricingDraft({ ...ok, bands: [{ from: 0, to: "", price: "" }] }),
    ).toBe(false);
    expect(isZonePricingDraft("80")).toBe(false);
  });
});
