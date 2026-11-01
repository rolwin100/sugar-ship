import type { CartTotals, RateBasis } from "../types";
import { CART_CONDITION_FIELD } from "../constants";

const BASIS_TOTAL = {
  WEIGHT: CART_CONDITION_FIELD.WEIGHT,
  QUANTITY: CART_CONDITION_FIELD.QUANTITY,
  SUBTOTAL: CART_CONDITION_FIELD.SUBTOTAL,
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
