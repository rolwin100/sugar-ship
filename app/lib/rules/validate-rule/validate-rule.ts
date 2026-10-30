import type { RuleInput } from "../types";

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
  | "zoneDuplicate";

export type RuleError = {
  field: "name" | "customName" | "days" | "prices";
  key: RuleErrorKey;
  zoneId?: string; // for price errors
};

export type RuleValidation =
  | { ok: true; rule: RuleInput }
  | { ok: false; errors: RuleError[] };

export const RULE_NAME_MAX = 100;
export const CHECKOUT_NAME_MAX = 60;
export const DELIVERY_DAYS_MAX = 365;
export const PRICE_MAX = 1_000_000_000; // subunits; well above any real shipping price

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
  for (const { zoneId, price } of input.prices) {
    if (!zoneIds.has(zoneId)) {
      errors.push({ field: "prices", key: "zoneUnknown", zoneId });
    } else if (seen.has(zoneId)) {
      errors.push({ field: "prices", key: "zoneDuplicate", zoneId });
    } else if (!Number.isInteger(price) || price < 0 || price > PRICE_MAX) {
      errors.push({ field: "prices", key: "priceInvalid", zoneId });
    }
    seen.add(zoneId);
  }

  return errors.length
    ? { ok: false, errors }
    : { ok: true, rule: { ...input, name, customName } };
}
