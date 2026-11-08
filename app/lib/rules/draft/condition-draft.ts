import { fromSubunits, toSubunits } from "../../money";
import { gramsToKg, kgToGrams } from "../../weight";
import type {
  CartConditionDraft,
  CartRuleCondition,
  ProductConditionDraft,
  ProductRuleCondition,
  RuleCondition,
  RuleConditionDraft,
} from "../types";
import {
  CART_CONDITION_FIELD,
  CONDITION_OPERATOR,
  CONDITION_SUBJECT,
  PRODUCT_CONDITION_FIELD,
} from "../../engine";

/** Operators whose value is a list ("is one of" / "is none of"). */
const isListOperator = (operator: string) =>
  operator === CONDITION_OPERATOR.IN || operator === CONDITION_OPERATOR.NOT_IN;

/**
 * A saved condition → what the form shows. Cart values in the merchant's units
 * (subtotal in the shop's currency, weight in kg, quantity in items); product lists
 * as comma-separated text; collections by id (titles are filled in by the page).
 */
export function conditionToDraft(
  condition: RuleCondition,
  currency: string,
): RuleConditionDraft {
  return condition.subject === CONDITION_SUBJECT.PRODUCT
    ? productToDraft(condition)
    : cartToDraft(condition, currency);
}

function cartToDraft(
  condition: CartRuleCondition,
  currency: string,
): CartConditionDraft {
  const { subject, field, operator, value } = condition;
  switch (field) {
    case CART_CONDITION_FIELD.SUBTOTAL:
      return { subject, field, operator, value: fromSubunits(value, currency) };
    case CART_CONDITION_FIELD.WEIGHT:
      return { subject, field, operator, value: gramsToKg(value) };
    case CART_CONDITION_FIELD.QUANTITY:
      return { subject, field, operator, value: String(value) };
  }
}

function productToDraft(
  condition: ProductRuleCondition,
): ProductConditionDraft {
  const { subject, field, operator, quantifier, value } = condition;
  const list = Array.isArray(value) ? value : [value];
  return field === PRODUCT_CONDITION_FIELD.COLLECTION
    ? {
        subject,
        field,
        operator,
        quantifier,
        value: "",
        collections: list
          .filter((id): id is number => typeof id === "number")
          .map((id) => ({ id, title: "" })),
      }
    : {
        subject,
        field,
        operator,
        quantifier,
        value: list.join(", "),
        collections: [],
      };
}

/**
 * The form → a condition in stored units. Invalid cart numbers become NaN and empty
 * product values stay empty, so validation can point at that condition.
 */
export function draftToCondition(
  draft: RuleConditionDraft,
  currency: string,
): RuleCondition {
  return draft.subject === CONDITION_SUBJECT.PRODUCT
    ? draftToProduct(draft)
    : draftToCart(draft, currency);
}

function draftToCart(
  draft: CartConditionDraft,
  currency: string,
): CartRuleCondition {
  const { subject, field, operator, value: text } = draft;
  switch (field) {
    case CART_CONDITION_FIELD.SUBTOTAL:
      return {
        subject,
        field,
        operator,
        value: toSubunits(text, currency) ?? Number.NaN,
      };
    case CART_CONDITION_FIELD.WEIGHT:
      return { subject, field, operator, value: kgToGrams(text) ?? Number.NaN };
    case CART_CONDITION_FIELD.QUANTITY:
      return {
        subject,
        field,
        operator,
        value: /^\d+$/.test(text.trim()) ? Number(text.trim()) : Number.NaN,
      };
  }
}

/** "fragile, glass " → ["fragile", "glass"]. */
export function splitValues(text: string): string[] {
  return text
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function draftToProduct(draft: ProductConditionDraft): ProductRuleCondition {
  const { subject, field, operator, quantifier } = draft;
  if (field === PRODUCT_CONDITION_FIELD.COLLECTION) {
    return {
      subject,
      field,
      operator,
      quantifier,
      value: draft.collections.map((c) => c.id),
    };
  }
  return {
    subject,
    field,
    operator,
    quantifier,
    value: isListOperator(operator)
      ? splitValues(draft.value)
      : draft.value.trim(),
  };
}
