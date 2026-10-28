import { normCountry as norm, normState } from "../zones/codes";
import type { Zone, ZoneAddress } from "../zones/types";

/**
 * Finds the one zone an address belongs to, most specific first:
 *   1. a zone that lists the address's state
 *   2. a zone that covers the whole country
 *   3. the Rest of world zone
 * Ties go to the lower sortOrder, then the earlier zone. Returns null if none match.
 */
export function matchZone(
  destination: ZoneAddress,
  zones: Zone[],
): Zone | null {
  const country = norm(destination.country);
  const province = normState(destination.province);
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
        region.provinces.some((p) => normState(p) === province),
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
