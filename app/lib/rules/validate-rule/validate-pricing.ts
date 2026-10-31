import type { ZonePricing } from "../types";
import { PRICING_BASES } from "../types";
import {
  BANDS_MAX,
  CONDITION_VALUE_MAX,
  PERCENT_BPS_MAX,
  PRICE_MAX,
} from "./limits";
import type { RuleError, RuleErrorKey } from "./validate-rule";

// Checks one zone's pricing, by mode. Values are in stored units (subunits, grams,
// items, basis points); text the form couldn't read arrives as NaN and fails here.

const isAmount = (value: number, max: number) =>
  Number.isInteger(value) && value >= 0 && value <= max;

/** All problems with one zone's pricing (empty when it's fine). */
export function validatePricing(pricing: ZonePricing): RuleError[] {
  const { zoneId } = pricing;
  const error = (key: RuleErrorKey, bandIndex?: number): RuleError => ({
    field: "prices",
    key,
    zoneId,
    ...(bandIndex === undefined ? {} : { bandIndex }),
  });

  switch (pricing.mode) {
    case "FLAT":
      return isAmount(pricing.price, PRICE_MAX) ? [] : [error("priceInvalid")];

    case "BANDS": {
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

    case "INCREMENTAL": {
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

    case "PERCENT":
      return isAmount(pricing.percentBps, PERCENT_BPS_MAX) &&
        pricing.percentBps > 0
        ? []
        : [error("percentInvalid")];
  }
}
