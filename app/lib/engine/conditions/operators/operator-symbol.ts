import type { ConditionOperator } from "../../types";

// Short symbols for trace messages. Add text and list operators here when they arrive.

const SYMBOL: Partial<Record<ConditionOperator, string>> = {
  EQUALS: "=",
  NOT_EQUALS: "≠",
  GREATER_THAN: ">",
  GREATER_OR_EQUAL: "≥",
  LESS_THAN: "<",
  LESS_OR_EQUAL: "≤",
};

/** "≥" for GREATER_OR_EQUAL, for trace messages; the operator name if it has no symbol. */
export function operatorSymbol(operator: ConditionOperator): string {
  return SYMBOL[operator] ?? operator;
}
