import type { CartConditionField, NumberOperator } from "../../engine";
import type { RuleConditionDraft } from "../types";
import { CONDITIONS_MAX } from "../validate-rule";

// Pure helpers for editing a rate's conditions in the form. Each takes the current
// list and returns a new one, never changing the original. `index` is the
// condition's position in the list.

/** What "Add condition" starts with: cart subtotal, at least, no value yet. */
export const NEW_CONDITION: RuleConditionDraft = {
  field: "subtotal",
  operator: "GREATER_OR_EQUAL",
  value: "",
};

/** Adds a new condition at the end; does nothing once the limit is reached. */
export function addCondition(
  conditions: RuleConditionDraft[],
): RuleConditionDraft[] {
  if (conditions.length >= CONDITIONS_MAX) return conditions;
  return [...conditions, { ...NEW_CONDITION }];
}

export function removeCondition(
  conditions: RuleConditionDraft[],
  index: number,
): RuleConditionDraft[] {
  return conditions.filter((_, i) => i !== index);
}

export function updateCondition(
  conditions: RuleConditionDraft[],
  index: number,
  update: (condition: RuleConditionDraft) => RuleConditionDraft,
): RuleConditionDraft[] {
  return conditions.map((c, i) => (i === index ? update(c) : c));
}

/**
 * Changes what a condition tests. The value is cleared, because a number typed for
 * one field means something else for another (₹1000 isn't 1000 kg).
 */
export function replaceConditionField(
  conditions: RuleConditionDraft[],
  index: number,
  field: CartConditionField,
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) =>
    c.field === field ? c : { ...c, field, value: "" },
  );
}

export function replaceConditionOperator(
  conditions: RuleConditionDraft[],
  index: number,
  operator: NumberOperator,
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) => ({ ...c, operator }));
}

export function replaceConditionValue(
  conditions: RuleConditionDraft[],
  index: number,
  value: string,
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) => ({ ...c, value }));
}
