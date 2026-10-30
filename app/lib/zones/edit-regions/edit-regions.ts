import { normCountry, normState } from "../codes";
import type { TakenIndex } from "../taken";
import type { Region } from "../types";

// Pure helpers for editing a zone's regions. Each takes the current list and returns
// a new one, never changing the original. `country` is an already-normalised code.

export function updateRegion(
  regions: Region[],
  country: string,
  update: (region: Region) => Region,
): Region[] {
  return regions.map((r) =>
    normCountry(r.country) === country ? update(r) : r,
  );
}

export function addCountry(
  regions: Region[],
  country: string,
  taken: TakenIndex,
): Region[] {
  // If another zone has the whole country, this zone can only take some of its states.
  return [
    ...regions,
    { country, provinces: taken.whole.has(country) ? [] : null },
  ];
}

export function removeCountry(regions: Region[], country: string): Region[] {
  return regions.filter((r) => normCountry(r.country) !== country);
}

/** Replaces the country's states, or uses `null` for the whole country. */
export function replaceCountryStates(
  regions: Region[],
  country: string,
  provinces: string[] | null,
): Region[] {
  return updateRegion(regions, country, (r) => ({ ...r, provinces }));
}

export function toggleCountryState(
  regions: Region[],
  country: string,
  state: string,
  on: boolean,
): Region[] {
  return updateRegion(regions, country, (r) => {
    const current = r.provinces ?? [];
    return {
      ...r,
      provinces: on
        ? [...current, state]
        : current.filter((p) => normState(p) !== normState(state)),
    };
  });
}
