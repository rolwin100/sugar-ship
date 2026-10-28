import { useTranslation } from "react-i18next";
import { AddZoneButton } from "./AddZoneButton";

export function ZonesEmptyState() {
  const { t } = useTranslation();

  return (
    <s-section>
      <s-empty-state heading={t("zones.emptyHeading")}>
        <s-paragraph>{t("zones.emptyBody")}</s-paragraph>
        <AddZoneButton />
      </s-empty-state>
    </s-section>
  );
}
