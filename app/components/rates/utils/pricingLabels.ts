import type { RateBasis, RateMode } from "../../../lib/engine";

/** Translation key for each pricing mode. */
export const PRICING_MODE_KEYS = {
  FLAT: "rates.modeFlat",
  BANDS: "rates.modeBands",
  INCREMENTAL: "rates.modeIncremental",
  PERCENT: "rates.modePercent",
} as const satisfies Record<RateMode, string>;

/** Translation key for what a price table or step pricing is based on. */
export const PRICING_BASIS_KEYS = {
  WEIGHT: "rates.basisWeight",
  SUBTOTAL: "rates.basisSubtotal",
  QUANTITY: "rates.basisQuantity",
} as const satisfies Record<RateBasis, string>;
