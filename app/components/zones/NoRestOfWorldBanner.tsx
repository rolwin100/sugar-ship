import { useTranslation } from "react-i18next";

export function NoRestOfWorldBanner() {
  const { t } = useTranslation();

  return (
    <s-banner tone="warning" heading={t("zones.noRestOfWorldTitle") + ":"}>
      {t("zones.noRestOfWorldBody")}
    </s-banner>
  );
}
