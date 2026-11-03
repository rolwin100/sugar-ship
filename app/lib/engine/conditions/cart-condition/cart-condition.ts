import type {
  CartConditionField,
  CartTotals,
  ConditionResult,
  EngineCondition,
} from "../../types";
import { compareNumbers, isNumberOperator, operatorSymbol } from "../operators";
import { CART_CONDITION_FIELD } from "../../constants";

/** Cart fields a condition can test (units: subtotal subunits, weight grams, quantity items). */
export const CART_CONDITION_FIELDS: readonly CartConditionField[] = [
  CART_CONDITION_FIELD.SUBTOTAL,
  CART_CONDITION_FIELD.WEIGHT,
  CART_CONDITION_FIELD.QUANTITY,
];

function isCartConditionField(field: string): field is CartConditionField {
  return (CART_CONDITION_FIELDS as readonly string[]).includes(field);
}

/** A CART condition: compares subtotal, weight or quantity with a number. */
export function checkCartCondition(
  condition: EngineCondition,
  totals: CartTotals,
): ConditionResult {
  const field = condition.field;
  if (!isCartConditionField(field)) {
    return { unsupported: `cart field "${condition.field}" isn't supported` };
  }

  const value = condition.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { unsupported: `value for ${field} is not a number` };
  }

  const { operator } = condition;
  if (!isNumberOperator(operator)) {
    return {
      unsupported: `operator ${operator} isn't supported for ${field}`,
    };
  }

  const actual = totals[field];
  // Never null here: the operator was checked above.
  const result = compareNumbers(operator, actual, value) === true;

  return {
    result,
    text: `${field} ${actual} ${operatorSymbol(operator)} ${value}`,
    checked: { field, operator, value, actual, result },
  };
}
