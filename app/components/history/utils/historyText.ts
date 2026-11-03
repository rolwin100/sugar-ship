import type { TFunction } from "i18next";
import { countryName, stateName } from "../../../lib/geo/geo";
import { formatMoney } from "../../../lib/money";
import type { HistoryItem } from "../../../lib/rate-log";
import { gramsToKg } from "../../../lib/weight";

/** "Bengaluru, Karnataka, India" (whatever parts Shopify sent). */
export function destinationText(
  destination: HistoryItem["destination"],
  locale: string,
): string {
  const { country, province, city } = destination;
  return [
    city,
    country && province ? stateName(country, province) : province,
    country ? countryName(country, locale) : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/** "3 items · ₹1,300.00 · 0.5 kg". */
export function cartText(
  item: Pick<HistoryItem, "totals" | "currency">,
  t: TFunction,
  locale: string,
): string {
  const { quantity, subtotal, weight } = item.totals;
  return [
    t("history.items", { count: quantity }),
    formatMoney(subtotal, item.currency, locale),
    t("history.kg", { value: gramsToKg(weight) }),
  ].join(" · ");
}

/** "4 Nov" for a delivery date "2026-11-04" (a calendar day, so read as UTC). */
export function dayText(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

/** "Arrives 4–5 Nov", "Arrives 4 Nov", or "" without dates. */
export function arrivalText(
  min: string | null,
  max: string | null,
  t: TFunction,
  locale: string,
): string {
  const from = min ?? max;
  const to = max ?? min;
  if (!from || !to) return "";
  return from === to
    ? t("history.arrives", { date: dayText(from, locale) })
    : t("history.arrivesRange", {
        from: dayText(from, locale),
        to: dayText(to, locale),
      });
}

/** "3 Nov 2026, 14:10" in the admin's language. */
export function timeText(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
