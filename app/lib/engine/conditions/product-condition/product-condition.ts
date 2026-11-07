import type {
  ConditionOperator,
  ConditionResult,
  EngineCondition,
  EngineItem,
  ProductConditionField,
  Quantifier,
  TextOperator,
} from "../../types";
import {
  CONDITION_OPERATOR,
  CONDITION_SUBJECT,
  PRODUCT_CONDITION_FIELD,
  QUANTIFIER,
} from "../../constants";

/** Product fields a condition can test (per item). */
export const PRODUCT_CONDITION_FIELDS: readonly ProductConditionField[] =
  Object.values(PRODUCT_CONDITION_FIELD);

/** Operators product conditions understand. */
export const TEXT_OPERATORS: readonly TextOperator[] = [
  CONDITION_OPERATOR.EQUALS,
  CONDITION_OPERATOR.NOT_EQUALS,
  CONDITION_OPERATOR.CONTAINS,
  CONDITION_OPERATOR.NOT_CONTAINS,
  CONDITION_OPERATOR.IN,
  CONDITION_OPERATOR.NOT_IN,
];

const LIST_OPERATORS: readonly ConditionOperator[] = [
  CONDITION_OPERATOR.IN,
  CONDITION_OPERATOR.NOT_IN,
];
const SUBSTRING_OPERATORS: readonly ConditionOperator[] = [
  CONDITION_OPERATOR.CONTAINS,
  CONDITION_OPERATOR.NOT_CONTAINS,
];

const isField = (field: string): field is ProductConditionField =>
  (PRODUCT_CONDITION_FIELDS as readonly string[]).includes(field);
const isTextOperator = (
  operator: ConditionOperator,
): operator is TextOperator =>
  (TEXT_OPERATORS as readonly string[]).includes(operator);
const isQuantifier = (value: unknown): value is Quantifier =>
  (Object.values(QUANTIFIER) as unknown[]).includes(value);

const clean = (text: string) => text.trim().toLowerCase();

/**
 * The condition's value(s) in comparable form: lowercased text, or collection ids.
 * One value for is / contains, a non-empty list for is one of / is none of.
 * Null when the value doesn't fit the field and operator.
 */
function readValues(
  field: ProductConditionField,
  operator: TextOperator,
  value: unknown,
): string[] | number[] | null {
  const list = LIST_OPERATORS.includes(operator);
  const raw = list ? value : [value];
  if (!Array.isArray(raw) || raw.length === 0) return null;

  if (field === PRODUCT_CONDITION_FIELD.COLLECTION) {
    const ids = raw.filter(
      (v): v is number => typeof v === "number" && Number.isSafeInteger(v),
    );
    return ids.length === raw.length ? ids : null;
  }
  const texts = raw
    .filter((v): v is string => typeof v === "string")
    .map(clean);
  return texts.length === raw.length && texts.every(Boolean) ? texts : null;
}

/** What an item has for a field, as a list: its tags or collections, or its one type/vendor/SKU. */
function itemValues(
  item: EngineItem,
  field: ProductConditionField,
): (string | number)[] {
  const one = (text: string | null | undefined) =>
    text && clean(text) ? [clean(text)] : [];
  switch (field) {
    case PRODUCT_CONDITION_FIELD.TAG:
      return (item.tags ?? []).map(clean).filter(Boolean);
    case PRODUCT_CONDITION_FIELD.TYPE:
      return one(item.productType);
    case PRODUCT_CONDITION_FIELD.VENDOR:
      return one(item.vendor);
    case PRODUCT_CONDITION_FIELD.SKU:
      return one(item.sku);
    case PRODUCT_CONDITION_FIELD.COLLECTION:
      return item.collectionIds ?? [];
  }
}

/**
 * Does one item match? Its values (e.g. tags) against the condition's:
 *   is / is not            — has / doesn't have the value
 *   contains / not         — some / none of its values contain the text
 *   is one of / none of    — has any / none of the listed values
 */
function itemMatches(
  have: (string | number)[],
  operator: TextOperator,
  values: (string | number)[],
): boolean {
  const has = (v: string | number) => have.includes(v);
  const contains = (v: string | number) =>
    have.some((h) => String(h).includes(String(v)));
  switch (operator) {
    case CONDITION_OPERATOR.EQUALS:
      return has(values[0]);
    case CONDITION_OPERATOR.NOT_EQUALS:
      return !has(values[0]);
    case CONDITION_OPERATOR.CONTAINS:
      return contains(values[0]);
    case CONDITION_OPERATOR.NOT_CONTAINS:
      return !contains(values[0]);
    case CONDITION_OPERATOR.IN:
      return values.some(has);
    case CONDITION_OPERATOR.NOT_IN:
      return !values.some(has);
  }
}

/**
 * A PRODUCT condition: checks each item in the cart, then combines them with the
 * quantifier (any item / all items / no item; missing means any). An empty cart never
 * counts as "all items". Unknown fields, operators or values can't be checked.
 */
export function checkProductCondition(
  condition: EngineCondition,
  items: EngineItem[],
): ConditionResult {
  const { field, operator } = condition;
  if (!isField(field)) {
    return { unsupported: `product field "${field}" isn't supported` };
  }
  if (
    !isTextOperator(operator) ||
    (field === PRODUCT_CONDITION_FIELD.COLLECTION &&
      SUBSTRING_OPERATORS.includes(operator))
  ) {
    return {
      unsupported: `operator ${operator} isn't supported for product ${field}`,
    };
  }
  const quantifier = condition.quantifier ?? QUANTIFIER.ANY;
  if (!isQuantifier(quantifier)) {
    return { unsupported: `quantifier ${String(quantifier)} isn't supported` };
  }
  const values = readValues(field, operator, condition.value);
  if (!values) {
    return {
      unsupported: `value for product ${field} doesn't fit ${operator}`,
    };
  }

  const lines = items.filter((item) => item.quantity > 0);
  const matching = lines.filter((item) =>
    itemMatches(itemValues(item, field), operator, values),
  ).length;
  const total = lines.length;
  const result =
    quantifier === QUANTIFIER.ANY
      ? matching > 0
      : quantifier === QUANTIFIER.ALL
        ? total > 0 && matching === total
        : matching === 0;

  return {
    result,
    text: `${quantifier.toLowerCase()} item ${field} ${operator} ${values.join("|")} (${matching} of ${total})`,
    checked: {
      subject: CONDITION_SUBJECT.PRODUCT,
      field,
      operator,
      quantifier,
      values,
      matching,
      total,
      result,
    },
  };
}
