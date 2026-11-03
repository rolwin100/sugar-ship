import type { TFunction } from "i18next";
import { RATE_OUTCOME } from "../../../lib/constants";
import type { RateOutcome } from "../../../lib/types";

type Tone = "success" | "warning" | "neutral" | "critical";

/** Translation key for each outcome's filter option. */
export const OUTCOME_KEYS = {
  rates: "history.outcomeRates",
  fallback: "history.outcomeFallback",
  none: "history.outcomeNone",
  error: "history.outcomeError",
} as const satisfies Record<RateOutcome, string>;

const TONES = {
  rates: "success",
  fallback: "warning",
  none: "neutral",
  error: "critical",
} as const satisfies Record<RateOutcome, Tone>;

/** The Result badge: "2 rates" (green), "Fallback" (amber), "No rates", "Error" (red). */
export function outcomeBadge(
  outcome: RateOutcome,
  rateCount: number,
  t: TFunction,
): { tone: Tone; label: string } {
  return {
    tone: TONES[outcome],
    label:
      outcome === RATE_OUTCOME.RATES
        ? t("history.rateCount", { count: rateCount })
        : t(OUTCOME_KEYS[outcome]),
  };
}
