import { useTranslation } from "react-i18next";
import type { NumberOperator } from "../../../lib/engine";
import { fieldValue } from "../../field-events";
import { ConditionFieldSelect } from "./ConditionFieldSelect";
import {
  CONDITION_OPERATOR_KEYS,
  CONDITION_OPERATORS_IN_ORDER,
  ruleErrorMessage,
} from "../utils";
import type { ConditionRowProps } from "../types";
import { CART_CONDITION_FIELD } from "../../../lib/engine";

/** One condition: [field] [comparison] [value in the right unit] [remove]. */
export function ConditionRow({
  index,
  condition,
  currency,
  error,
  onFieldChange,
  onOperatorChange,
  onValueChange,
  onRemove,
}: ConditionRowProps) {
  const { t } = useTranslation();
  const number = index + 1;
  const errorText = error ? ruleErrorMessage(error, t, {}) : undefined;
  const valueLabel = t("rates.conditionValueLabel", { number });

  return (
    <s-grid
      gridTemplateColumns="1fr 1fr 1fr auto"
      gap="small-200"
      alignItems="start"
    >
      <ConditionFieldSelect
        number={number}
        value={condition.field}
        onChange={onFieldChange}
      />

      <s-select
        label={t("rates.conditionOperatorLabel", { number })}
        labelAccessibilityVisibility="exclusive"
        value={condition.operator}
        onChange={(e) => onOperatorChange(fieldValue(e) as NumberOperator)}
      >
        {CONDITION_OPERATORS_IN_ORDER.map((operator) => (
          <s-option key={operator} value={operator}>
            {t(CONDITION_OPERATOR_KEYS[operator])}
          </s-option>
        ))}
      </s-select>

      {condition.field === CART_CONDITION_FIELD.SUBTOTAL && (
        <s-money-field
          label={valueLabel}
          labelAccessibilityVisibility="exclusive"
          currencyCode={currency as never}
          min={0}
          value={condition.value}
          error={errorText}
          onInput={(e) => onValueChange(fieldValue(e))}
        />
      )}
      {condition.field === CART_CONDITION_FIELD.WEIGHT && (
        <s-number-field
          label={valueLabel}
          labelAccessibilityVisibility="exclusive"
          suffix={t("rates.unitKg")}
          min={0}
          step={0.001}
          value={condition.value}
          error={errorText}
          onInput={(e) => onValueChange(fieldValue(e))}
        />
      )}
      {condition.field === CART_CONDITION_FIELD.QUANTITY && (
        <s-number-field
          label={valueLabel}
          labelAccessibilityVisibility="exclusive"
          suffix={t("rates.unitItems")}
          details={t("rates.quantityHelp")}
          min={0}
          step={1}
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
