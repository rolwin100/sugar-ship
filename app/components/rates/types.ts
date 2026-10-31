import type {
  CartConditionField,
  NumberOperator,
  RuleMatch,
} from "../../lib/engine";
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

export type ConditionsSectionProps = {
  match: RuleMatch;
  conditions: RuleConditionDraft[];
  currency: string;
  /** Condition errors from the last save; each points at a condition by index. */
  errors: RuleError[];
  onMatchChange: (match: RuleMatch) => void;
  /** Gets a function that turns the current list into the new one (see edit-conditions). */
  onConditionsChange: (
    update: (conditions: RuleConditionDraft[]) => RuleConditionDraft[],
  ) => void;
};
