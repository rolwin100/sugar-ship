import type { RateBasis, RateMode } from "../../engine";
import { emptyZonePricingDraft } from "../draft/pricing-draft";
import type { ZonePricingDraft, ZonePricingTextField } from "../types";
import { resetBandLimits } from "./edit-bands";

// Pure helpers for editing zone pricings in the form. Each takes the zoneId → pricing
// record and returns a new one, never changing the original. A zone missing from the
// record starts from the empty draft.

type Prices = Record<string, ZonePricingDraft>;

export function updateZonePricing(
  prices: Prices,
  zoneId: string,
  update: (pricing: ZonePricingDraft) => ZonePricingDraft,
): Prices {
  return {
    ...prices,
    [zoneId]: update(prices[zoneId] ?? emptyZonePricingDraft()),
  };
}

/** Switches the rate on or off for a zone; what was typed is kept for switching back. */
export function replaceZoneOffered(
  prices: Prices,
  zoneId: string,
  offered: boolean,
): Prices {
  return updateZonePricing(prices, zoneId, (p) => ({ ...p, offered }));
}

/** Changes how a zone is priced; each mode keeps its own typed fields. */
export function replaceZoneMode(
  prices: Prices,
  zoneId: string,
  mode: RateMode,
): Prices {
  return updateZonePricing(prices, zoneId, (p) => ({ ...p, mode }));
}

/**
 * Changes what a price table or step pricing is based on. Band limits and the step
 * size are cleared, because they're in the old basis's units (2 kg isn't ₹2); the
 * prices are kept.
 */
export function replaceZoneBasis(
  prices: Prices,
  zoneId: string,
  basis: RateBasis,
): Prices {
  return updateZonePricing(prices, zoneId, (p) =>
    p.basis === basis
      ? p
      : { ...p, basis, bands: resetBandLimits(p.bands), stepSize: "" },
  );
}

/** Types into one of a zone's single-value fields (price, step size, percent…). */
export function replaceZoneField(
  prices: Prices,
  zoneId: string,
  field: ZonePricingTextField,
  text: string,
): Prices {
  return updateZonePricing(prices, zoneId, (p) => ({ ...p, [field]: text }));
}
