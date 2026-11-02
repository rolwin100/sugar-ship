import type { PriceBandDraft } from "../types";
import { BANDS_MAX } from "../validate-rule";

// Pure helpers for editing one zone's price table. Each takes the rows and returns
// new ones. Rows stay joined up: the first starts at 0 and each row starts where the
// one before it ends, so the merchant only types each row's "to" and price.

/** Adds a row after the last one, starting where it ends; does nothing at the limit. */
export function addBand(bands: PriceBandDraft[]): PriceBandDraft[] {
  if (bands.length >= BANDS_MAX) return bands;
  const from = bands.length === 0 ? "0" : bands[bands.length - 1].to;
  return [...bands, { from, to: "", price: "" }];
}

/** Removes a row and joins its neighbours up; the last remaining row can't be removed. */
export function removeBand(
  bands: PriceBandDraft[],
  index: number,
): PriceBandDraft[] {
  if (bands.length <= 1) return bands;
  return linkBands(bands.filter((_, i) => i !== index));
}

/** Types a row's upper limit; the next row then starts there. */
export function replaceBandTo(
  bands: PriceBandDraft[],
  index: number,
  text: string,
): PriceBandDraft[] {
  return linkBands(bands.map((b, i) => (i === index ? { ...b, to: text } : b)));
}

export function replaceBandPrice(
  bands: PriceBandDraft[],
  index: number,
  text: string,
): PriceBandDraft[] {
  return bands.map((b, i) => (i === index ? { ...b, price: text } : b));
}

/** Clears every row's limits (keeping prices), for when the basis changes. */
export function resetBandLimits(bands: PriceBandDraft[]): PriceBandDraft[] {
  return linkBands(bands.map((b) => ({ ...b, to: "" })));
}

/** First row from 0, every other row from the previous row's "to". */
function linkBands(bands: PriceBandDraft[]): PriceBandDraft[] {
  return bands.map((b, i) => ({
    ...b,
    from: i === 0 ? "0" : bands[i - 1].to,
  }));
}
