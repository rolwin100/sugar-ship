import type { CartTotals, RateBasis } from "../types";

const BASIS_TOTAL = {
  WEIGHT: "weight",
  QUANTITY: "quantity",
  SUBTOTAL: "subtotal",
} as const satisfies Record<RateBasis, keyof CartTotals>;

/** The cart total a rate is priced on (grams, items or subunits), or null if unset. */
export function basisValue(
  basis: RateBasis | null | undefined,
  totals: CartTotals,
): number | null {
  return basis ? totals[BASIS_TOTAL[basis]] : null;
}

/** "weight", "quantity" or "subtotal", for trace messages. */
export function basisName(basis: RateBasis): string {
  return BASIS_TOTAL[basis];
}
