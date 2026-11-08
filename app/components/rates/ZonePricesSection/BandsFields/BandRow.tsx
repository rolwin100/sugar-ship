import { useTranslation } from "react-i18next";
import { fieldValue } from "../../../field-events";
import { BasisAmountField } from "../BasisAmountField";
import type { BandRowProps } from "../../types";
import { BAND_COLUMNS } from "./constants";

/** One price-table row: [from] [to] [price] [remove]. */
export function BandRow({
  number,
  band,
  basis,
  unit,
  currency,
  toError,
  priceError,
  canRemove,
  onToChange,
  onPriceChange,
  onRemove,
}: BandRowProps) {
  const { t } = useTranslation();

  return (
    <s-grid
      gridTemplateColumns={BAND_COLUMNS}
      gap="small-200"
      alignItems="start"
    >
      <s-text>{band.from === "" ? "–" : `${band.from} ${unit}`}</s-text>
      <BasisAmountField
        basis={basis}
        label={t("rates.bandToLabel", { band: number })}
        labelHidden
        value={band.to}
        currency={currency}
        placeholder={t("rates.bandAndAbove")}
        error={toError}
        onChange={onToChange}
      />
      <s-money-field
        label={t("rates.bandPriceLabel", { band: number })}
        labelAccessibilityVisibility="exclusive"
        currencyCode={currency as never}
        min={0}
        value={band.price}
        error={priceError}
        onInput={(e) => onPriceChange(fieldValue(e))}
      />
      <s-button
        variant="tertiary"
        icon="delete"
        accessibilityLabel={t("rates.removeBand", { band: number })}
        disabled={!canRemove}
        onClick={onRemove}
      />
    </s-grid>
  );
}
