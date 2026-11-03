import { useTranslation } from "react-i18next";
import { formatMoney } from "../../lib/money";
import { PRESET_KEYS } from "../../lib/rules/presets";
import { RATE_PRESETS, type RatePreset } from "../../lib/rules/types";
import type { ShownRateRowProps } from "./types";
import { deliveryText } from "./utils";

const isPreset = (value: string | null): value is RatePreset =>
  value !== null && (RATE_PRESETS as readonly string[]).includes(value);

/** A rate as checkout would show it: name, delivery estimate, description, price. */
export function ShownRateRow({ rate, currency }: ShownRateRowProps) {
  const { t, i18n } = useTranslation();
  const name = isPreset(rate.preset)
    ? t(PRESET_KEYS[rate.preset])
    : (rate.name ?? "");
  const days = deliveryText(rate.minDeliveryDays, rate.maxDeliveryDays, t);

  return (
    <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="start">
      <s-stack gap="small-100">
        <s-text type="strong">{days ? `${name} · ${days}` : name}</s-text>
        {rate.description && <s-text>{rate.description}</s-text>}
        <s-text color="subdued">
          {t("simulator.fromRate", { name: rate.ruleName })}
        </s-text>
      </s-stack>
      <s-text type="strong">
        {formatMoney(rate.price, currency, i18n.language)}
      </s-text>
    </s-grid>
  );
}
