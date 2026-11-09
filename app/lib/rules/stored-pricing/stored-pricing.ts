import type {
  AdjustmentColumns,
  BasePricing,
  PriceAdjustments,
  PricingColumns,
  StoredPricing,
  ZonePricing,
} from "../types";
import { NO_ADJUSTMENTS, RATE_MODE } from "../../engine";

/**
 * A rate's RateAdjustment row (or null when it has none) → its adjustments. The
 * handling fee counts only when both its amount and its type are set.
 */
export function toAdjustments(
  columns: AdjustmentColumns | null,
): PriceAdjustments {
  if (!columns) return { ...NO_ADJUSTMENTS };
  const { handlingFee, handlingFeeType } = columns;
  return {
    freeOver: columns.freeOver,
    handlingFee:
      handlingFee !== null && handlingFeeType !== null
        ? { type: handlingFeeType, value: handlingFee }
        : null,
    roundTo: columns.roundTo,
    minPrice: columns.minPrice,
    maxPrice: columns.maxPrice,
  };
}

/** A rate's adjustments → its RateAdjustment row, or null when none are used (no row is saved). */
export function toAdjustmentColumns(
  adjustments: PriceAdjustments,
): AdjustmentColumns | null {
  const { freeOver, handlingFee, roundTo, minPrice, maxPrice } = adjustments;
  const used = [freeOver, handlingFee, roundTo, minPrice, maxPrice].some(
    (value) => value !== null,
  );
  if (!used) return null;
  return {
    freeOver,
    handlingFee: handlingFee?.value ?? null,
    handlingFeeType: handlingFee?.type ?? null,
    roundTo,
    minPrice,
    maxPrice,
  };
}

/**
 * A Rate row's pricing columns and adjustments row → the zone's pricing, or null when the
 * columns its mode needs are missing (then the zone is treated as not priced).
 */
export function toZonePricing(row: StoredPricing): ZonePricing | null {
  const base = toBasePricing(row);
  return base
    ? {
        ...base,
        adjustments: toAdjustments(row.adjustments),
      }
    : null;
}

function toBasePricing(row: StoredPricing): BasePricing | null {
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
} satisfies Omit<PricingColumns, "mode" | "adjustments">;

/**
 * A zone's pricing → the Rate columns, RateBand rows and RateAdjustment row that
 * store it. Unused columns are null.
 */
export function toPricingColumns(pricing: ZonePricing): PricingColumns {
  return {
    ...baseColumns(pricing),
    adjustments: toAdjustmentColumns(pricing.adjustments),
  };
}

function baseColumns(
  pricing: BasePricing,
): Omit<PricingColumns, "adjustments"> {
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
