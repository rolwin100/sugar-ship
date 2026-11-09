// Percentages as typed ("5", "2.5") and as stored (basis points: 500, 250).

const BPS_PER_PERCENT = 100; // 5% = 500 basis points

/** "5" → 500, "2.5" → 250; null when empty, NaN for anything else (max 2 decimals). */
export function percentToBps(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return Number.NaN;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * BPS_PER_PERCENT + Number(fraction.padEnd(2, "0"));
}

/** 500 → "5", 250 → "2.5". */
export function bpsToPercent(bps: number): string {
  return String(bps / BPS_PER_PERCENT);
}
