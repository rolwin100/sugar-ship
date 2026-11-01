import type {
  CartConditionField,
  NumberOperator,
  RuleMatch,
} from "../../../lib/engine";
import { CART_CONDITION_FIELD, CONDITION_OPERATOR } from "../../../lib/engine";

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
  CART_CONDITION_FIELD.SUBTOTAL,
  CART_CONDITION_FIELD.WEIGHT,
  CART_CONDITION_FIELD.QUANTITY,
];
export const CONDITION_OPERATORS_IN_ORDER: NumberOperator[] = [
  CONDITION_OPERATOR.GREATER_OR_EQUAL,
  CONDITION_OPERATOR.GREATER_THAN,
  CONDITION_OPERATOR.LESS_OR_EQUAL,
  CONDITION_OPERATOR.LESS_THAN,
  CONDITION_OPERATOR.EQUALS,
  CONDITION_OPERATOR.NOT_EQUALS,
];

/** Translation key for each way of combining conditions ("Apply this rate when …"). */
export const CONDITION_MATCH_KEYS = {
  ALL: "rates.matchAll",
  ANY: "rates.matchAny",
  NONE: "rates.matchNone",
} as const satisfies Record<RuleMatch, string>;
