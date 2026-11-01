import type { PricingColumns, StoredPricing, ZonePricing } from "../types";
import { RATE_MODE } from "../../engine";

/**
 * A Rate row's pricing columns → the zone's pricing, or null when the columns its
 * mode needs are missing (then the zone is treated as not priced).
 */
export function toZonePricing(row: StoredPricing): ZonePricing | null {
  const { zoneId, basis, price, stepSize, stepPrice, percentBps } = row;
  switch (row.mode) {
    case RATE_MODE.FLAT:
      return price === null ? null : { zoneId, mode: RATE_MODE.FLAT, price };
    case RATE_MODE.BANDS:
      if (basis === null || row.bands.length === 0) return null;
      return {
        zoneId,
        mode: RATE_MODE.BANDS,
        basis,
        bands: row.bands.map(({ from, to, price }) => ({ from, to, price })),
      };
    case RATE_MODE.INCREMENTAL:
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
        mode: RATE_MODE.INCREMENTAL,
        basis,
        basePrice: price,
        stepSize,
        stepPrice,
      };
    case RATE_MODE.PERCENT:
      return percentBps === null
        ? null
        : { zoneId, mode: RATE_MODE.PERCENT, percentBps };
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
    case RATE_MODE.FLAT:
      return { ...NO_COLUMNS, mode: RATE_MODE.FLAT, price: pricing.price };
    case RATE_MODE.BANDS:
      return {
        ...NO_COLUMNS,
        mode: RATE_MODE.BANDS,
        basis: pricing.basis,
        bands: pricing.bands.map(({ from, to, price }, sortOrder) => ({
          from,
          to,
          price,
          sortOrder,
        })),
      };
    case RATE_MODE.INCREMENTAL:
      return {
        ...NO_COLUMNS,
        mode: RATE_MODE.INCREMENTAL,
        basis: pricing.basis,
        price: pricing.basePrice,
        stepSize: pricing.stepSize,
        stepPrice: pricing.stepPrice,
      };
    case RATE_MODE.PERCENT:
      return {
        ...NO_COLUMNS,
        mode: RATE_MODE.PERCENT,
        percentBps: pricing.percentBps,
      };
  }
}
