import type { EngineCart } from "../../engine";
import { toSubunits } from "../../money";
import { kgToGrams } from "../../weight";
import type { SimulatorDraft, SimulatorError } from "../types";

export type SimulatorCartResult =
  | { ok: true; cart: EngineCart }
  | { ok: false; errors: SimulatorError[] };

/**
 * The simulator form → an engine cart, or the fields to fix. Empty weight means 0 kg;
 * subtotal and quantity are required. Conditions and pricing only read the cart's
 * totals, so the cart is one line carrying the subtotal and weight, plus free,
 * weightless units to make up the item count.
 */
export function toSimulatorCart(
  draft: SimulatorDraft,
  currency: string,
): SimulatorCartResult {
  const errors: SimulatorError[] = [];

  const country = draft.country.trim().toUpperCase();
  if (!country) errors.push({ field: "country", key: "countryRequired" });

  const subtotal = toSubunits(draft.subtotal, currency);
  if (subtotal === null || Number.isNaN(subtotal)) {
    errors.push({ field: "subtotal", key: "subtotalInvalid" });
  }

  const weight = kgToGrams(draft.weight) ?? 0;
  if (Number.isNaN(weight)) {
    errors.push({ field: "weight", key: "weightInvalid" });
  }

  const quantityText = draft.quantity.trim();
  const quantity = /^\d+$/.test(quantityText) ? Number(quantityText) : 0;
  if (quantity < 1) errors.push({ field: "quantity", key: "quantityInvalid" });

  if (errors.length > 0 || subtotal === null) return { ok: false, errors };

  return {
    ok: true,
    cart: {
      currency,
      destination: {
        country,
        province: draft.province.trim() || null,
        postcode: draft.postcode.trim() || null,
      },
      items: [
        { quantity: 1, grams: weight, price: subtotal },
        ...(quantity > 1
          ? [{ quantity: quantity - 1, grams: 0, price: 0 }]
          : []),
      ],
    },
  };
}
