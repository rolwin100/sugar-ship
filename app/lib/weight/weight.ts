// Weights are stored in grams (what Shopify sends). Merchants type kilograms for now;
// the Settings page (step 3.9) can add other units later.

const GRAMS_PER_KG = 1000;

/**
 * "1.5" kg → 1500 g. Returns null for empty text, and NaN for text that isn't a
 * non-negative amount with at most 3 decimals (whole grams). Uses "." as the decimal
 * separator, which is what Polaris number fields send.
 */
export function kgToGrams(text: string): number | null {
  const cleaned = text.trim();
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,3})?$/.test(cleaned)) return Number.NaN;

  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * GRAMS_PER_KG + Number(fraction.padEnd(3, "0"));
}

/** 1500 g → "1.5", 2000 g → "2" (kilograms, for an input field). */
export function gramsToKg(grams: number): string {
  return String(Number((grams / GRAMS_PER_KG).toFixed(3)));
}
