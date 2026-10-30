import type { TFunction } from "i18next";
import { countryName, stateName } from "../../lib/geo/geo";
import type { ZoneError, ZoneErrorKey } from "../../lib/zones/validate-zone";

const ERROR_TEXT = {
  nameRequired: "zones.errorNameRequired",
  nameTooLong: "zones.errorNameTooLong",
  regionsRequired: "zones.errorRegionsRequired",
  statesRequired: "zones.errorStatesRequired",
  restOfWorldExists: "zones.errorRestOfWorldExists",
  countryTaken: "zones.errorCountryTaken",
  stateTaken: "zones.errorStateTaken",
} as const satisfies Record<ZoneErrorKey, string>;

/** Turns a validation error from the server into a translated sentence. */
export function zoneErrorMessage(
  error: ZoneError,
  t: TFunction,
  locale: string,
) {
  return t(ERROR_TEXT[error.key], {
    country: error.country ? countryName(error.country, locale) : "",
    state:
      error.country && error.state
        ? stateName(error.country, error.state)
        : (error.state ?? ""),
    zone: error.zone ?? "",
  });
}
