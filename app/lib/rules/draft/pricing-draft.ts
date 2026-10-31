import type { RateBasis } from "../../engine";
import { fromSubunits, toSubunits } from "../../money";
import { gramsToKg, kgToGrams } from "../../weight";
import {
  PRICING_BASES,
  PRICING_MODES,
  type PriceBand,
  type PriceBandDraft,
  type ZonePricing,
  type ZonePricingDraft,
} from "../types";

// Converts one zone's pricing between the form (typed text, merchant units) and
// stored values (subunits, grams, items, basis points). Text that can't be read
// becomes NaN, so validation can point at the exact field.

const BPS_PER_PERCENT = 100; // 5% = 500 basis points

/** A zone that isn't offered yet; flat is the default mode when it's switched on. */
export const emptyZonePricingDraft = (): ZonePricingDraft => ({
  offered: false,
  mode: "FLAT",
  basis: "WEIGHT",
  price: "",
  bands: [{ from: "0", to: "", price: "" }],
  basePrice: "",
  stepSize: "",
  stepPrice: "",
  percent: "",
});

/** A saved pricing → the form's text. Fields of other modes stay empty. */
export function pricingToDraft(
  pricing: ZonePricing,
  currency: string,
): ZonePricingDraft {
  const draft = {
    ...emptyZonePricingDraft(),
    offered: true,
    mode: pricing.mode,
  };
  switch (pricing.mode) {
    case "FLAT":
      return { ...draft, price: fromSubunits(pricing.price, currency) };
    case "BANDS":
      return {
        ...draft,
        basis: pricing.basis,
        bands: pricing.bands.map((band) =>
          bandToDraft(band, pricing.basis, currency),
        ),
      };
    case "INCREMENTAL":
      return {
        ...draft,
        basis: pricing.basis,
        basePrice: fromSubunits(pricing.basePrice, currency),
        stepSize: basisToText(pricing.stepSize, pricing.basis, currency),
        stepPrice: fromSubunits(pricing.stepPrice, currency),
      };
    case "PERCENT":
      return { ...draft, percent: bpsToPercent(pricing.percentBps) };
  }
}

/**
 * The form's text → a pricing to validate and save, or null when the zone isn't
 * offered. Only the chosen mode's fields are read.
 */
export function draftToPricing(
  zoneId: string,
  draft: ZonePricingDraft,
  currency: string,
): ZonePricing | null {
  if (!draft.offered) return null;
  const money = (text: string) => toSubunits(text, currency) ?? Number.NaN;

  switch (draft.mode) {
    case "FLAT":
      return { zoneId, mode: "FLAT", price: money(draft.price) };
    case "BANDS":
      return {
        zoneId,
        mode: "BANDS",
        basis: draft.basis,
        bands: draft.bands.map((band) =>
          draftToBand(band, draft.basis, currency),
        ),
      };
    case "INCREMENTAL":
      return {
        zoneId,
        mode: "INCREMENTAL",
        basis: draft.basis,
        basePrice: money(draft.basePrice),
        stepSize:
          textToBasis(draft.stepSize, draft.basis, currency) ?? Number.NaN,
        stepPrice: money(draft.stepPrice),
      };
    case "PERCENT":
      return {
        zoneId,
        mode: "PERCENT",
        percentBps: percentToBps(draft.percent) ?? Number.NaN,
      };
  }
}

function bandToDraft(
  band: PriceBand,
  basis: RateBasis,
  currency: string,
): PriceBandDraft {
  return {
    from: basisToText(band.from, basis, currency),
    to: band.to === null ? "" : basisToText(band.to, basis, currency),
    price: fromSubunits(band.price, currency),
  };
}

/** An empty `to` means "and above". */
function draftToBand(
  band: PriceBandDraft,
  basis: RateBasis,
  currency: string,
): PriceBand {
  const to = textToBasis(band.to, basis, currency);
  return {
    from: textToBasis(band.from, basis, currency) ?? Number.NaN,
    to: to === null ? null : to,
    price: toSubunits(band.price, currency) ?? Number.NaN,
  };
}

/** A stored basis amount → text: grams → kg, subunits → currency, items as is. */
export function basisToText(
  value: number,
  basis: RateBasis,
  currency: string,
): string {
  switch (basis) {
    case "WEIGHT":
      return gramsToKg(value);
    case "SUBTOTAL":
      return fromSubunits(value, currency);
    case "QUANTITY":
      return String(value);
  }
}

/** Typed text → a stored basis amount; null when empty, NaN when invalid. */
export function textToBasis(
  text: string,
  basis: RateBasis,
  currency: string,
): number | null {
  switch (basis) {
    case "WEIGHT":
      return kgToGrams(text);
    case "SUBTOTAL":
      return toSubunits(text, currency);
    case "QUANTITY": {
      const trimmed = text.trim();
      if (trimmed === "") return null;
      return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
    }
  }
}

/** "5" → 500, "2.5" → 250; null when empty, NaN for anything else (max 2 decimals). */
export function percentToBps(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return Number.NaN;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * BPS_PER_PERCENT + Number(fraction.padEnd(2, "0"));
}

/** 500 → "5", 250 → "2.5". */
export function bpsToPercent(bps: number): string {
  return String(bps / BPS_PER_PERCENT);
}

/** Does a posted value look like a ZonePricingDraft? (Shape only; validation checks values.) */
export function isZonePricingDraft(value: unknown): value is ZonePricingDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  const strings = ["price", "basePrice", "stepSize", "stepPrice", "percent"];
  return (
    typeof d.offered === "boolean" &&
    (PRICING_MODES as readonly unknown[]).includes(d.mode) &&
    (PRICING_BASES as readonly unknown[]).includes(d.basis) &&
    strings.every((key) => typeof d[key] === "string") &&
    Array.isArray(d.bands) &&
    d.bands.every(isBandDraft)
  );
}

function isBandDraft(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.from === "string" &&
    typeof b.to === "string" &&
    typeof b.price === "string"
  );
}
