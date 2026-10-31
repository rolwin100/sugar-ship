import { fromSubunits, toSubunits } from "../../money";
import { gramsToKg, kgToGrams } from "../../weight";
import type { RuleCondition, RuleConditionDraft } from "../types";

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
    case "subtotal":
      return { field, operator, value: fromSubunits(value, currency) };
    case "weight":
      return { field, operator, value: gramsToKg(value) };
    case "quantity":
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
    case "subtotal":
      return {
        field,
        operator,
        value: toSubunits(text, currency) ?? Number.NaN,
      };
    case "weight":
      return { field, operator, value: kgToGrams(text) ?? Number.NaN };
    case "quantity":
      return {
        field,
        operator,
        value: /^\d+$/.test(text.trim()) ? Number(text.trim()) : Number.NaN,
      };
  }
}
