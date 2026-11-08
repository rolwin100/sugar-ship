import { useTranslation } from "react-i18next";
import {
  addBand,
  removeBand,
  replaceBandPrice,
  replaceBandTo,
} from "../../../../lib/rules/edit-pricing";
import { BANDS_MAX } from "../../../../lib/rules/validate-rule";
import type { PricingFieldsProps } from "../../types";
import { BandRow } from "./BandRow";
import { BAND_COLUMNS, BAND_LIMIT_ERRORS } from "./constants";
import { RATE_BASIS } from "../../../../lib/engine";

/**
 * A price table, one BandRow per row. "From" follows the row above, so only "to"
 * and the price are typed; an empty last "to" means "and above".
 */
export function BandsFields({
  pricing,
  currency,
  errorFor,
  onBandsChange,
}: PricingFieldsProps) {
  const { t } = useTranslation();
  const { bands, basis } = pricing;
  const atLimit = bands.length >= BANDS_MAX;
  const unit =
    basis === RATE_BASIS.WEIGHT
      ? t("rates.unitKg")
      : basis === RATE_BASIS.QUANTITY
        ? t("rates.unitItems")
        : currency;
  const tableError = errorFor(["bandsRequired", "tooManyBands"]);

  return (
    <s-stack gap="small-200">
      <s-grid gridTemplateColumns={BAND_COLUMNS} gap="small-200">
        <s-text color="subdued">{t("rates.bandFrom")}</s-text>
        <s-text color="subdued">{t("rates.bandTo")}</s-text>
        <s-text color="subdued">{t("rates.priceLabel")}</s-text>
        <s-box inlineSize="32px" />
      </s-grid>

      {bands.map((band, index) => (
        <BandRow
          // Rows have no id of their own; position is their identity in the form.
          key={index}
          number={index + 1}
          band={band}
          basis={basis}
          unit={unit}
          currency={currency}
          toError={errorFor(BAND_LIMIT_ERRORS, index)}
          priceError={errorFor(["bandPriceInvalid"], index)}
          canRemove={bands.length > 1}
          onToChange={(text) =>
            onBandsChange((b) => replaceBandTo(b, index, text))
          }
          onPriceChange={(text) =>
            onBandsChange((b) => replaceBandPrice(b, index, text))
          }
          onRemove={() => onBandsChange((b) => removeBand(b, index))}
        />
      ))}

      {tableError && <s-text tone="critical">{tableError}</s-text>}
      <s-text color="subdued">{t("rates.bandsHelp")}</s-text>
      <s-stack direction="inline">
        <s-button
          icon="plus"
          disabled={atLimit}
          onClick={() => onBandsChange(addBand)}
        >
          {t("rates.addBand")}
        </s-button>
      </s-stack>
      {atLimit && <s-text color="subdued">{t("rates.bandsAtLimit")}</s-text>}
    </s-stack>
  );
}
