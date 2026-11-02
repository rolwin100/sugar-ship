import { useTranslation } from "react-i18next";
import { PRESET_KEYS } from "../../lib/rules/presets";
import { RATE_PRESETS, type RuleDraft } from "../../lib/rules/types";
import type { RuleError } from "../../lib/rules/validate-rule";
import { fieldValue } from "../field-events";
import { ruleErrorMessage } from "./utils";

type Fields = Pick<
  RuleDraft,
  | "preset"
  | "customName"
  | "description"
  | "minDeliveryDays"
  | "maxDeliveryDays"
>;

type Props = Fields & {
  customNameError?: RuleError;
  descriptionError?: RuleError;
  daysError?: RuleError;
  onChange: (fields: Partial<Fields>) => void;
};

/** How the rate looks to customers: its name, description and delivery estimate. */
export function CheckoutDisplaySection({
  preset,
  customName,
  description,
  minDeliveryDays,
  maxDeliveryDays,
  customNameError,
  descriptionError,
  daysError,
  onChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <s-section heading={t("rates.checkoutHeading")}>
      <s-stack gap="base">
        <s-select
          label={t("rates.shownAsLabel")}
          value={preset}
          onChange={(e) =>
            onChange({ preset: fieldValue(e) as Fields["preset"] })
          }
        >
          {RATE_PRESETS.map((p) => (
            <s-option key={p} value={p}>
              {t(PRESET_KEYS[p])}
            </s-option>
          ))}
          <s-option value="custom">{t("rates.customOption")}</s-option>
        </s-select>

        {preset === "custom" && (
          <s-text-field
            label={t("rates.customNameLabel")}
            details={t("rates.customNameHelp")}
            value={customName}
            error={
              customNameError
                ? ruleErrorMessage(customNameError, t, {})
                : undefined
            }
            onInput={(e) => onChange({ customName: fieldValue(e) })}
          />
        )}

        <s-text-field
          label={t("rates.descriptionLabel")}
          details={t("rates.descriptionHelp")}
          value={description}
          error={
            descriptionError
              ? ruleErrorMessage(descriptionError, t, {})
              : undefined
          }
          onInput={(e) => onChange({ description: fieldValue(e) })}
        />

        <s-stack gap="small-200">
          <s-text type="strong">{t("rates.deliveryLabel")}</s-text>
          <s-stack direction="inline" gap="base">
            <s-number-field
              label={t("rates.minDaysLabel")}
              value={minDeliveryDays}
              min={0}
              max={365}
              step={1}
              error={daysError ? ruleErrorMessage(daysError, t, {}) : undefined}
              onInput={(e) => onChange({ minDeliveryDays: fieldValue(e) })}
            />
            <s-number-field
              label={t("rates.maxDaysLabel")}
              value={maxDeliveryDays}
              min={0}
              max={365}
              step={1}
              onInput={(e) => onChange({ maxDeliveryDays: fieldValue(e) })}
            />
          </s-stack>
        </s-stack>
      </s-stack>
    </s-section>
  );
}
