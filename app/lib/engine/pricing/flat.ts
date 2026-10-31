import type { EngineRate, PriceResult } from "../types";

/** FLAT: one fixed price. */
export function priceFlat(rate: EngineRate): PriceResult {
  if (typeof rate.price !== "number") {
    return { ok: false, reason: "FLAT rate has no price" };
  }
  return { ok: true, price: rate.price };
}
