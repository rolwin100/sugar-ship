// Prices are stored as integers in the currency's smallest unit ("subunits"):
// ₹80.00 → 8000, ¥500 → 500. These helpers convert to and from what merchants type.

/** How many decimals a currency uses (INR/EUR 2, JPY 0, KWD 3). */
export function currencyDecimals(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/**
 * "80", "80.5", "1,500.00" → subunits. Returns null for empty text, and NaN for text
 * that isn't a valid non-negative amount (so the caller can show an error).
 */
export function toSubunits(text: string, currency: string): number | null {
  const cleaned = text.trim().replace(/[\s,]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;

  const decimals = currencyDecimals(currency);
  const [whole, fraction = ""] = cleaned.split(".");
  if (fraction.length > decimals) return Number.NaN;
  return (
    Number(whole) * 10 ** decimals +
    Number(fraction.padEnd(decimals, "0") || "0")
  );
}

/** Subunits → plain text for an input field: 8000 → "80.00" (no grouping, no symbol). */
export function fromSubunits(subunits: number, currency: string): string {
  const decimals = currencyDecimals(currency);
  return (subunits / 10 ** decimals).toFixed(decimals);
}

/** Subunits → "₹80.00" / "80,00 €" for display. */
export function formatMoney(
  subunits: number,
  currency: string,
  locale = "en",
): string {
  const decimals = currencyDecimals(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(subunits / 10 ** decimals);
  } catch {
    return `${fromSubunits(subunits, currency)} ${currency}`;
  }
}

/** The currency's symbol as shown in this language: "INR" → "₹", "EUR" → "€". */
export function currencySymbol(currency: string, locale = "en"): string {
  try {
    const part = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value ?? currency;
  } catch {
    return currency;
  }
}
