import { useTranslation } from "react-i18next";

export function AddZoneButton() {
  const { t } = useTranslation();

  return (
    <s-button slot="primary-action" variant="primary" href="/app/zones/new">
      {t("zones.addZone")}
    </s-button>
  );
}
