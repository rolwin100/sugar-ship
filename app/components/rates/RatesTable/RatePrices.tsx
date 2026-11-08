import { useTranslation } from "react-i18next";
import type { ZonePricing } from "../../../lib/rules/types";
import { pricingSummary } from "../utils";

/** Up to this many zones are listed by name; more are summed up as a count. */
const NAMED_ZONES_MAX = 2;

type Props = {
  prices: ZonePricing[];
  zoneNames: Record<string, string>;
  currency: string;
};

/**
 * "Domestic ₹80.00 · International ₹50.00–₹90.00 by weight", or for more zones
 * "4 zones" (the rate's page shows each one).
 */
export function RatePrices({ prices, zoneNames, currency }: Props) {
  const { t, i18n } = useTranslation();

  if (prices.length > NAMED_ZONES_MAX) {
    return <>{t("rates.pricesZones", { count: prices.length })}</>;
  }

  return (
    <>
      {prices
        .map(
          (p) =>
            `${zoneNames[p.zoneId] ?? "?"} ${pricingSummary(p, t, currency, i18n.language)}`,
        )
        .join(" · ")}
    </>
  );
}
