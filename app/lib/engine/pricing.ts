import type { EngineCart, EngineRate } from "./types";

export type PriceResult =
  | { ok: true; price: number }
  | { ok: false; reason: string };

/**
 * Base price of one rate for this cart, in subunits.
 * Step 2.2: FLAT only. BANDS, INCREMENTAL and PERCENT arrive in step 2.9;
 * adjustments (handling, caps, rounding, free-over) in step 2.10.
 */
export function priceRate(rate: EngineRate, _cart: EngineCart): PriceResult {
  if (rate.mode === "FLAT") {
    if (typeof rate.price !== "number") {
      return { ok: false, reason: "FLAT rate has no price" };
    }
    return { ok: true, price: rate.price };
  }
  return { ok: false, reason: `${rate.mode} pricing not supported yet` };
}
