import type { CartTotals, EngineRate, PriceResult } from "../types";

const BPS_PER_WHOLE = 10_000; // 500 basis points = 5%

/** PERCENT: a share of the cart subtotal, rounded to the nearest subunit. */
export function priceByPercent(
  rate: EngineRate,
  totals: CartTotals,
): PriceResult {
  const bps = rate.percentBps;
  if (typeof bps !== "number" || bps < 0) {
    return { ok: false, reason: "PERCENT rate has no percentage" };
  }
  return {
    ok: true,
    price: Math.round((totals.subtotal * bps) / BPS_PER_WHOLE),
  };
}
