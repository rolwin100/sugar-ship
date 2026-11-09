import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import type { RateBasis, RateMode } from "../../../lib/engine";
import {
  replaceZoneBasis,
  replaceZoneAdjustment,
  replaceZoneField,
  replaceZoneHandlingType,
  replaceZoneMode,
  replaceZoneOffered,
  updateZonePricing,
} from "../../../lib/rules/edit-pricing";
import { PRICING_BASES, PRICING_MODES } from "../../../lib/rules/types";
import type { RuleErrorKey } from "../../../lib/rules/validate-rule";
import { fieldChecked, fieldValue } from "../../field-events";
import { ZoneCoverage } from "../../zones/ZoneCoverage";
import { BandsFields } from "./BandsFields";
import { AdjustmentsFields } from "./AdjustmentsFields";
import { FlatPriceFields } from "./FlatPriceFields";
import { IncrementalFields } from "./IncrementalFields";
import { PercentFields } from "./PercentFields";
import type { PricingFieldsProps, ZonePricingCardProps } from "../types";
import {
  PRICING_BASIS_KEYS,
  PRICING_MODE_KEYS,
  ruleErrorMessage,
} from "../utils";
import { RATE_MODE } from "../../../lib/engine";

/** Each mode's fields. */
const MODE_FIELDS = {
  FLAT: FlatPriceFields,
  BANDS: BandsFields,
  INCREMENTAL: IncrementalFields,
  PERCENT: PercentFields,
} satisfies Record<RateMode, ComponentType<PricingFieldsProps>>;

/** Modes whose amounts depend on a basis (weight, subtotal or items). */
const USES_BASIS: RateMode[] = [RATE_MODE.BANDS, RATE_MODE.INCREMENTAL];

/**
 * One zone's pricing: a switch to offer the rate there and, when on, how it's priced
 * (mode, basis) with that mode's fields, then the optional adjustments.
 */
export function ZonePricingCard({
  zone,
  pricing,
  currency,
  errors,
  zoneNames,
  onPricesChange,
}: ZonePricingCardProps) {
  const { t } = useTranslation();
  const Fields = MODE_FIELDS[pricing.mode];

  const errorFor = (keys: RuleErrorKey[], bandIndex?: number) => {
    const error = errors.find(
      (e) => keys.includes(e.key) && e.bandIndex === bandIndex,
    );
    return error ? ruleErrorMessage(error, t, zoneNames) : undefined;
  };

  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack gap="base">
        <s-stack gap="small-100">
          <s-switch
            label={t("rates.offerIn", { zone: zone.name })}
            checked={pricing.offered}
            onChange={(e) => {
              const offered = fieldChecked(e);
              onPricesChange((p) => replaceZoneOffered(p, zone.id, offered));
            }}
          />
          <s-text color="subdued">
            <ZoneCoverage zone={{ ...zone, rateCount: 0 }} />
          </s-text>
        </s-stack>

        {pricing.offered && (
          <>
            <s-grid gridTemplateColumns="1fr 1fr" gap="small-200">
              <s-select
                label={t("rates.pricingModeLabel")}
                value={pricing.mode}
                onChange={(e) => {
                  const mode = fieldValue(e) as RateMode;
                  onPricesChange((p) => replaceZoneMode(p, zone.id, mode));
                }}
              >
                {PRICING_MODES.map((mode) => (
                  <s-option key={mode} value={mode}>
                    {t(PRICING_MODE_KEYS[mode])}
                  </s-option>
                ))}
              </s-select>
              {USES_BASIS.includes(pricing.mode) && (
                <s-select
                  label={t("rates.basisLabel")}
                  value={pricing.basis}
                  error={errorFor(["pricingBasisInvalid"])}
                  onChange={(e) => {
                    const basis = fieldValue(e) as RateBasis;
                    onPricesChange((p) => replaceZoneBasis(p, zone.id, basis));
                  }}
                >
                  {PRICING_BASES.map((basis) => (
                    <s-option key={basis} value={basis}>
                      {t(PRICING_BASIS_KEYS[basis])}
                    </s-option>
                  ))}
                </s-select>
              )}
            </s-grid>

            <Fields
              pricing={pricing}
              currency={currency}
              errorFor={errorFor}
              onFieldChange={(field, text) =>
                onPricesChange((p) => replaceZoneField(p, zone.id, field, text))
              }
              onBandsChange={(update) =>
                onPricesChange((p) =>
                  updateZonePricing(p, zone.id, (z) => ({
                    ...z,
                    bands: update(z.bands),
                  })),
                )
              }
            />

            <AdjustmentsFields
              adjustments={pricing.adjustments}
              currency={currency}
              errorFor={errorFor}
              onAdjustmentChange={(field, text) =>
                onPricesChange((p) =>
                  replaceZoneAdjustment(p, zone.id, field, text),
                )
              }
              onHandlingTypeChange={(type) =>
                onPricesChange((p) => replaceZoneHandlingType(p, zone.id, type))
              }
            />
          </>
        )}
      </s-stack>
    </s-box>
  );
}
