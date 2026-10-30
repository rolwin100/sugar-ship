import type { ConditionOperator } from "../../types";

// Number comparisons, shared by every checker that compares numbers (cart totals now).

const COMPARE: Partial<
  Record<ConditionOperator, (actual: number, value: number) => boolean>
> = {
  EQUALS: (a, v) => a === v,
  NOT_EQUALS: (a, v) => a !== v,
  GREATER_THAN: (a, v) => a > v,
  GREATER_OR_EQUAL: (a, v) => a >= v,
  LESS_THAN: (a, v) => a < v,
  LESS_OR_EQUAL: (a, v) => a <= v,
};

/** Is this an operator that compares two numbers? */
export function isNumberOperator(operator: ConditionOperator): boolean {
  return operator in COMPARE;
}

/** actual <operator> value, or null when the operator doesn't compare numbers. */
export function compareNumbers(
  operator: ConditionOperator,
  actual: number,
  value: number,
): boolean | null {
  const compare = COMPARE[operator];
  return compare ? compare(actual, value) : null;
}
