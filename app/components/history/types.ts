import type { HistoryItem, HistoryQuery } from "../../lib/rate-log";

export type HistoryTableProps = {
  items: HistoryItem[];
  /** A row was clicked: show its details. */
  onSelect: (item: HistoryItem) => void;
};

export type HistoryRowProps = {
  item: HistoryItem;
  onSelect: (item: HistoryItem) => void;
};

/** The checkout to show, or null before any row is clicked. */
export type HistoryDetailModalProps = { item: HistoryItem | null };

export type HistoryFiltersBarProps = {
  query: HistoryQuery;
  /** Called with the new filters; the page goes back to 1. */
  onChange: (query: HistoryQuery) => void;
};

export type HistoryPaginationProps = {
  query: HistoryQuery;
  hasNext: boolean;
};
