import type { TFunction } from "i18next";
import type { CartConditionField } from "../../lib/engine";
import type { RuleError, RuleErrorKey } from "../../lib/rules/validate-rule";

const ERROR_TEXT = {
  nameRequired: "rates.errorNameRequired",
  nameTooLong: "rates.errorNameTooLong",
  customNameRequired: "rates.errorCustomNameRequired",
  customNameTooLong: "rates.errorCustomNameTooLong",
  daysInvalid: "rates.errorDaysInvalid",
  daysOrder: "rates.errorDaysOrder",
  pricesRequired: "rates.errorPricesRequired",
  priceInvalid: "rates.errorPriceInvalid",
  zoneUnknown: "rates.errorZoneUnknown",
  zoneDuplicate: "rates.errorZoneDuplicate",
  matchInvalid: "rates.errorMatchInvalid",
  tooManyConditions: "rates.errorTooManyConditions",
  conditionUnsupported: "rates.errorConditionUnsupported",
  conditionValueInvalid: "rates.errorConditionSubtotalInvalid", // see VALUE_TEXT
} as const satisfies Record<RuleErrorKey, string>;

// A bad condition value asks for the right unit: an amount, a weight in kg, or items.
const VALUE_TEXT = {
  subtotal: "rates.errorConditionSubtotalInvalid",
  weight: "rates.errorConditionWeightInvalid",
  quantity: "rates.errorConditionQuantityInvalid",
} as const satisfies Record<CartConditionField, string>;

/** Turns a validation error from the server into a translated sentence. */
export function ruleErrorMessage(
  error: RuleError,
  t: TFunction,
  zoneNames: Record<string, string>,
) {
  const key =
    error.key === "conditionValueInvalid" && error.conditionField
      ? VALUE_TEXT[error.conditionField]
      : ERROR_TEXT[error.key];
  return t(key, {
    zone: error.zoneId ? (zoneNames[error.zoneId] ?? "") : "",
    number: (error.index ?? 0) + 1, // "Condition 2"
  });
}
