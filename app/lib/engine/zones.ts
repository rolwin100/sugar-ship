import type { EngineAddress, EngineZone } from "./types";

const norm = (value: string | null | undefined) =>
  (value ?? "").trim().toUpperCase();

/**
 * Finds the one zone an address belongs to, most specific first:
 *   1. a zone that lists the address's state
 *   2. a zone that covers the whole country
 *   3. the Rest of world zone
 * Ties go to the lower sortOrder, then the earlier zone. Returns null if none match.
 */
export function matchZone(
  destination: EngineAddress,
  zones: EngineZone[],
): EngineZone | null {
  const country = norm(destination.country);
  const province = norm(destination.province);
  if (!country) return null;

  const ordered = zones
    .map((zone, index) => ({ zone, index }))
    .sort(
      (a, b) =>
        (a.zone.sortOrder ?? 0) - (b.zone.sortOrder ?? 0) || a.index - b.index,
    )
    .map(({ zone }) => zone);

  const stateZone = ordered.find((zone) =>
    zone.regions.some(
      (region) =>
        norm(region.country) === country &&
        region.provinces !== null &&
        province !== "" &&
        region.provinces.some((p) => norm(p) === province),
    ),
  );
  if (stateZone) return stateZone;

  const countryZone = ordered.find((zone) =>
    zone.regions.some(
      (region) => norm(region.country) === country && region.provinces === null,
    ),
  );
  if (countryZone) return countryZone;

  // Rest of world covers every country and state that isn't in another zone.
  return ordered.find((zone) => zone.restOfWorld) ?? null;
}
