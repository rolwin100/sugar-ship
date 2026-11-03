import { useTranslation } from "react-i18next";
import { historyQueryString } from "../../lib/rate-log";
import type { HistoryPaginationProps } from "./types";

/** Newer / Older page links, keeping the filters. */
export function HistoryPagination({ query, hasNext }: HistoryPaginationProps) {
  const { t } = useTranslation();
  const link = (page: number) =>
    `/app/history${historyQueryString({ ...query, page })}`;
  if (query.page === 1 && !hasNext) return null;

  return (
    <s-stack direction="inline" gap="small-200" justifyContent="center">
      <s-button
        icon="chevron-left"
        disabled={query.page === 1}
        href={link(query.page - 1)}
      >
        {t("history.newer")}
      </s-button>
      <s-button
        icon="chevron-right"
        disabled={!hasNext}
        href={link(query.page + 1)}
      >
        {t("history.older")}
      </s-button>
    </s-stack>
  );
}
