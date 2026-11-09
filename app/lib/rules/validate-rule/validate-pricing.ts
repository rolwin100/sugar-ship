import type { BasePricing, PriceAdjustment, ZonePricing } from "../types";
import { PRICING_BASES } from "../types";
import {
  BANDS_MAX,
  CONDITION_VALUE_MAX,
  PERCENT_BPS_MAX,
  PRICE_MAX,
} from "./limits";
import type { RuleError, RuleErrorKey } from "./validate-rule";
import { ADJUSTMENT_KIND, ADJUSTMENT_TYPE, RATE_MODE } from "../../engine";

// Checks one zone's pricing, by mode. Values are in stored units (subunits, grams,
// items, basis points); text the form couldn't read arrives as NaN and fails here.

const isAmount = (value: number, max: number) =>
  Number.isInteger(value) && value >= 0 && value <= max;

/** All problems with one zone's pricing (empty when it's fine). */
export function validatePricing(pricing: ZonePricing): RuleError[] {
  return [
    ...validateBase(pricing),
    ...validateAdjustments(pricing.zoneId, pricing.adjustments),
  ];
}

/** Each adjustment's error, by kind. */
const ADJUSTMENT_ERROR = {
  FREE_OVER: "freeOverInvalid",
  HANDLING_FEE: "handlingFeeInvalid",
  ROUND_TO: "roundToInvalid",
  MIN_PRICE: "minPriceInvalid",
  MAX_PRICE: "maxPriceInvalid",
} as const satisfies Record<PriceAdjustment["kind"], RuleErrorKey>;

/**
 * Problems with a zone's adjustments: each amount must be valid (a percent fee up to
 * 100%), rounding must be above 0, there's at most one of each, and the minimum
 * can't be above the maximum.
 */
function validateAdjustments(
  zoneId: string,
  adjustments: PriceAdjustment[],
): RuleError[] {
  const errors: RuleError[] = [];
  const seen = new Set<string>();
  for (const { kind, type, value } of adjustments) {
    const percent =
      kind === ADJUSTMENT_KIND.HANDLING_FEE && type === ADJUSTMENT_TYPE.PERCENT;
    const valid =
      !seen.has(kind) &&
      (type === ADJUSTMENT_TYPE.FIXED || percent) &&
      isAmount(value, percent ? PERCENT_BPS_MAX : PRICE_MAX) &&
      (kind !== ADJUSTMENT_KIND.ROUND_TO || value > 0);
    seen.add(kind);
    if (!valid) {
      errors.push({ field: "prices", key: ADJUSTMENT_ERROR[kind], zoneId });
    }
  }

  const min = adjustments.find((a) => a.kind === ADJUSTMENT_KIND.MIN_PRICE);
  const max = adjustments.find((a) => a.kind === ADJUSTMENT_KIND.MAX_PRICE);
  if (min && max && errors.length === 0 && min.value > max.value) {
    errors.push({ field: "prices", key: "minAboveMax", zoneId });
  }
  return errors;
}

/** Problems with how the base price is worked out, by mode. */
function validateBase(pricing: BasePricing): RuleError[] {
  const { zoneId } = pricing;
  const error = (key: RuleErrorKey, bandIndex?: number): RuleError => ({
    field: "prices",
    key,
    zoneId,
    ...(bandIndex === undefined ? {} : { bandIndex }),
  });

  switch (pricing.mode) {
    case RATE_MODE.FLAT:
      return isAmount(pricing.price, PRICE_MAX) ? [] : [error("priceInvalid")];

    case RATE_MODE.BANDS: {
      if (!PRICING_BASES.includes(pricing.basis)) {
        return [error("pricingBasisInvalid")];
      }
      const { bands } = pricing;
      if (bands.length === 0) return [error("bandsRequired")];
      if (bands.length > BANDS_MAX) return [error("tooManyBands")];

      const errors: RuleError[] = [];
      bands.forEach((band, i) => {
        const isLast = i === bands.length - 1;
        const validTo =
          band.to === null || isAmount(band.to, CONDITION_VALUE_MAX);

        if (!isAmount(band.from, CONDITION_VALUE_MAX) || !validTo) {
          errors.push(error("bandRangeInvalid", i));
        } else if (band.to !== null && band.to <= band.from) {
          errors.push(error("bandRangeInvalid", i));
        } else if (band.to === null && !isLast) {
          errors.push(error("bandOpenNotLast", i));
        } else if (i === 0 && band.from !== 0) {
          errors.push(error("bandsStartAtZero", i));
        } else if (i > 0 && band.from !== bands[i - 1].to) {
          // No gaps or overlaps: each row starts exactly where the previous one ends.
          errors.push(error("bandNotContinuous", i));
        }

        if (!isAmount(band.price, PRICE_MAX)) {
          errors.push(error("bandPriceInvalid", i));
        }
      });
      return errors;
    }

    case RATE_MODE.INCREMENTAL: {
      if (!PRICING_BASES.includes(pricing.basis)) {
        return [error("pricingBasisInvalid")];
      }
      const errors: RuleError[] = [];
      if (!isAmount(pricing.basePrice, PRICE_MAX)) {
        errors.push(error("basePriceInvalid"));
      }
      if (
        !isAmount(pricing.stepSize, CONDITION_VALUE_MAX) ||
        pricing.stepSize === 0
      ) {
        errors.push(error("stepSizeInvalid"));
      }
      if (!isAmount(pricing.stepPrice, PRICE_MAX)) {
        errors.push(error("stepPriceInvalid"));
      }
      return errors;
    }

    case RATE_MODE.PERCENT:
      return isAmount(pricing.percentBps, PERCENT_BPS_MAX) &&
        pricing.percentBps > 0
        ? []
        : [error("percentInvalid")];
  }
}
