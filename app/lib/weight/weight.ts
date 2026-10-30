// Weights are stored in grams (what Shopify sends). Merchants type kilograms for now;
// the Settings page can add other units later (plan step 3.9).

const GRAMS_PER_KG = 1000;

/**
 * "1.5" kg → 1500 g. Returns null for empty text, and NaN for text that isn't a valid
 * non-negative amount or is finer than a gram (so the caller can show an error).
 */
export function kgToGrams(text: string): number | null {
  const cleaned = text.trim().replace(/[\s,]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,3})?$/.test(cleaned)) return Number.NaN;

  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * GRAMS_PER_KG + Number(fraction.padEnd(3, "0"));
}

/** 1500 g → "1.5" kg, for an input field (no unit, no grouping). */
export function gramsToKg(grams: number): string {
  return String(grams / GRAMS_PER_KG);
}
