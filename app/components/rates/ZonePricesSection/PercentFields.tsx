import { useTranslation } from "react-i18next";
import { fieldValue } from "../../field-events";
import type { PricingFieldsProps } from "../types";

/** A percentage of the cart subtotal, e.g. 2.5. */
export function PercentFields({
  pricing,
  errorFor,
  onFieldChange,
}: PricingFieldsProps) {
  const { t } = useTranslation();
  return (
    <s-number-field
      label={t("rates.percentLabel")}
      details={t("rates.percentHelp")}
      suffix="%"
      min={0}
      max={100}
      step={0.01}
      value={pricing.percent}
      error={errorFor(["percentInvalid"])}
      onInput={(e) => onFieldChange("percent", fieldValue(e))}
    />
  );
}
