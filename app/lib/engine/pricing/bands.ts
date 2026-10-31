import type { CartTotals, EngineRate, PriceResult } from "../types";
import { basisName, basisValue } from "./basis";

/**
 * BANDS: a price table on weight, quantity or subtotal. A band covers
 * from ≤ value < to; `to` null means "and above". A cart no band covers gets no
 * price (the zone gets no rate) rather than a guess.
 */
export function priceByBands(
  rate: EngineRate,
  totals: CartTotals,
): PriceResult {
  const value = basisValue(rate.basis, totals);
  if (value === null || !rate.basis) {
    return { ok: false, reason: "BANDS rate has no basis" };
  }
  if (rate.bands.length === 0) {
    return { ok: false, reason: "BANDS rate has no bands" };
  }

  const band = [...rate.bands]
    .sort((a, b) => a.from - b.from)
    .find((b) => value >= b.from && (b.to === null || value < b.to));
  if (!band) {
    return {
      ok: false,
      reason: `no band covers ${basisName(rate.basis)} ${value}`,
    };
  }
  return { ok: true, price: band.price };
}
