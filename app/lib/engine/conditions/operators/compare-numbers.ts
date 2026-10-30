import type { ConditionOperator, NumberOperator } from "../../types";

// Number comparisons, shared by every checker that compares numbers (cart totals now).

const COMPARE: Record<
  NumberOperator,
  (actual: number, value: number) => boolean
> = {
  EQUALS: (a, v) => a === v,
  NOT_EQUALS: (a, v) => a !== v,
  GREATER_THAN: (a, v) => a > v,
  GREATER_OR_EQUAL: (a, v) => a >= v,
  LESS_THAN: (a, v) => a < v,
  LESS_OR_EQUAL: (a, v) => a <= v,
};

/** Every number operator, for validating saved conditions. */
export const NUMBER_OPERATORS = Object.keys(COMPARE) as NumberOperator[];

/** Is this an operator that compares two numbers? */
export function isNumberOperator(
  operator: ConditionOperator,
): operator is NumberOperator {
  return operator in COMPARE;
}

/** actual <operator> value, or null when the operator doesn't compare numbers. */
export function compareNumbers(
  operator: ConditionOperator,
  actual: number,
  value: number,
): boolean | null {
  return isNumberOperator(operator) ? COMPARE[operator](actual, value) : null;
}
