import { useTranslation } from "react-i18next";

/** Opens the cart simulator from the Rates page. */
export function TestRatesButton() {
  const { t } = useTranslation();
  return (
    <s-button slot="secondary-actions" href="/app/simulator">
      {t("simulator.title")}
    </s-button>
  );
}
