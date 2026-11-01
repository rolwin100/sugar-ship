/**
 * The closed string sets the engine and the app share. Each value is spelled once
 * here; use `RATE_MODE.FLAT` instead of `"FLAT"`, and the types in ./types derive
 * from these objects. The values mirror the Prisma enums in prisma/schema.prisma
 * (constants.test.ts fails if they drift apart).
 */

export const CONDITION_SUBJECT = {
  CART: "CART",
  PRODUCT: "PRODUCT",
  ADDRESS: "ADDRESS",
} as const;

export const CONDITION_OPERATOR = {
  EQUALS: "EQUALS",
  NOT_EQUALS: "NOT_EQUALS",
  GREATER_THAN: "GREATER_THAN",
  GREATER_OR_EQUAL: "GREATER_OR_EQUAL",
  LESS_THAN: "LESS_THAN",
  LESS_OR_EQUAL: "LESS_OR_EQUAL",
  CONTAINS: "CONTAINS",
  NOT_CONTAINS: "NOT_CONTAINS",
  IN: "IN",
  NOT_IN: "NOT_IN",
  IN_POSTCODE_LIST: "IN_POSTCODE_LIST",
  NOT_IN_POSTCODE_LIST: "NOT_IN_POSTCODE_LIST",
} as const;

export const QUANTIFIER = {
  ANY: "ANY",
  ALL: "ALL",
  NONE: "NONE",
} as const;

export const RULE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const RULE_MATCH = {
  ALL: "ALL",
  ANY: "ANY",
  NONE: "NONE",
} as const;

export const RATE_MODE = {
  FLAT: "FLAT",
  BANDS: "BANDS",
  INCREMENTAL: "INCREMENTAL",
  PERCENT: "PERCENT",
} as const;

export const RATE_BASIS = {
  WEIGHT: "WEIGHT",
  QUANTITY: "QUANTITY",
  SUBTOTAL: "SUBTOTAL",
} as const;

export const ADJUSTMENT_KIND = {
  HANDLING_FEE: "HANDLING_FEE",
  MIN_PRICE: "MIN_PRICE",
  MAX_PRICE: "MAX_PRICE",
  ROUND_TO: "ROUND_TO",
  FREE_OVER: "FREE_OVER",
} as const;

export const ADJUSTMENT_TYPE = {
  FIXED: "FIXED",
  PERCENT: "PERCENT",
} as const;

export const COMBINE_STRATEGY = {
  SUM: "SUM",
  HIGHEST: "HIGHEST",
  LOWEST: "LOWEST",
} as const;

/** Cart fields a condition can test (the keys of CartTotals). */
export const CART_CONDITION_FIELD = {
  QUANTITY: "quantity",
  SUBTOTAL: "subtotal",
  WEIGHT: "weight",
} as const;

/** What happened to a rule in a quote's trace. */
export const TRACE_OUTCOME = {
  MATCHED: "matched",
  NOT_MATCHED: "not_matched",
  SKIPPED_INACTIVE: "skipped_inactive",
  SKIPPED_SCHEDULE: "skipped_schedule",
  SKIPPED_AFTER_EXCLUSIVE: "skipped_after_exclusive",
} as const;
