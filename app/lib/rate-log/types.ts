import type { RateOutcome } from "../types";

/** A RateLog row as read from the database, before its JSON is checked (see toHistoryItem). */
export type StoredRateLog = {
  id: string;
  createdAt: Date;
  currency: string;
  locale: string | null;
  destination: unknown; // JSON
  items: unknown; // JSON
  rates: unknown; // JSON
  outcome: string;
  testMode: boolean;
  durationMs: number;
  error: string | null;
};

/** One cart line as Shopify sent it (money in subunits, weight in grams per unit). */
export type HistoryLine = {
  name: string;
  sku: string | null;
  quantity: number;
  grams: number;
  price: number;
};

/** A rate we returned for that checkout. */
export type HistoryRate = {
  name: string;
  description: string;
  price: number; // subunits
  minDeliveryDate: string | null; // "YYYY-MM-DD"
  maxDeliveryDate: string | null;
};

/** One checkout's rate request, ready for the History page. */
export type HistoryItem = {
  id: string;
  createdAt: string; // ISO
  currency: string;
  destination: {
    country: string | null;
    province: string | null;
    city: string | null;
    postcode: string | null;
  };
  lines: HistoryLine[];
  totals: { subtotal: number; weight: number; quantity: number };
  rates: HistoryRate[];
  outcome: RateOutcome;
  testMode: boolean;
  durationMs: number;
  error: string | null;
};

/** History list filters; unset = everything. */
export type HistoryFilters = {
  outcome?: RateOutcome;
  testMode?: boolean;
};

export type HistoryPage = {
  items: HistoryItem[];
  page: number; // from 1
  hasNext: boolean;
};
