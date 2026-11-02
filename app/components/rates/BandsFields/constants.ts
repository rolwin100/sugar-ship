import type { RuleErrorKey } from "../../../lib/rules/validate-rule";

/** Grid columns shared by the header and every row: from | to | price | remove. */
export const BAND_COLUMNS = "1fr 1fr 1fr auto";

/** Errors about a row's limits; they show under its "to" field. */
export const BAND_LIMIT_ERRORS: RuleErrorKey[] = [
  "bandRangeInvalid",
  "bandOpenNotLast",
  "bandsStartAtZero",
  "bandNotContinuous",
];
