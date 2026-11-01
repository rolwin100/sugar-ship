import {
  CART_CONDITION_FIELDS,
  CONDITION_SUBJECT,
  NUMBER_OPERATORS,
} from "../../engine";
import type { RuleCondition, StoredCondition } from "../types";

/**
 * A Condition row → a rate condition, or null if it isn't a valid cart condition
 * (e.g. a product condition from a later slice, or a bad JSON value). The value
 * column is JSON, so it's checked here instead of trusted.
 */
export function toRuleCondition(row: StoredCondition): RuleCondition | null {
  if (row.subject !== CONDITION_SUBJECT.CART) return null;

  const field = CART_CONDITION_FIELDS.find((f) => f === row.field);
  const operator = NUMBER_OPERATORS.find((o) => o === row.operator);
  const value = row.value;
  if (!field || !operator) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return { field, operator, value };
}
