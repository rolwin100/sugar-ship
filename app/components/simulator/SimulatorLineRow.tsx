import { useTranslation } from "react-i18next";
import { formatMoney } from "../../lib/money";
import { gramsToKg } from "../../lib/weight";
import { fieldValue } from "../field-events";
import type { SimulatorLineRowProps } from "./types";

/** One product in the test cart: its name, price and weight, and how many. */
export function SimulatorLineRow({
  line,
  currency,
  error,
  onQuantity,
  onRemove,
}: SimulatorLineRowProps) {
  const { t, i18n } = useTranslation();

  return (
    <s-grid
      gridTemplateColumns="1fr 8rem auto"
      gap="small-200"
      alignItems="center"
    >
      <s-stack gap="small-100">
        <s-text type="strong">{line.title}</s-text>
        <s-text color="subdued">
          {t("simulator.lineDetails", {
            price: formatMoney(line.price, currency, i18n.language),
            weight: t("simulator.kg", { value: gramsToKg(line.grams) }),
          })}
        </s-text>
      </s-stack>
      <s-number-field
        label={t("simulator.lineQuantityLabel", { title: line.title })}
        labelAccessibilityVisibility="exclusive"
        min={1}
        step={1}
        value={line.quantity}
        error={error}
        onInput={(e) => onQuantity(fieldValue(e))}
      />
      <s-button
        variant="tertiary"
        icon="delete"
        accessibilityLabel={t("simulator.removeLine", { title: line.title })}
        onClick={onRemove}
      />
    </s-grid>
  );
}
