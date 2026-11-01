import { emptyZonePricingDraft } from "../draft/pricing-draft";
import type { ZonePricingDraft } from "../types";
import { RATE_MODE } from "../../engine";

// Pure helpers for editing zone pricings in the form. Each returns a new record.
// D3 adds mode switching, bands and the other modes' fields.

/**
 * Types a flat price for a zone (today's editor). An empty box means the zone isn't
 * offered, as before; typing switches it on as a flat price.
 */
export function replaceZoneFlatPrice(
  prices: Record<string, ZonePricingDraft>,
  zoneId: string,
  text: string,
): Record<string, ZonePricingDraft> {
  const current = prices[zoneId] ?? emptyZonePricingDraft();
  return {
    ...prices,
    [zoneId]: {
      ...current,
      offered: text.trim() !== "",
      mode: RATE_MODE.FLAT,
      price: text,
    },
  };
}
