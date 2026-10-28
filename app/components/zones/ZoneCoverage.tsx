import { useTranslation } from "react-i18next";
import { zoneCoverage } from "../../lib/zones/coverage";
import type { ZoneListItem } from "../../lib/zones/types";

export function ZoneCoverage({ zone }: { zone: ZoneListItem }) {
  const { t, i18n } = useTranslation();
  const coverage = zoneCoverage(zone, i18n.language);

  switch (coverage.kind) {
    case "restOfWorld":
      return <s-badge>{t("zones.restOfWorld")}</s-badge>;
    case "none":
      return <s-text color="subdued">{t("zones.coverNone")}</s-text>;
    case "states":
      return (
        <>
          {t("zones.coverStates", {
            country: coverage.country,
            count: coverage.count,
            total: coverage.total,
          })}
        </>
      );
    case "list":
      return (
        <>
          {new Intl.ListFormat(i18n.language, { type: "conjunction" }).format(
            coverage.names,
          )}
        </>
      );
    case "count":
      return <>{t("zones.coverCountries", { count: coverage.count })}</>;
  }
}
