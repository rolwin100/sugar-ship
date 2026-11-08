import { useTranslation } from "react-i18next";
import type {
  CartConditionField,
  ProductConditionField,
} from "../../../lib/engine";
import { fieldValue } from "../../field-events";
import {
  CONDITION_FIELD_KEYS,
  CONDITION_FIELDS_IN_ORDER,
  PRODUCT_FIELD_KEYS,
  PRODUCT_FIELDS_IN_ORDER,
} from "../utils";

type Props = {
  number: number; // "Condition 2" in the label
  value: CartConditionField | ProductConditionField;
  onChange: (field: CartConditionField | ProductConditionField) => void;
};

/** "What to check": cart fields and product fields, in two groups. */
export function ConditionFieldSelect({ number, value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <s-select
      label={t("rates.conditionFieldLabel", { number })}
      labelAccessibilityVisibility="exclusive"
      value={value}
      onChange={(e) =>
        onChange(fieldValue(e) as CartConditionField | ProductConditionField)
      }
    >
      <s-option-group label={t("rates.groupCart")}>
        {CONDITION_FIELDS_IN_ORDER.map((field) => (
          <s-option key={field} value={field}>
            {t(CONDITION_FIELD_KEYS[field])}
          </s-option>
        ))}
      </s-option-group>
      <s-option-group label={t("rates.groupProducts")}>
        {PRODUCT_FIELDS_IN_ORDER.map((field) => (
          <s-option key={field} value={field}>
            {t(PRODUCT_FIELD_KEYS[field])}
          </s-option>
        ))}
      </s-option-group>
    </s-select>
  );
}
