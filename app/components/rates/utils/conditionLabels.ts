import type { CartConditionField, NumberOperator } from "../../../lib/engine";

/** Translation key for each condition field. */
export const CONDITION_FIELD_KEYS = {
  subtotal: "rates.fieldSubtotal",
  weight: "rates.fieldWeight",
  quantity: "rates.fieldQuantity",
} as const satisfies Record<CartConditionField, string>;

/** Translation key for each comparison, worded to read after the field. */
export const CONDITION_OPERATOR_KEYS = {
  GREATER_OR_EQUAL: "rates.opAtLeast",
  GREATER_THAN: "rates.opMoreThan",
  LESS_OR_EQUAL: "rates.opAtMost",
  LESS_THAN: "rates.opLessThan",
  EQUALS: "rates.opEquals",
  NOT_EQUALS: "rates.opNotEquals",
} as const satisfies Record<NumberOperator, string>;

/** Dropdown order: the most common comparisons first. */
export const CONDITION_FIELDS_IN_ORDER: CartConditionField[] = [
  "subtotal",
  "weight",
  "quantity",
];
export const CONDITION_OPERATORS_IN_ORDER: NumberOperator[] = [
  "GREATER_OR_EQUAL",
  "GREATER_THAN",
  "LESS_OR_EQUAL",
  "LESS_THAN",
  "EQUALS",
  "NOT_EQUALS",
];
