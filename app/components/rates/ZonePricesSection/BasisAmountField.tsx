import { useTranslation } from "react-i18next";
import { fieldValue } from "../../field-events";
import type { BasisAmountFieldProps } from "../types";
import { RATE_BASIS } from "../../../lib/engine";

/** An amount in the basis's unit: money for subtotal, kg for weight, items for quantity. */
export function BasisAmountField({
  basis,
  label,
  labelHidden,
  value,
  currency,
  placeholder,
  error,
  onChange,
}: BasisAmountFieldProps) {
  const { t } = useTranslation();
  const common = {
    label,
    labelAccessibilityVisibility: labelHidden ? "exclusive" : undefined,
    value,
    placeholder,
    error,
    min: 0,
    onInput: (e: Event) => onChange(fieldValue(e)),
  } as const;

  switch (basis) {
    case RATE_BASIS.SUBTOTAL:
      return <s-money-field {...common} currencyCode={currency as never} />;
    case RATE_BASIS.WEIGHT:
      return (
        <s-number-field {...common} suffix={t("rates.unitKg")} step={0.001} />
      );
    case RATE_BASIS.QUANTITY:
      return (
        <s-number-field {...common} suffix={t("rates.unitItems")} step={1} />
      );
  }
}
