import { useTranslation } from "react-i18next";
import { fieldValue } from "../../field-events";
import type { PricingFieldsProps } from "../types";

/** One price for every cart. */
export function FlatPriceFields({
  pricing,
  currency,
  errorFor,
  onFieldChange,
}: PricingFieldsProps) {
  const { t } = useTranslation();
  return (
    <s-money-field
      label={t("rates.priceLabel")}
      details={t("rates.flatHelp")}
      currencyCode={currency as never}
      min={0}
      value={pricing.price}
      error={errorFor(["priceInvalid"])}
      onInput={(e) => onFieldChange("price", fieldValue(e))}
    />
  );
}
