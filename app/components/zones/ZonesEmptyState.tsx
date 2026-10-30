import { useTranslation } from "react-i18next";
import { AddZoneButton } from "./AddZoneButton";

export function ZonesEmptyState() {
  const { t } = useTranslation();

  return (
    <s-section>
      <s-empty-state heading={t("zones.emptyHeading")}>
        {/* Decorative, so screen readers skip it. */}
        <s-image
          slot="graphic"
          src="/zone-empty.png"
          // The file is 1254px wide; draw it at 300px.
          srcSet="/zone-empty.png 1254w"
          sizes="300px"
          alt=""
          accessibilityRole="presentation"
        />
        <s-text slot="subheading">{t("zones.emptyBody")}</s-text>
        <AddZoneButton />
      </s-empty-state>
    </s-section>
  );
}
