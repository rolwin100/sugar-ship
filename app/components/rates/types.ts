import type { CartConditionField, NumberOperator } from "../../lib/engine";
import type { RuleConditionDraft } from "../../lib/rules/types";
import type { RuleError } from "../../lib/rules/validate-rule";

export type ConditionRowProps = {
  /** Position in the list, from 0 ("Condition 1" in labels and errors). */
  index: number;
  condition: RuleConditionDraft;
  /** The shop's currency, for subtotal values. */
  currency: string;
  /** This condition's value error from the last save, if any. */
  error?: RuleError;
  onFieldChange: (field: CartConditionField) => void;
  onOperatorChange: (operator: NumberOperator) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
};
