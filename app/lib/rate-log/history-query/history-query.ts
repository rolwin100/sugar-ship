import { RATE_OUTCOME } from "../../constants";
import type { RateOutcome } from "../../types";
import type { HistoryFilters } from "../types";

/** What the History page's URL says: filters and page, e.g. ?outcome=fallback&mode=test&page=2. */
export type HistoryQuery = { filters: HistoryFilters; page: number };

const OUTCOMES = Object.values(RATE_OUTCOME) as readonly string[];

/** Reads the URL's query; anything unknown is ignored. */
export function readHistoryQuery(params: URLSearchParams): HistoryQuery {
  const outcome = params.get("outcome");
  const mode = params.get("mode");
  const page = Number(params.get("page"));

  return {
    filters: {
      ...(outcome && OUTCOMES.includes(outcome)
        ? { outcome: outcome as RateOutcome }
        : {}),
      ...(mode === "test" ? { testMode: true } : {}),
      ...(mode === "live" ? { testMode: false } : {}),
    },
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** The query string for a filters + page combination ("" for the default view). */
export function historyQueryString({ filters, page }: HistoryQuery): string {
  const params = new URLSearchParams();
  if (filters.outcome) params.set("outcome", filters.outcome);
  if (filters.testMode !== undefined) {
    params.set("mode", filters.testMode ? "test" : "live");
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
