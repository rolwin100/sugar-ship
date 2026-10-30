import type { CartTotals, ConditionResult, EngineCondition } from "../../types";
import { compareNumbers, operatorSymbol } from "../operators";

// Cart fields a condition can test, and the total each one reads.
const CART_FIELDS = {
  subtotal: "subtotal",
  weight: "weight",
  quantity: "quantity",
} as const satisfies Record<string, keyof CartTotals>;

/** A CART condition: compares subtotal, weight or quantity with a number. */
export function checkCartCondition(
  condition: EngineCondition,
  totals: CartTotals,
): ConditionResult {
  const field = CART_FIELDS[condition.field as keyof typeof CART_FIELDS];
  if (!field) {
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
