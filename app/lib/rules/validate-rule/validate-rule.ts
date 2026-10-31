import {
  CART_CONDITION_FIELDS,
  NUMBER_OPERATORS,
  type CartConditionField,
} from "../../engine";
import { RULE_MATCHES, type RuleInput } from "../types";
import {
  CHECKOUT_NAME_MAX,
  CONDITION_VALUE_MAX,
  CONDITIONS_MAX,
  DELIVERY_DAYS_MAX,
  RULE_NAME_MAX,
} from "./limits";
import { validatePricing } from "./validate-pricing";

/** Each key maps to a `rates.error<Key>` translation. */
export type RuleErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "customNameRequired"
  | "customNameTooLong"
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
  | "percentInvalid";

export type RuleError = {
  field: "name" | "customName" | "days" | "prices" | "conditions";
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
  PERCENT_BPS_MAX,
  PRICE_MAX,
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
    const { field, operator, value } = condition;
    if (
      !CART_CONDITION_FIELDS.includes(field) ||
      !NUMBER_OPERATORS.includes(operator)
    ) {
      errors.push({ field: "conditions", key: "conditionUnsupported", index });
    } else if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > CONDITION_VALUE_MAX
    ) {
      errors.push({
        field: "conditions",
        key: "conditionValueInvalid",
        index,
        conditionField: field,
      });
    }
  });

  return errors.length
    ? { ok: false, errors }
    : { ok: true, rule: { ...input, name, customName } };
}
