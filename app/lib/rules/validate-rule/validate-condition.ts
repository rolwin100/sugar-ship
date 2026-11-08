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
} from "../types";
import {
  CONDITION_VALUE_MAX,
  PRODUCT_VALUE_LENGTH_MAX,
  PRODUCT_VALUES_MAX,
} from "./limits";
import type { RuleError, RuleErrorKey } from "./validate-rule";

/** All problems with one condition (empty when it's fine). `index` is its position, from 0. */
export function validateCondition(
  condition: RuleCondition,
  index: number,
): RuleError[] {
  return condition.subject === CONDITION_SUBJECT.PRODUCT
    ? validateProductCondition(condition, index)
    : validateCartCondition(condition, index);
}

function validateCartCondition(
  condition: CartRuleCondition,
  index: number,
): RuleError[] {
  const { field, operator, value } = condition;
  if (
    !CART_CONDITION_FIELDS.includes(field) ||
    !NUMBER_OPERATORS.includes(operator)
  ) {
    return [{ field: "conditions", key: "conditionUnsupported", index }];
  }
  if (!Number.isInteger(value) || value < 0 || value > CONDITION_VALUE_MAX) {
    return [
      {
        field: "conditions",
        key: "conditionValueInvalid",
        index,
        conditionField: field,
      },
    ];
  }
  return [];
}

function validateProductCondition(
  condition: ProductRuleCondition,
  index: number,
): RuleError[] {
  const error = (key: RuleErrorKey): RuleError[] => [
    { field: "conditions", key, index },
  ];
  const { field, operator, quantifier, value } = condition;
  const collection = field === PRODUCT_CONDITION_FIELD.COLLECTION;
  const list =
    operator === CONDITION_OPERATOR.IN ||
    operator === CONDITION_OPERATOR.NOT_IN;

  if (
    !PRODUCT_CONDITION_FIELDS.includes(field) ||
    !TEXT_OPERATORS.includes(operator) ||
    !(Object.values(QUANTIFIER) as string[]).includes(quantifier) ||
    (collection && !list) // collections only use "is in any of" / "is in none of"
  ) {
    return error("conditionUnsupported");
  }

  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0 || values.some((v) => v === "")) {
    return error("productValueRequired");
  }
  if (values.length > PRODUCT_VALUES_MAX) return error("tooManyProductValues");
  if (collection) {
    return values.every(
      (id) => typeof id === "number" && Number.isSafeInteger(id),
    )
      ? []
      : error("conditionUnsupported");
  }
  if (values.some((v) => typeof v !== "string")) {
    return error("conditionUnsupported");
  }
  if (values.some((v) => (v as string).length > PRODUCT_VALUE_LENGTH_MAX)) {
    return error("productValueTooLong");
  }
  return [];
}
