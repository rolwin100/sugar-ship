import { useTranslation } from "react-i18next";

export function AddRateButton() {
  const { t } = useTranslation();

  return (
    <s-button slot="primary-action" variant="primary" href="/app/rates/new">
      {t("rates.addRate")}
    </s-button>
  );
}
