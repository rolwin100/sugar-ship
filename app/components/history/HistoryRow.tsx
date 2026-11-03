import { useTranslation } from "react-i18next";
import { HISTORY_DETAIL_MODAL_ID } from "./HistoryDetailModal";
import type { HistoryRowProps } from "./types";
import { cartText, destinationText, outcomeBadge, timeText } from "./utils";

/** One checkout: when, where to, what was in the cart, and what we answered. Click for details. */
export function HistoryRow({ item, onSelect }: HistoryRowProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const badge = outcomeBadge(item.outcome, item.rates.length, t);

  return (
    <s-table-row clickDelegate={`history-open-${item.id}`}>
      <s-table-cell>{timeText(item.createdAt, locale)}</s-table-cell>
      <s-table-cell>
        {destinationText(item.destination, locale) || "–"}
      </s-table-cell>
      <s-table-cell>{cartText(item, t, locale)}</s-table-cell>
      <s-table-cell>
        <s-stack direction="inline" gap="small-200">
          <s-badge tone={badge.tone}>{badge.label}</s-badge>
          {item.testMode && <s-badge>{t("history.test")}</s-badge>}
        </s-stack>
      </s-table-cell>
      <s-table-cell>
        <s-button
          id={`history-open-${item.id}`}
          variant="tertiary"
          icon="view"
          accessibilityLabel={t("history.viewDetails")}
          commandFor={HISTORY_DETAIL_MODAL_ID}
          command="--show"
          onClick={() => onSelect(item)}
        />
      </s-table-cell>
    </s-table-row>
  );
}
