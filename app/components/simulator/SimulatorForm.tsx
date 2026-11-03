import { useTranslation } from "react-i18next";
import { hasStates, listStates } from "../../lib/geo/geo";
import type { SimulatorDraft } from "../../lib/simulator";
import { fieldValue } from "../field-events";
import type { SimulatorFormProps } from "./types";
import { simulatorErrorMessage } from "./utils";

/** "Test a checkout": the address and cart totals to try. */
export function SimulatorForm({
  draft,
  countries,
  currency,
  errors,
  busy,
  onChange,
  onSubmit,
}: SimulatorFormProps) {
  const { t } = useTranslation();
  const errorFor = (field: keyof SimulatorDraft) => {
    const error = errors.find((e) => e.field === field);
    return error ? simulatorErrorMessage(error, t) : undefined;
  };
  const showStates = draft.country !== "" && hasStates(draft.country);

  return (
    <s-section heading={t("simulator.formHeading")}>
      <s-stack gap="base">
        <s-paragraph>
          <s-text color="subdued">{t("simulator.intro")}</s-text>
        </s-paragraph>

        <s-grid
          gridTemplateColumns="1fr 1fr 1fr"
          gap="small-200"
          alignItems="start"
        >
          <s-select
            label={t("simulator.countryLabel")}
            value={draft.country}
            error={errorFor("country")}
            onChange={(e) => onChange({ country: fieldValue(e), province: "" })}
          >
            {countries.map((c) => (
              <s-option key={c.code} value={c.code}>
                {c.name}
              </s-option>
            ))}
          </s-select>
          {showStates ? (
            <s-select
              label={t("simulator.stateLabel")}
              value={draft.province}
              onChange={(e) => onChange({ province: fieldValue(e) })}
            >
              <s-option value="">{t("simulator.stateNone")}</s-option>
              {listStates(draft.country).map((s) => (
                <s-option key={s.code} value={s.code}>
                  {s.name}
                </s-option>
              ))}
            </s-select>
          ) : (
            <s-box />
          )}
          <s-text-field
            label={t("simulator.postcodeLabel")}
            value={draft.postcode}
            onInput={(e) => onChange({ postcode: fieldValue(e) })}
          />
        </s-grid>

        <s-grid
          gridTemplateColumns="1fr 1fr 1fr"
          gap="small-200"
          alignItems="start"
        >
          <s-money-field
            label={t("simulator.subtotalLabel")}
            currencyCode={currency as never}
            min={0}
            value={draft.subtotal}
            error={errorFor("subtotal")}
            onInput={(e) => onChange({ subtotal: fieldValue(e) })}
          />
          <s-number-field
            label={t("simulator.weightLabel")}
            suffix={t("rates.unitKg")}
            min={0}
            step={0.001}
            value={draft.weight}
            error={errorFor("weight")}
            onInput={(e) => onChange({ weight: fieldValue(e) })}
          />
          <s-number-field
            label={t("simulator.quantityLabel")}
            suffix={t("rates.unitItems")}
            min={1}
            step={1}
            value={draft.quantity}
            error={errorFor("quantity")}
            onInput={(e) => onChange({ quantity: fieldValue(e) })}
          />
        </s-grid>

        <s-stack direction="inline">
          <s-button variant="primary" loading={busy} onClick={onSubmit}>
            {t("simulator.check")}
          </s-button>
        </s-stack>
      </s-stack>
    </s-section>
  );
}
