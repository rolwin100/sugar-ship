import { useTranslation } from "react-i18next";
import { RATE_OUTCOME } from "../../lib/constants";
import type { RateOutcome } from "../../lib/types";
import { fieldValue } from "../field-events";
import type { HistoryFiltersBarProps } from "./types";
import { OUTCOME_KEYS } from "./utils";

const OUTCOMES = Object.values(RATE_OUTCOME);

/** Filter by result and by test or live checkouts. */
export function HistoryFiltersBar({ query, onChange }: HistoryFiltersBarProps) {
  const { t } = useTranslation();
  const { filters } = query;
  const mode =
    filters.testMode === undefined ? "" : filters.testMode ? "test" : "live";

  return (
    <s-grid gridTemplateColumns="1fr 1fr" gap="small-200">
      <s-select
        label={t("history.filterResult")}
        value={filters.outcome ?? ""}
        onChange={(e) => {
          const value = fieldValue(e);
          const { outcome: _, ...rest } = filters;
          onChange({
            filters: value ? { ...rest, outcome: value as RateOutcome } : rest,
            page: 1,
          });
        }}
      >
        <s-option value="">{t("history.filterAll")}</s-option>
        {OUTCOMES.map((outcome) => (
          <s-option key={outcome} value={outcome}>
            {t(OUTCOME_KEYS[outcome])}
          </s-option>
        ))}
      </s-select>
      <s-select
        label={t("history.filterMode")}
        value={mode}
        onChange={(e) => {
          const value = fieldValue(e);
          const { testMode: _, ...rest } = filters;
          onChange({
            filters: value ? { ...rest, testMode: value === "test" } : rest,
            page: 1,
          });
        }}
      >
        <s-option value="">{t("history.filterAll")}</s-option>
        <s-option value="test">{t("history.modeTest")}</s-option>
        <s-option value="live">{t("history.modeLive")}</s-option>
      </s-select>
    </s-grid>
  );
}
