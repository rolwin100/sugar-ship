import { useTranslation } from "react-i18next";
import { HistoryRow } from "./HistoryRow";
import type { HistoryTableProps } from "./types";

export function HistoryTable({ items, onSelect }: HistoryTableProps) {
  const { t } = useTranslation();

  return (
    <s-table>
      <s-table-header-row>
        <s-table-header listSlot="primary">
          {t("history.colTime")}
        </s-table-header>
        <s-table-header listSlot="secondary">
          {t("history.colDestination")}
        </s-table-header>
        <s-table-header listSlot="labeled">
          {t("history.colCart")}
        </s-table-header>
        <s-table-header listSlot="inline">
          {t("history.colResult")}
        </s-table-header>
        <s-table-header>
          <s-text accessibilityVisibility="exclusive">
            {t("history.viewDetails")}
          </s-text>
        </s-table-header>
      </s-table-header-row>
      <s-table-body>
        {items.map((item) => (
          <HistoryRow key={item.id} item={item} onSelect={onSelect} />
        ))}
      </s-table-body>
    </s-table>
  );
}
