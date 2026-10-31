import type { CartTotals, EngineRate, PriceResult } from "../types";
import { priceByBands } from "./bands";
import { priceFlat } from "./flat";
import { priceIncrementally } from "./incremental";
import { priceByPercent } from "./percent";

/**
 * Base price of one zone's rate for this cart, in subunits, using the rate's mode.
 * Adjustments (handling fee, caps, rounding, free over) come later (step 2.10).
 */
export function priceRate(rate: EngineRate, totals: CartTotals): PriceResult {
  const result = priceByMode(rate, totals);
  // Guard against broken settings producing a price checkout can't use.
  if (result.ok && (!Number.isSafeInteger(result.price) || result.price < 0)) {
    return { ok: false, reason: `${rate.mode} rate gave an invalid price` };
  }
  return result;
}

function priceByMode(rate: EngineRate, totals: CartTotals): PriceResult {
  switch (rate.mode) {
    case "FLAT":
      return priceFlat(rate);
    case "BANDS":
      return priceByBands(rate, totals);
    case "INCREMENTAL":
      return priceIncrementally(rate, totals);
    case "PERCENT":
      return priceByPercent(rate, totals);
  }
}
