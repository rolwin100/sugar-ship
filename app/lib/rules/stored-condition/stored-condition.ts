import {
  CART_CONDITION_FIELDS,
  CONDITION_OPERATOR,
  CONDITION_SUBJECT,
  NUMBER_OPERATORS,
  PRODUCT_CONDITION_FIELD,
  PRODUCT_CONDITION_FIELDS,
  QUANTIFIER,
  TEXT_OPERATORS,
} from "../../engine";
import type {
  CartRuleCondition,
  ProductRuleCondition,
  RuleCondition,
  StoredCondition,
} from "../types";

/**
 * A Condition row → a rate condition, or null if it isn't one we can use (e.g. an
 * address condition from a later slice, or a bad JSON value). The value column is
 * JSON, so it's checked here instead of trusted.
 */
export function toRuleCondition(row: StoredCondition): RuleCondition | null {
  switch (row.subject) {
    case CONDITION_SUBJECT.CART:
      return toCartCondition(row);
    case CONDITION_SUBJECT.PRODUCT:
      return toProductCondition(row);
    default:
      return null;
  }
}

function toCartCondition(row: StoredCondition): CartRuleCondition | null {
  const field = CART_CONDITION_FIELDS.find((f) => f === row.field);
  const operator = NUMBER_OPERATORS.find((o) => o === row.operator);
  const value = row.value;
  if (!field || !operator) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return { subject: CONDITION_SUBJECT.CART, field, operator, value };
}

function toProductCondition(row: StoredCondition): ProductRuleCondition | null {
  const field = PRODUCT_CONDITION_FIELDS.find((f) => f === row.field);
  const operator = TEXT_OPERATORS.find((o) => o === row.operator);
  const quantifier = Object.values(QUANTIFIER).find(
    (q) => q === row.quantifier,
  );
  if (!field || !operator || !quantifier) return null;

  const base = {
    subject: CONDITION_SUBJECT.PRODUCT,
    field,
    operator,
    quantifier,
  };
  const value = row.value;
  const list =
    operator === CONDITION_OPERATOR.IN ||
    operator === CONDITION_OPERATOR.NOT_IN;

  if (field === PRODUCT_CONDITION_FIELD.COLLECTION) {
    const ids =
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((id) => typeof id === "number" && Number.isSafeInteger(id));
    return list && ids ? { ...base, value: value as number[] } : null;
  }
  if (list) {
    const texts =
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((v) => typeof v === "string" && v !== "");
    return texts ? { ...base, value: value as string[] } : null;
  }
  return typeof value === "string" && value !== "" ? { ...base, value } : null;
}
