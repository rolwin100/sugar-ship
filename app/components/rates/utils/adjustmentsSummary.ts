import type { TFunction } from "i18next";
import { ADJUSTMENT_TYPE } from "../../../lib/engine";
import { formatMoney, toSubunits } from "../../../lib/money";
import type { AdjustmentsDraft } from "../../../lib/rules/types";

/**
 * The filled adjustments in a few words, in the order they apply, for the collapsed
 * Price adjustments header: "Free shipping over ₹1,000.00 · +₹15.00 handling · Max ₹300.00".
 * Null when none are filled. Amounts that can't be read are shown as typed.
 */
export function adjustmentsSummary(
  adjustments: AdjustmentsDraft,
  t: TFunction,
  currency: string,
  locale: string,
): string | null {
  const amount = (text: string) => {
    const subunits = toSubunits(text, currency);
    return subunits === null || Number.isNaN(subunits)
      ? text.trim()
      : formatMoney(subunits, currency, locale);
  };
  const filled = (text: string) => text.trim() !== "";

  const parts = [
    filled(adjustments.freeOver) &&
      t("rates.adjustmentsSummaryFreeOver", {
        amount: amount(adjustments.freeOver),
      }),
    filled(adjustments.handlingFee) &&
      t("rates.adjustmentsSummaryHandling", {
        amount:
          adjustments.handlingType === ADJUSTMENT_TYPE.PERCENT
            ? `${adjustments.handlingFee.trim()}%`
            : amount(adjustments.handlingFee),
      }),
    filled(adjustments.roundTo) &&
      t("rates.adjustmentsSummaryRoundTo", {
        amount: amount(adjustments.roundTo),
      }),
    filled(adjustments.minPrice) &&
      t("rates.adjustmentsSummaryMin", {
        amount: amount(adjustments.minPrice),
      }),
    filled(adjustments.maxPrice) &&
      t("rates.adjustmentsSummaryMax", {
        amount: amount(adjustments.maxPrice),
      }),
  ].filter((part): part is string => typeof part === "string");

  return parts.length > 0 ? parts.join(" · ") : null;
}
