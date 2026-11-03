import { useTranslation } from "react-i18next";

/** No checkouts yet (with a picture and a way to test), or none matching the filters. */
export function HistoryEmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation();

  if (filtered) {
    return (
      <s-stack gap="small-200" padding="large" alignItems="center">
        <s-text type="strong">{t("history.noMatchesHeading")}</s-text>
        <s-text color="subdued">{t("history.noMatchesBody")}</s-text>
      </s-stack>
    );
  }

  return (
    <s-empty-state heading={t("history.emptyHeading")}>
      {/* Decorative, so screen readers skip it. */}
      <s-image
        slot="graphic"
        src="/history-empty.png"
        // The file is 1254px wide; draw it at 300px.
        srcSet="/history-empty.png 1254w"
        sizes="300px"
        alt=""
        accessibilityRole="presentation"
      />
      <s-text slot="subheading">{t("history.emptyBody")}</s-text>
      <s-button slot="primary-action" variant="primary" href="/app/simulator">
        {t("history.trySimulator")}
      </s-button>
    </s-empty-state>
  );
}
