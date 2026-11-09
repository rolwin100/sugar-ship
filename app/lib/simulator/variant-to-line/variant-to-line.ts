import { toSubunits } from "../../money";
import { gidToId } from "../../products";
import type { SimulatorLine } from "../types";

/** A product as Shopify's picker returns it (only the fields we use). */
export type PickedProduct = {
  id?: unknown;
  title?: unknown;
  vendor?: unknown;
  variants?: unknown;
};

type PickedVariant = {
  id?: unknown;
  title?: unknown;
  price?: unknown; // "12.00"
  sku?: unknown;
  weight?: unknown;
  weightUnit?: unknown; // KILOGRAMS | GRAMS | POUNDS | OUNCES
};

const GRAMS_PER_UNIT: Record<string, number> = {
  KILOGRAMS: 1000,
  GRAMS: 1,
  POUNDS: 453.59237,
  OUNCES: 28.349523125,
};

/** A variant's weight in whole grams; 0 when it has none or the unit is unknown. */
export function toGrams(weight: unknown, unit: unknown): number {
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) {
    return 0;
  }
  const factor = typeof unit === "string" ? GRAMS_PER_UNIT[unit] : undefined;
  return factor ? Math.round(weight * factor) : 0;
}

const text = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

/**
 * What Shopify's product picker returned → one test-cart line per chosen variant
 * (quantity 1). Variants without valid ids are skipped. The title adds the variant's
 * name unless it's Shopify's "Default Title".
 */
export function pickedToLines(
  products: PickedProduct[],
  currency: string,
): SimulatorLine[] {
  return products.flatMap((product) => {
    const productId = gidToId(product.id, "Product");
    const variants = Array.isArray(product.variants)
      ? (product.variants as PickedVariant[])
      : [];
    if (productId === null) return [];

    return variants.flatMap((variant) => {
      const variantId = gidToId(variant?.id, "ProductVariant");
      if (variantId === null) return [];
      const productTitle = text(product.title) ?? "";
      const variantTitle = text(variant.title);
      const price = toSubunits(String(variant.price ?? ""), currency);
      return [
        {
          productId,
          variantId,
          title:
            variantTitle && variantTitle !== "Default Title"
              ? `${productTitle} · ${variantTitle}`
              : productTitle,
          sku: text(variant.sku),
          vendor: text(product.vendor),
          price: price !== null && !Number.isNaN(price) ? price : 0,
          grams: toGrams(variant.weight, variant.weightUnit),
          quantity: "1",
        },
      ];
    });
  });
}

/** Adds newly picked lines, keeping existing ones (and their quantities) for variants already in the cart. */
export function mergeLines(
  current: SimulatorLine[],
  picked: SimulatorLine[],
): SimulatorLine[] {
  const have = new Set(current.map((line) => line.variantId));
  return [...current, ...picked.filter((line) => !have.has(line.variantId))];
}

/**
 * The test cart's totals from its lines: subtotal in subunits, weight in grams, item
 * count. Lines with a quantity that isn't a whole number count as 0.
 */
export function linesTotals(lines: SimulatorLine[]) {
  return lines.reduce(
    (totals, line) => {
      const quantity = /^\d+$/.test(line.quantity.trim())
        ? Number(line.quantity.trim())
        : 0;
      return {
        subtotal: totals.subtotal + line.price * quantity,
        grams: totals.grams + line.grams * quantity,
        quantity: totals.quantity + quantity,
      };
    },
    { subtotal: 0, grams: 0, quantity: 0 },
  );
}
