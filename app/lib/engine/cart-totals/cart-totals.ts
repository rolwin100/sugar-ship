import type { CartTotals, EngineCart } from "../types";

/**
 * Adds up the cart: subtotal (subunits), weight (grams) and number of items.
 * Lines with a negative or missing quantity count as zero.
 */
export function cartTotals(cart: EngineCart): CartTotals {
  let subtotal = 0;
  let weight = 0;
  let quantity = 0;

  for (const item of cart.items) {
    const units = Math.max(0, item.quantity || 0);
    subtotal += units * Math.max(0, item.price || 0);
    weight += units * Math.max(0, item.grams || 0);
    quantity += units;
  }

  return { subtotal, weight, quantity };
}
