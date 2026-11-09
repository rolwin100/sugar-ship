import type { CartConditionField } from "../../engine";
import { RULE_MATCHES, type RuleInput } from "../types";
import {
  CHECKOUT_NAME_MAX,
  CONDITIONS_MAX,
  DELIVERY_DAYS_MAX,
  DESCRIPTION_MAX,
  RULE_NAME_MAX,
} from "./limits";
import { validateCondition } from "./validate-condition";
import { validatePricing } from "./validate-pricing";

/** Each key maps to a `rates.error<Key>` translation. */
export type RuleErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "customNameRequired"
  | "customNameTooLong"
  | "descriptionTooLong"
  | "daysInvalid"
  | "daysOrder"
  | "pricesRequired"
  | "priceInvalid"
  | "zoneUnknown"
  | "zoneDuplicate"
  | "matchInvalid"
  | "tooManyConditions"
  | "conditionUnsupported"
  | "conditionValueInvalid"
  | "productValueRequired"
  | "tooManyProductValues"
  | "productValueTooLong"
  | "pricingBasisInvalid"
  | "bandsRequired"
  | "tooManyBands"
  | "bandsStartAtZero"
  | "bandNotContinuous"
  | "bandOpenNotLast"
  | "bandRangeInvalid"
  | "bandPriceInvalid"
  | "basePriceInvalid"
  | "stepSizeInvalid"
  | "stepPriceInvalid"
  | "percentInvalid"
  | "freeOverInvalid"
  | "handlingFeeInvalid"
  | "roundToInvalid"
  | "minPriceInvalid"
  | "maxPriceInvalid"
  | "minAboveMax";

export type RuleError = {
  field:
    | "name"
    | "customName"
    | "description"
    | "days"
    | "prices"
    | "conditions";
  key: RuleErrorKey;
  zoneId?: string; // for price errors
  bandIndex?: number; // for band errors: row in the zone's price table, from 0
  index?: number; // for condition errors: position in the list, from 0
  conditionField?: CartConditionField; // for conditionValueInvalid: which unit to ask for
};

export type RuleValidation =
  | { ok: true; rule: RuleInput }
  | { ok: false; errors: RuleError[] };

export {
  BANDS_MAX,
  CHECKOUT_NAME_MAX,
  CONDITION_VALUE_MAX,
  CONDITIONS_MAX,
  DELIVERY_DAYS_MAX,
  DESCRIPTION_MAX,
  PERCENT_BPS_MAX,
  PRICE_MAX,
  PRODUCT_VALUE_LENGTH_MAX,
  PRODUCT_VALUES_MAX,
  RULE_NAME_MAX,
} from "./limits";

/**
 * Checks a rule before saving and returns a cleaned copy (trimmed names).
 * `zoneIds` = the shop's zones, so a price can't point at another shop's zone.
 */
export function validateRule(
  input: RuleInput,
  zoneIds: Set<string>,
): RuleValidation {
  const errors: RuleError[] = [];

  const name = input.name.trim();
  if (!name) errors.push({ field: "name", key: "nameRequired" });
  else if (name.length > RULE_NAME_MAX)
    errors.push({ field: "name", key: "nameTooLong" });

  const customName = input.preset === null ? input.customName.trim() : "";
  if (input.preset === null) {
    if (!customName)
      errors.push({ field: "customName", key: "customNameRequired" });
    else if (customName.length > CHECKOUT_NAME_MAX) {
      errors.push({ field: "customName", key: "customNameTooLong" });
    }
  }

  // Optional; an empty description shows nothing under the name.
  const description = input.description.trim();
  if (description.length > DESCRIPTION_MAX) {
    errors.push({ field: "description", key: "descriptionTooLong" });
  }

  const { minDeliveryDays: min, maxDeliveryDays: max } = input;
  const validDays = (d: number | null) =>
    d === null || (Number.isInteger(d) && d >= 0 && d <= DELIVERY_DAYS_MAX);
  if (!validDays(min) || !validDays(max)) {
    errors.push({ field: "days", key: "daysInvalid" });
  } else if (min !== null && max !== null && min > max) {
    errors.push({ field: "days", key: "daysOrder" });
  }

  if (input.prices.length === 0)
    errors.push({ field: "prices", key: "pricesRequired" });
  const seen = new Set<string>();
  for (const pricing of input.prices) {
    const { zoneId } = pricing;
    if (!zoneIds.has(zoneId)) {
      errors.push({ field: "prices", key: "zoneUnknown", zoneId });
    } else if (seen.has(zoneId)) {
      errors.push({ field: "prices", key: "zoneDuplicate", zoneId });
    } else {
      errors.push(...validatePricing(pricing));
    }
    seen.add(zoneId);
  }

  if (!RULE_MATCHES.includes(input.match)) {
    errors.push({ field: "conditions", key: "matchInvalid" });
  }
  if (input.conditions.length > CONDITIONS_MAX) {
    errors.push({ field: "conditions", key: "tooManyConditions" });
  }
  input.conditions.forEach((condition, index) => {
    errors.push(...validateCondition(condition, index));
  });

  return errors.length
    ? { ok: false, errors }
    : { ok: true, rule: { ...input, name, customName, description } };
}
