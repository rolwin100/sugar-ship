import type { PricingColumns, StoredPricing, ZonePricing } from "../types";

/**
 * A Rate row's pricing columns → the zone's pricing, or null when the columns its
 * mode needs are missing (then the zone is treated as not priced).
 */
export function toZonePricing(row: StoredPricing): ZonePricing | null {
  const { zoneId, basis, price, stepSize, stepPrice, percentBps } = row;
  switch (row.mode) {
    case "FLAT":
      return price === null ? null : { zoneId, mode: "FLAT", price };
    case "BANDS":
      if (basis === null || row.bands.length === 0) return null;
      return {
        zoneId,
        mode: "BANDS",
        basis,
        bands: row.bands.map(({ from, to, price }) => ({ from, to, price })),
      };
    case "INCREMENTAL":
      if (
        basis === null ||
        price === null ||
        stepSize === null ||
        stepPrice === null
      ) {
        return null;
      }
      return {
        zoneId,
        mode: "INCREMENTAL",
        basis,
        basePrice: price,
        stepSize,
        stepPrice,
      };
    case "PERCENT":
      return percentBps === null
        ? null
        : { zoneId, mode: "PERCENT", percentBps };
    default:
      return null;
  }
}

const NO_COLUMNS = {
  basis: null,
  price: null,
  stepSize: null,
  stepPrice: null,
  percentBps: null,
  bands: [],
} satisfies Omit<PricingColumns, "mode">;

/** A zone's pricing → the Rate columns and RateBand rows that store it. Unused columns are null. */
export function toPricingColumns(pricing: ZonePricing): PricingColumns {
  switch (pricing.mode) {
    case "FLAT":
      return { ...NO_COLUMNS, mode: "FLAT", price: pricing.price };
    case "BANDS":
      return {
        ...NO_COLUMNS,
        mode: "BANDS",
        basis: pricing.basis,
        bands: pricing.bands.map(({ from, to, price }, sortOrder) => ({
          from,
          to,
          price,
          sortOrder,
        })),
      };
    case "INCREMENTAL":
      return {
        ...NO_COLUMNS,
        mode: "INCREMENTAL",
        basis: pricing.basis,
        price: pricing.basePrice,
        stepSize: pricing.stepSize,
        stepPrice: pricing.stepPrice,
      };
    case "PERCENT":
      return { ...NO_COLUMNS, mode: "PERCENT", percentBps: pricing.percentBps };
  }
}
