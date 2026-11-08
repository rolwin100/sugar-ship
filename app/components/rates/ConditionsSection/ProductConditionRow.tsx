import { useTranslation } from "react-i18next";
import type { Quantifier, TextOperator } from "../../../lib/engine";
import { fieldValue } from "../../field-events";
import { CollectionPicker } from "./CollectionPicker";
import { ConditionFieldSelect } from "./ConditionFieldSelect";
import type { ProductConditionRowProps } from "../types";
import {
  COLLECTION_OPERATOR_KEYS,
  QUANTIFIER_KEYS,
  QUANTIFIERS_IN_ORDER,
  TEXT_OPERATOR_KEYS,
  TEXT_OPERATORS_IN_ORDER,
  ruleErrorMessage,
} from "../utils";
import {
  CONDITION_OPERATOR,
  PRODUCT_CONDITION_FIELD,
} from "../../../lib/engine";

/**
 * One product condition: [field] [any / all / no item] [comparison] [value] [remove].
 * Text values are typed (comma-separated for "is one of"); collections are picked.
 */
export function ProductConditionRow({
  index,
  condition,
  error,
  onFieldChange,
  onQuantifierChange,
  onOperatorChange,
  onValueChange,
  onCollectionsChange,
  onRemove,
}: ProductConditionRowProps) {
  const { t } = useTranslation();
  const number = index + 1;
  const errorText = error ? ruleErrorMessage(error, t, {}) : undefined;
  const isCollection = condition.field === PRODUCT_CONDITION_FIELD.COLLECTION;
  const isList =
    condition.operator === CONDITION_OPERATOR.IN ||
    condition.operator === CONDITION_OPERATOR.NOT_IN;

  return (
    <s-grid
      gridTemplateColumns="1fr 1fr 1fr 1.5fr auto"
      gap="small-200"
      alignItems="start"
    >
      <ConditionFieldSelect
        number={number}
        value={condition.field}
        onChange={onFieldChange}
      />

      <s-select
        label={t("rates.conditionQuantifierLabel", { number })}
        labelAccessibilityVisibility="exclusive"
        value={condition.quantifier}
        onChange={(e) => onQuantifierChange(fieldValue(e) as Quantifier)}
      >
        {QUANTIFIERS_IN_ORDER.map((q) => (
          <s-option key={q} value={q}>
            {t(QUANTIFIER_KEYS[q])}
          </s-option>
        ))}
      </s-select>

      <s-select
        label={t("rates.conditionOperatorLabel", { number })}
        labelAccessibilityVisibility="exclusive"
        value={condition.operator}
        onChange={(e) => onOperatorChange(fieldValue(e) as TextOperator)}
      >
        {isCollection
          ? (["IN", "NOT_IN"] as const).map((op) => (
              <s-option key={op} value={op}>
                {t(COLLECTION_OPERATOR_KEYS[op])}
              </s-option>
            ))
          : TEXT_OPERATORS_IN_ORDER.map((op) => (
              <s-option key={op} value={op}>
                {t(TEXT_OPERATOR_KEYS[op])}
              </s-option>
            ))}
      </s-select>

      {isCollection ? (
        <CollectionPicker
          number={number}
          collections={condition.collections}
          error={errorText}
          onChange={onCollectionsChange}
        />
      ) : (
        <s-text-field
          label={t("rates.conditionValueLabel", { number })}
          labelAccessibilityVisibility="exclusive"
          details={isList ? t("rates.valuesHelp") : undefined}
          value={condition.value}
          error={errorText}
          onInput={(e) => onValueChange(fieldValue(e))}
        />
      )}

      <s-button
        variant="tertiary"
        icon="delete"
        accessibilityLabel={t("rates.removeCondition", { number })}
        onClick={onRemove}
      />
    </s-grid>
  );
}
