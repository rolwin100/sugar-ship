import type { TFunction } from "i18next";

/** "1–2 days", "3 days", or "" when the rate has no estimate. */
export function deliveryText(
  min: number | null,
  max: number | null,
  t: TFunction,
): string {
  if (min === null && max === null) return "";
  if (min === null || max === null || min === max) {
    return t("simulator.days", { count: (min ?? max) as number });
  }
  return t("simulator.daysRange", { min, max });
}
