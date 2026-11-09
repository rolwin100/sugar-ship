import type { TFunction } from "i18next";
import { formatMoney } from "../../../lib/money";
import type { BasePricing } from "../../../lib/rules/types";
import { gramsToKg } from "../../../lib/weight";
import { RATE_BASIS, RATE_MODE } from "../../../lib/engine";

/** What the price-table summary says it's priced by. */
const BANDS_TEXT = {
  WEIGHT: "rates.summaryBandsWeight",
  SUBTOTAL: "rates.summaryBandsSubtotal",
  QUANTITY: "rates.summaryBandsQuantity",
} as const;

/**
 * One zone's pricing in a few words for the rates list:
 * "₹80.00", "₹50.00–₹90.00 by weight", "₹40.00 + ₹15.00 per 2 items", "2.5% of subtotal".
 */
export function pricingSummary(
  pricing: BasePricing,
  t: TFunction,
  currency: string,
  locale: string,
): string {
  const money = (subunits: number) => formatMoney(subunits, currency, locale);

  switch (pricing.mode) {
    case RATE_MODE.FLAT:
      return money(pricing.price);

    case RATE_MODE.BANDS: {
      const prices = pricing.bands.map((b) => b.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = min === max ? money(min) : `${money(min)}–${money(max)}`;
      return t(BANDS_TEXT[pricing.basis], { range });
    }

    case RATE_MODE.INCREMENTAL: {
      const base = money(pricing.basePrice);
      const price = money(pricing.stepPrice);
      switch (pricing.basis) {
        case RATE_BASIS.WEIGHT:
          return t("rates.summaryStepWeight", {
            base,
            price,
            step: gramsToKg(pricing.stepSize),
          });
        case RATE_BASIS.SUBTOTAL:
          return t("rates.summaryStepSubtotal", {
            base,
            price,
            step: money(pricing.stepSize),
          });
        case RATE_BASIS.QUANTITY:
          return t("rates.summaryStepQuantity", {
            base,
            price,
            count: pricing.stepSize,
          });
      }
      return base;
    }

    case RATE_MODE.PERCENT:
      return t("rates.summaryPercent", {
        percent: new Intl.NumberFormat(locale).format(pricing.percentBps / 100),
      });
  }
}
