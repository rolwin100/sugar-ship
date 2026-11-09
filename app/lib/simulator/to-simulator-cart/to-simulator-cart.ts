import type { EngineCart } from "../../engine";
import { toSubunits } from "../../money";
import { kgToGrams } from "../../weight";
import type { SimulatorDraft, SimulatorError } from "../types";

export type SimulatorCartResult =
  | { ok: true; cart: EngineCart }
  | { ok: false; errors: SimulatorError[] };

/** "3" → 3; anything that isn't a whole number of at least 1 → 0. */
const toQuantity = (text: string) =>
  /^\d+$/.test(text.trim()) ? Number(text.trim()) : 0;

/**
 * The simulator form → an engine cart, or the fields to fix.
 *
 * With products (lines), each line becomes an item with its own price, weight, SKU and
 * vendor; product conditions can then check them (tags, type and collections are added
 * on the server). Without, the typed totals are used: empty weight means 0 kg, subtotal
 * and quantity are required, and the cart is one line carrying the subtotal and weight
 * plus free, weightless units to make up the item count.
 */
export function toSimulatorCart(
  draft: SimulatorDraft,
  currency: string,
): SimulatorCartResult {
  const errors: SimulatorError[] = [];

  const country = draft.country.trim().toUpperCase();
  if (!country) errors.push({ field: "country", key: "countryRequired" });
  const destination = {
    country,
    province: draft.province.trim() || null,
    postcode: draft.postcode.trim() || null,
  };

  if (draft.lines.length > 0) {
    draft.lines.forEach((line, index) => {
      if (toQuantity(line.quantity) < 1) {
        errors.push({
          field: "lines",
          key: "lineQuantityInvalid",
          line: index,
        });
      }
    });
    if (errors.length > 0) return { ok: false, errors };
    return {
      ok: true,
      cart: {
        currency,
        destination,
        items: draft.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          name: line.title,
          sku: line.sku,
          vendor: line.vendor,
          quantity: toQuantity(line.quantity),
          grams: line.grams,
          price: line.price,
        })),
      },
    };
  }

  const subtotal = toSubunits(draft.subtotal, currency);
  if (subtotal === null || Number.isNaN(subtotal)) {
    errors.push({ field: "subtotal", key: "subtotalInvalid" });
  }

  const weight = kgToGrams(draft.weight) ?? 0;
  if (Number.isNaN(weight)) {
    errors.push({ field: "weight", key: "weightInvalid" });
  }

  const quantity = toQuantity(draft.quantity);
  if (quantity < 1) errors.push({ field: "quantity", key: "quantityInvalid" });

  if (errors.length > 0 || subtotal === null) return { ok: false, errors };

  return {
    ok: true,
    cart: {
      currency,
      destination,
      items: [
        { quantity: 1, grams: weight, price: subtotal },
        ...(quantity > 1
          ? [{ quantity: quantity - 1, grams: 0, price: 0 }]
          : []),
      ],
    },
  };
}
