import { RATE_OUTCOME } from "../../constants";
import type { RateOutcome } from "../../types";
import type {
  HistoryItem,
  HistoryLine,
  HistoryRate,
  StoredRateLog,
} from "../types";

// RateLog keeps Shopify's request and our answer as JSON, so every value is checked
// here instead of trusted: a missing or odd value becomes null, 0 or is skipped.

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" ? value : null);
const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;

const OUTCOMES = Object.values(RATE_OUTCOME) as readonly string[];

function toLine(value: unknown): HistoryLine | null {
  if (!isObject(value)) return null;
  return {
    name: text(value.name) ?? "",
    sku: text(value.sku),
    quantity: count(value.quantity),
    grams: count(value.grams),
    price: count(value.price),
  };
}

/** "2026-11-04 00:00:00 +0000" → "2026-11-04". */
const day = (value: unknown) => text(value)?.slice(0, 10) ?? null;

function toRate(value: unknown): HistoryRate | null {
  if (!isObject(value)) return null;
  const price = Number(text(value.total_price));
  return {
    name: text(value.service_name) ?? "",
    description: text(value.description) ?? "",
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    minDeliveryDate: day(value.min_delivery_date),
    maxDeliveryDate: day(value.max_delivery_date),
  };
}

const list = <T>(value: unknown, read: (v: unknown) => T | null): T[] =>
  Array.isArray(value)
    ? value.flatMap((v) => {
        const item = read(v);
        return item ? [item] : [];
      })
    : [];

/** A RateLog row → what the History page shows, with the cart's totals worked out. */
export function toHistoryItem(row: StoredRateLog): HistoryItem {
  const destination = isObject(row.destination) ? row.destination : {};
  const lines = list(row.items, toLine);

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    currency: row.currency,
    destination: {
      country: text(destination.country),
      province: text(destination.province),
      city: text(destination.city),
      postcode: text(destination.postal_code),
    },
    lines,
    totals: {
      subtotal: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      weight: lines.reduce((sum, l) => sum + l.grams * l.quantity, 0),
      quantity: lines.reduce((sum, l) => sum + l.quantity, 0),
    },
    rates: list(row.rates, toRate),
    outcome: OUTCOMES.includes(row.outcome)
      ? (row.outcome as RateOutcome)
      : RATE_OUTCOME.ERROR,
    testMode: row.testMode,
    durationMs: row.durationMs,
    error: row.error,
  };
}
