/** How a rates request ended (stored in the rate log). */
export const RATE_OUTCOME = {
  RATES: "rates",
  FALLBACK: "fallback",
  NONE: "none",
  ERROR: "error",
} as const;
