import { fromSubunits, toSubunits } from "../../money";
import { gramsToKg, kgToGrams } from "../../weight";
import type { RuleCondition, RuleConditionDraft } from "../types";
import { CART_CONDITION_FIELD } from "../../engine";

/**
 * A saved condition → the text the form shows, in the merchant's units:
 * subtotal in the shop's currency, weight in kg, quantity in items.
 */
export function conditionToDraft(
  condition: RuleCondition,
  currency: string,
): RuleConditionDraft {
  const { field, operator, value } = condition;
  switch (field) {
    case CART_CONDITION_FIELD.SUBTOTAL:
      return { field, operator, value: fromSubunits(value, currency) };
    case CART_CONDITION_FIELD.WEIGHT:
      return { field, operator, value: gramsToKg(value) };
    case CART_CONDITION_FIELD.QUANTITY:
      return { field, operator, value: String(value) };
  }
}

/**
 * The form's text → a condition in stored units (subunits, grams, items).
 * Empty or invalid text becomes NaN, so validation can flag that condition.
 */
export function draftToCondition(
  draft: RuleConditionDraft,
  currency: string,
): RuleCondition {
  const { field, operator, value: text } = draft;
  switch (field) {
    case CART_CONDITION_FIELD.SUBTOTAL:
      return {
        field,
        operator,
        value: toSubunits(text, currency) ?? Number.NaN,
      };
    case CART_CONDITION_FIELD.WEIGHT:
      return { field, operator, value: kgToGrams(text) ?? Number.NaN };
    case CART_CONDITION_FIELD.QUANTITY:
      return {
        field,
        operator,
        value: /^\d+$/.test(text.trim()) ? Number(text.trim()) : Number.NaN,
      };
  }
}
