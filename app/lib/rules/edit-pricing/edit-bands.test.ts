import { describe, expect, it } from "vitest";
import type { PriceBandDraft } from "../types";
import { BANDS_MAX } from "../validate-rule";
import {
  addBand,
  removeBand,
  replaceBandPrice,
  replaceBandTo,
  resetBandLimits,
} from "./edit-bands";

const band = (from: string, to: string, price: string): PriceBandDraft => ({
  from,
  to,
  price,
});

const table = [
  band("0", "1", "50"),
  band("1", "5", "90"),
  band("5", "", "150"),
];

describe("addBand", () => {
  it("starts the new row where the last one ends", () => {
    expect(addBand([band("0", "2", "50")])).toEqual([
      band("0", "2", "50"),
      band("2", "", ""),
    ]);
  });

  it("starts at 0 when there are no rows", () => {
    expect(addBand([])).toEqual([band("0", "", "")]);
  });

  it("stops at the limit", () => {
    const full = Array.from({ length: BANDS_MAX }, () => band("0", "", ""));
    expect(addBand(full)).toBe(full);
  });
});

describe("removeBand", () => {
  it("joins the neighbours up", () => {
    expect(removeBand(table, 1)).toEqual([
      band("0", "1", "50"),
      band("1", "", "150"),
    ]);
  });

  it("makes the new first row start at 0", () => {
    expect(removeBand(table, 0)[0]).toEqual(band("0", "5", "90"));
  });

  it("keeps the last remaining row", () => {
    const one = [band("0", "", "50")];
    expect(removeBand(one, 0)).toBe(one);
  });
});

describe("replaceBandTo", () => {
  it("moves the next row's start along with it", () => {
    expect(replaceBandTo(table, 0, "2")).toEqual([
      band("0", "2", "50"),
      band("2", "5", "90"),
      band("5", "", "150"),
    ]);
  });
});

describe("replaceBandPrice", () => {
  it("changes only that row's price", () => {
    expect(replaceBandPrice(table, 2, "200")[2]).toEqual(band("5", "", "200"));
    expect(table[2].price).toBe("150");
  });
});

describe("resetBandLimits", () => {
  it("clears limits and keeps prices", () => {
    expect(resetBandLimits(table)).toEqual([
      band("0", "", "50"),
      band("", "", "90"),
      band("", "", "150"),
    ]);
  });
});
