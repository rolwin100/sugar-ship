import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import {
  mergeLines,
  pickedToLines,
  type PickedProduct,
} from "../../lib/simulator";
import { SimulatorLineRow } from "./SimulatorLineRow";
import type { SimulatorProductsProps } from "./types";
import { simulatorErrorMessage } from "./utils";

/** The test cart's products: picked from the store with Shopify's product picker. */
export function SimulatorProducts({
  lines,
  currency,
  errors,
  onChange,
}: SimulatorProductsProps) {
  const { t } = useTranslation();
  const shopify = useAppBridge();

  const add = async () => {
    const picked = await shopify.resourcePicker({
      type: "product",
      multiple: true,
    });
    if (!picked) return; // closed without choosing
    onChange(
      mergeLines(
        lines,
        pickedToLines(picked as unknown as PickedProduct[], currency),
      ),
    );
  };

  const errorFor = (index: number) => {
    const error = errors.find((e) => e.field === "lines" && e.line === index);
    return error ? simulatorErrorMessage(error, t) : undefined;
  };

  return (
    <s-stack gap="small-200">
      <s-heading>{t("simulator.productsHeading")}</s-heading>
      <s-text color="subdued">{t("simulator.productsIntro")}</s-text>
      {lines.map((line, index) => (
        <SimulatorLineRow
          key={line.variantId}
          line={line}
          currency={currency}
          error={errorFor(index)}
          onQuantity={(quantity) =>
            onChange(
              lines.map((l, i) => (i === index ? { ...l, quantity } : l)),
            )
          }
          onRemove={() => onChange(lines.filter((_, i) => i !== index))}
        />
      ))}
      <s-stack direction="inline">
        <s-button onClick={add}>{t("simulator.addProducts")}</s-button>
      </s-stack>
    </s-stack>
  );
}
