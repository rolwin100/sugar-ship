import type { CartTotals, EngineRate, PriceResult } from "../types";
import { basisValue } from "./basis";

/**
 * INCREMENTAL: a base price that covers the first step, then stepPrice for each
 * further step (partial steps round up). "₹50 for the first 500 g, then ₹20 per
 * extra 500 g": 1.2 kg = ₹50 + 2 × ₹20 = ₹90.
 */
export function priceIncrementally(
  rate: EngineRate,
  totals: CartTotals,
): PriceResult {
  const value = basisValue(rate.basis, totals);
  const { price: base, stepSize, stepPrice } = rate;
  if (value === null) {
    return { ok: false, reason: "INCREMENTAL rate has no basis" };
  }
  if (typeof base !== "number" || typeof stepPrice !== "number") {
    return { ok: false, reason: "INCREMENTAL rate is missing a price" };
  }
  if (typeof stepSize !== "number" || stepSize <= 0) {
    return { ok: false, reason: "INCREMENTAL rate has no step size" };
  }

  const extraSteps = Math.ceil(Math.max(0, value - stepSize) / stepSize);
  return { ok: true, price: base + extraSteps * stepPrice };
}
