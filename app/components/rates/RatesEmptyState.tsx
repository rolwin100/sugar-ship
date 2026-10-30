import { useTranslation } from "react-i18next";
import { AddRateButton } from "./AddRateButton";

/** Shown when there are no rates yet; asks for a zone first if there are none. */
export function RatesEmptyState({ hasZones }: { hasZones: boolean }) {
  const { t } = useTranslation();

  return (
    <s-section>
      <s-empty-state
        heading={t(hasZones ? "rates.emptyHeading" : "rates.noZonesHeading")}
      >
        {/* Decorative, so screen readers skip it. */}
        <s-image
          slot="graphic"
          src="/rates-empty.png"
          // The file is 1254px wide; draw it at 300px.
          srcSet="/rates-empty.png 1254w"
          sizes="300px"
          alt=""
          accessibilityRole="presentation"
        />
        <s-text slot="subheading">
          {t(hasZones ? "rates.emptyBody" : "rates.noZonesBody")}
        </s-text>

        {hasZones ? (
          <>
            <AddRateButton />
            <s-button slot="secondary-actions" href="/app/zones">
              {t("rates.viewZones")}
            </s-button>
          </>
        ) : (
          <s-button slot="primary-action" variant="primary" href="/app/zones">
            {t("rates.goToZones")}
          </s-button>
        )}
      </s-empty-state>
    </s-section>
  );
}
