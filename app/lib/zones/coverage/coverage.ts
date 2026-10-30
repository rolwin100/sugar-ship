import { countryName, listStates } from "../../geo/geo";
import type { Zone } from "../types";

/** What a zone covers, ready for the page to translate. */
export type ZoneCoverage =
  | { kind: "restOfWorld" }
  | { kind: "none" }
  | { kind: "states"; country: string; count: number; total: number }
  | { kind: "list"; names: string[] }
  | { kind: "count"; count: number };

/** Up to this many countries are named; more are shown as a count. */
export const COVERAGE_NAMES_MAX = 3;

/**
 * Summary for the zones list, e.g. "India · 5 of 37 states", "France, Germany" or
 * "28 countries". Country names are in the given language.
 */
export function zoneCoverage(
  zone: Pick<Zone, "restOfWorld" | "regions">,
  locale: string,
): ZoneCoverage {
  if (zone.restOfWorld) return { kind: "restOfWorld" };

  const { regions } = zone;
  if (regions.length === 0) return { kind: "none" };

  const [first] = regions;
  if (regions.length === 1 && first.provinces !== null) {
    const count = first.provinces.length;
    const total = listStates(first.country).length;
    return {
      kind: "states",
      country: countryName(first.country, locale),
      count,
      total: Math.max(total, count),
    };
  }

  if (regions.length <= COVERAGE_NAMES_MAX) {
    return {
      kind: "list",
      names: regions.map((r) => countryName(r.country, locale)),
    };
  }

  return { kind: "count", count: regions.length };
}
