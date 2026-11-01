import type {
  CartConditionField,
  CartTotals,
  ConditionResult,
  EngineCondition,
} from "../../types";
import { compareNumbers, operatorSymbol } from "../operators";
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

  const actual = totals[field];
  const result = compareNumbers(condition.operator, actual, value);

  if (typeof result !== "boolean") {
    return {
      unsupported: `operator ${condition.operator} isn't supported for ${field}`,
    };
  }

  return {
    result,
    text: `${field} ${actual} ${operatorSymbol(condition.operator)} ${value}`,
  };
}
