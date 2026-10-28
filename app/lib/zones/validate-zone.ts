import { normCountry, normState } from "./codes";
import type { Region, Zone } from "./types";

/** What the zone form sends. */
export type ZoneInput = {
  name: string;
  restOfWorld: boolean;
  regions: Region[];
};

/** Each key maps to a `zones.error<Key>` translation; the extra fields fill its placeholders. */
export type ZoneErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "regionsRequired"
  | "statesRequired"
  | "restOfWorldExists"
  | "countryTaken"
  | "stateTaken";

export type ZoneError = {
  field: "name" | "regions";
  key: ZoneErrorKey;
  country?: string;
  state?: string;
  zone?: string;
};

export type ZoneValidation =
  | { ok: true; zone: ZoneInput }
  | { ok: false; errors: ZoneError[] };

export const ZONE_NAME_MAX = 100;

/**
 * Checks a zone before saving and returns a cleaned copy (trimmed name, upper-case
 * codes, duplicate countries merged). `others` = the shop's other zones, not this one.
 *
 * Overlap rules: the same whole country or the same state can't be in two zones.
 * A state zone next to a whole-country zone is fine — the most specific one wins.
 */
export function validateZone(input: ZoneInput, others: Zone[]): ZoneValidation {
  const errors: ZoneError[] = [];
  const name = input.name.trim();

  if (!name) errors.push({ field: "name", key: "nameRequired" });
  else if (name.length > ZONE_NAME_MAX) errors.push({ field: "name", key: "nameTooLong" });

  if (input.restOfWorld) {
    const existing = others.find((zone) => zone.restOfWorld);
    if (existing) {
      errors.push({ field: "regions", key: "restOfWorldExists", zone: existing.name });
    }
    // Rest of world covers everything not in another zone, so it lists no countries.
    return errors.length
      ? { ok: false, errors }
      : { ok: true, zone: { name, restOfWorld: true, regions: [] } };
  }

  const regions = mergeRegions(input.regions);
  if (regions.length === 0) errors.push({ field: "regions", key: "regionsRequired" });

  for (const region of regions) {
    if (region.provinces !== null && region.provinces.length === 0) {
      errors.push({ field: "regions", key: "statesRequired", country: region.country });
    }
  }

  for (const region of regions) {
    for (const other of others) {
      const theirs = other.regions.find((r) => normCountry(r.country) === region.country);
      if (!theirs) continue;

      if (region.provinces === null && theirs.provinces === null) {
        errors.push({
          field: "regions",
          key: "countryTaken",
          country: region.country,
          zone: other.name,
        });
      } else if (region.provinces && theirs.provinces) {
        const taken = new Set(theirs.provinces.map(normState));
        const clash = region.provinces.find((p) => taken.has(normState(p)));
        if (clash) {
          errors.push({
            field: "regions",
            key: "stateTaken",
            country: region.country,
            state: clash,
            zone: other.name,
          });
        }
      }
    }
  }

  return errors.length
    ? { ok: false, errors }
    : { ok: true, zone: { name, restOfWorld: false, regions } };
}

/**
 * Upper-cases codes and merges repeats of the same country. "Whole country" wins
 * over a state list; state lists are combined without duplicates.
 */
function mergeRegions(regions: Region[]): Region[] {
  const byCountry = new Map<string, Region>();

  for (const region of regions) {
    const country = normCountry(region.country);
    if (!country) continue;
    const provinces =
      region.provinces === null ? null : region.provinces.map(normCountry).filter(Boolean);

    const existing = byCountry.get(country);
    if (!existing) {
      byCountry.set(country, { country, provinces });
    } else if (existing.provinces === null || provinces === null) {
      existing.provinces = null;
    } else {
      const seen = new Set(existing.provinces.map(normState));
      for (const p of provinces) {
        if (!seen.has(normState(p))) {
          existing.provinces.push(p);
          seen.add(normState(p));
        }
      }
    }
  }

  return [...byCountry.values()];
}

/**
 * Reads the zone the edit page posts (as JSON). Returns null if the shape is wrong,
 * so the action can reject it before validating.
 */
export function parseZoneInput(raw: unknown): ZoneInput | null {
  if (typeof raw !== "string") return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const { name, restOfWorld, regions } = value as Record<string, unknown>;
  if (typeof name !== "string" || typeof restOfWorld !== "boolean" || !Array.isArray(regions)) {
    return null;
  }

  const parsed: Region[] = [];
  for (const region of regions) {
    if (!region || typeof region !== "object" || Array.isArray(region)) return null;
    const { country, provinces } = region as Record<string, unknown>;
    if (typeof country !== "string") return null;
    if (provinces === null) {
      parsed.push({ country, provinces: null });
    } else if (Array.isArray(provinces) && provinces.every((p) => typeof p === "string")) {
      parsed.push({ country, provinces: provinces as string[] });
    } else {
      return null;
    }
  }

  return { name, restOfWorld, regions: parsed };
}
