import { useTranslation } from "react-i18next";
import { formatMoney } from "../../lib/money";
import type { ZonePricing } from "../../lib/rules/types";

/** Up to this many zones are listed by name; more are shown as a price range. */
const NAMED_ZONES_MAX = 2;

type Props = {
  prices: ZonePricing[];
  zoneNames: Record<string, string>;
  currency: string;
};

/** "Domestic ₹80.00 · International ₹1,500.00", or "₹80.00–₹1,500.00 · 4 zones". */
export function RatePrices({ prices, zoneNames, currency }: Props) {
  const { t, i18n } = useTranslation();
  const money = (subunits: number) =>
    formatMoney(subunits, currency, i18n.language);
  // Only flat prices can be saved until D3; other modes are summarised there.
  const flat = prices.flatMap((p) => (p.mode === "FLAT" ? [p] : []));

  if (flat.length <= NAMED_ZONES_MAX) {
    return (
      <>
        {flat
          .map((p) => `${zoneNames[p.zoneId] ?? "?"} ${money(p.price)}`)
          .join(" · ")}
      </>
    );
  }

  const amounts = flat.map((p) => p.price);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const range = min === max ? money(min) : `${money(min)}–${money(max)}`;
  return <>{t("rates.pricesZones", { range, count: flat.length })}</>;
}
