import type { TFunction } from "i18next";
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
} as const satisfies Record<RuleErrorKey, string>;

/** Turns a validation error from the server into a translated sentence. */
export function ruleErrorMessage(
  error: RuleError,
  t: TFunction,
  zoneNames: Record<string, string>,
) {
  return t(ERROR_TEXT[error.key], {
    zone: error.zoneId ? (zoneNames[error.zoneId] ?? "") : "",
  });
}
