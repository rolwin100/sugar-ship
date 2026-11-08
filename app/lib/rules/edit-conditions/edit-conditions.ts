import type {
  CartConditionField,
  NumberOperator,
  ProductConditionField,
  Quantifier,
  TextOperator,
} from "../../engine";
import type {
  CartConditionDraft,
  CollectionChoice,
  ProductConditionDraft,
  RuleConditionDraft,
} from "../types";
import { CONDITIONS_MAX } from "../validate-rule";
import {
  CART_CONDITION_FIELD,
  CART_CONDITION_FIELDS,
  CONDITION_OPERATOR,
  CONDITION_SUBJECT,
  NUMBER_OPERATORS,
  PRODUCT_CONDITION_FIELD,
  QUANTIFIER,
  TEXT_OPERATORS,
} from "../../engine";

// Pure helpers for editing a rate's conditions in the form. Each takes the current
// list and returns a new one, never changing the original. `index` is the
// condition's position in the list.

/** What "Add condition" starts with: cart subtotal, at least, no value yet. */
export const NEW_CONDITION: CartConditionDraft = {
  subject: CONDITION_SUBJECT.CART,
  field: CART_CONDITION_FIELD.SUBTOTAL,
  operator: CONDITION_OPERATOR.GREATER_OR_EQUAL,
  value: "",
};

/** A fresh product condition for a field: any item, "is" (collections: "is in any of"). */
export function newProductCondition(
  field: ProductConditionField,
): ProductConditionDraft {
  return {
    subject: CONDITION_SUBJECT.PRODUCT,
    field,
    operator:
      field === PRODUCT_CONDITION_FIELD.COLLECTION
        ? CONDITION_OPERATOR.IN
        : CONDITION_OPERATOR.EQUALS,
    quantifier: QUANTIFIER.ANY,
    value: "",
    collections: [],
  };
}

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

const isCartField = (field: string): field is CartConditionField =>
  (CART_CONDITION_FIELDS as readonly string[]).includes(field);

/**
 * Changes what a condition tests. The value is cleared, because a value typed for one
 * field means something else for another (₹1000 isn't 1000 kg; a tag isn't a SKU).
 * Moving between a cart and a product field starts that kind of condition afresh.
 */
export function replaceConditionField(
  conditions: RuleConditionDraft[],
  index: number,
  field: CartConditionField | ProductConditionField,
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) => {
    if (c.field === field) return c;
    if (isCartField(field)) {
      return c.subject === CONDITION_SUBJECT.CART
        ? { ...c, field, value: "" }
        : { ...NEW_CONDITION, field };
    }
    if (c.subject === CONDITION_SUBJECT.CART) return newProductCondition(field);
    // Product → product: keep the quantifier; collections have their own operators.
    const fresh = newProductCondition(field);
    const keepOperator =
      (c.field === PRODUCT_CONDITION_FIELD.COLLECTION) ===
      (field === PRODUCT_CONDITION_FIELD.COLLECTION);
    return {
      ...fresh,
      quantifier: c.quantifier,
      operator: keepOperator ? c.operator : fresh.operator,
    };
  });
}

/** Changes the comparison; ignored if it doesn't fit the condition's kind. */
export function replaceConditionOperator(
  conditions: RuleConditionDraft[],
  index: number,
  operator: NumberOperator | TextOperator,
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) => {
    if (c.subject === CONDITION_SUBJECT.CART) {
      const number = NUMBER_OPERATORS.find((o) => o === operator);
      return number ? { ...c, operator: number } : c;
    }
    const text = TEXT_OPERATORS.find((o) => o === operator);
    return text ? { ...c, operator: text } : c;
  });
}

/** The typed value (cart amount, or product text). */
export function replaceConditionValue(
  conditions: RuleConditionDraft[],
  index: number,
  value: string,
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) => ({ ...c, value }));
}

/** Any item / all items / no item (product conditions only). */
export function replaceConditionQuantifier(
  conditions: RuleConditionDraft[],
  index: number,
  quantifier: Quantifier,
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) =>
    c.subject === CONDITION_SUBJECT.PRODUCT ? { ...c, quantifier } : c,
  );
}

/** The collections chosen in Shopify's picker (collection conditions only). */
export function replaceConditionCollections(
  conditions: RuleConditionDraft[],
  index: number,
  collections: CollectionChoice[],
): RuleConditionDraft[] {
  return updateCondition(conditions, index, (c) =>
    c.subject === CONDITION_SUBJECT.PRODUCT ? { ...c, collections } : c,
  );
}
