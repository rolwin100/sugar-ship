import { useTranslation } from "react-i18next";
import type { ZoneError } from "../../lib/zones/validate-zone";
import { zoneErrorMessage } from "./zoneErrorMessage";

/** Errors about the zone's countries and states (name errors show on the name field). */
export function ZoneErrorsBanner({ errors, invalid }: { errors: ZoneError[]; invalid: boolean }) {
  const { t, i18n } = useTranslation();
  if (errors.length === 0 && !invalid) return null;

  return (
    <s-banner tone="critical" heading={t("zones.errorsTitle")}>
      <s-unordered-list>
        {invalid && <s-list-item>{t("zones.errorInvalid")}</s-list-item>}
        {errors.map((error, i) => (
          <s-list-item key={i}>{zoneErrorMessage(error, t, i18n.language)}</s-list-item>
        ))}
      </s-unordered-list>
    </s-banner>
  );
}
