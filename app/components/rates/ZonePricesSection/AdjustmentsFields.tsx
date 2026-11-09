import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ADJUSTMENT_TYPE, type AdjustmentType } from "../../../lib/engine";
import { currencySymbol } from "../../../lib/money";
import { fieldValue } from "../../field-events";
import type { AdjustmentsFieldsProps } from "../types";
import { adjustmentsSummary } from "../utils";

/**
 * A zone's optional adjustments (free over, handling fee, round up, minimum, maximum) as an
 * accordion: a header showing what's set, which opens to the fields. Starts open when
 * the zone already has adjustments, so saved values aren't hidden.
 */
export function AdjustmentsFields({
  adjustments,
  currency,
  errorFor,
  onAdjustmentChange,
  onHandlingTypeChange,
}: AdjustmentsFieldsProps) {
  const { t, i18n } = useTranslation();
  const summary = adjustmentsSummary(adjustments, t, currency, i18n.language);
  const errors = {
    handlingFee: errorFor(["handlingFeeInvalid"]),
    freeOver: errorFor(["freeOverInvalid"]),
    roundTo: errorFor(["roundToInvalid"]),
    minPrice: errorFor(["minPriceInvalid"]),
    maxPrice: errorFor(["maxPriceInvalid", "minAboveMax"]),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const [opened, setOpen] = useState(summary !== null);
  // Kept open while a field has an error, so the error isn't hidden.
  const open = opened || hasErrors;
  const money = { currencyCode: currency as never, min: 0 };
  const isPercent = adjustments.handlingType === ADJUSTMENT_TYPE.PERCENT;

  return (
    <s-stack gap="small-200">
      <s-divider />
      <s-clickable
        padding="small-200"
        borderRadius="base"
        accessibilityLabel={t(
          open ? "rates.adjustmentsHide" : "rates.adjustmentsShow",
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <s-stack
          direction="inline"
          gap="small-200"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-icon type={open ? "chevron-down" : "chevron-right"} />
            <s-heading>{t("rates.adjustmentsHeading")}</s-heading>
          </s-stack>
          {!open && (
            <s-text color="subdued">
              {summary ?? t("rates.adjustmentsHint")}
            </s-text>
          )}
        </s-stack>
      </s-clickable>

      {open && (
        <s-grid
          gridTemplateColumns="1fr 1fr 1fr"
          gap="small-200"
          alignItems="start"
          paddingBlock="small-200"
        >
          <s-grid
            gridTemplateColumns="1fr 5rem"
            gap="small-100"
            alignItems="start"
          >
            {isPercent ? (
              <s-number-field
                label={t("rates.handlingFeeLabel")}
                suffix="%"
                min={0}
                step={0.01}
                value={adjustments.handlingFee}
                error={errors.handlingFee}
                details={t("rates.handlingFeePercentHelp")}
                onInput={(e) =>
                  onAdjustmentChange("handlingFee", fieldValue(e))
                }
              />
            ) : (
              <s-money-field
                {...money}
                label={t("rates.handlingFeeLabel")}
                value={adjustments.handlingFee}
                error={errors.handlingFee}
                details={t("rates.handlingFeeHelp")}
                onInput={(e) =>
                  onAdjustmentChange("handlingFee", fieldValue(e))
                }
              />
            )}
            <s-select
              label={t("rates.handlingTypeShortLabel")}
              value={adjustments.handlingType}
              onChange={(e) =>
                onHandlingTypeChange(fieldValue(e) as AdjustmentType)
              }
            >
              <s-option value={ADJUSTMENT_TYPE.FIXED}>
                {currencySymbol(currency, i18n.language)}
              </s-option>
              <s-option value={ADJUSTMENT_TYPE.PERCENT}>%</s-option>
            </s-select>
          </s-grid>
          <s-money-field
            {...money}
            label={t("rates.freeOverLabel")}
            value={adjustments.freeOver}
            error={errors.freeOver}
            details={t("rates.freeOverHelp")}
            onInput={(e) => onAdjustmentChange("freeOver", fieldValue(e))}
          />
          <s-money-field
            {...money}
            label={t("rates.roundToLabel")}
            value={adjustments.roundTo}
            error={errors.roundTo}
            details={t("rates.roundToHelp")}
            onInput={(e) => onAdjustmentChange("roundTo", fieldValue(e))}
          />
          <s-money-field
            {...money}
            label={t("rates.minPriceLabel")}
            value={adjustments.minPrice}
            error={errors.minPrice}
            details={t("rates.minPriceHelp")}
            onInput={(e) => onAdjustmentChange("minPrice", fieldValue(e))}
          />
          <s-money-field
            {...money}
            label={t("rates.maxPriceLabel")}
            value={adjustments.maxPrice}
            error={errors.maxPrice}
            details={t("rates.maxPriceHelp")}
            onInput={(e) => onAdjustmentChange("maxPrice", fieldValue(e))}
          />
        </s-grid>
      )}
    </s-stack>
  );
}
