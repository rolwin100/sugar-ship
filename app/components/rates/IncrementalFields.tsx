import { useTranslation } from "react-i18next";
import { fieldValue } from "../field-events";
import { BasisAmountField } from "./BasisAmountField";
import type { PricingFieldsProps } from "./types";

/** A base price covering the first step, then a price for each further step. */
export function IncrementalFields({
  pricing,
  currency,
  errorFor,
  onFieldChange,
}: PricingFieldsProps) {
  const { t } = useTranslation();
  return (
    <s-stack gap="small-200">
      <s-grid
        gridTemplateColumns="1fr 1fr 1fr"
        gap="small-200"
        alignItems="start"
      >
        <s-money-field
          label={t("rates.basePriceLabel")}
          currencyCode={currency as never}
          min={0}
          value={pricing.basePrice}
          error={errorFor(["basePriceInvalid"])}
          onInput={(e) => onFieldChange("basePrice", fieldValue(e))}
        />
        <BasisAmountField
          basis={pricing.basis}
          label={t("rates.stepSizeLabel")}
          value={pricing.stepSize}
          currency={currency}
          error={errorFor(["stepSizeInvalid"])}
          onChange={(text) => onFieldChange("stepSize", text)}
        />
        <s-money-field
          label={t("rates.stepPriceLabel")}
          currencyCode={currency as never}
          min={0}
          value={pricing.stepPrice}
          error={errorFor(["stepPriceInvalid"])}
          onInput={(e) => onFieldChange("stepPrice", fieldValue(e))}
        />
      </s-grid>
      <s-text color="subdued">{t("rates.incrementalHelp")}</s-text>
    </s-stack>
  );
}
