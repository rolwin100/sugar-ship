import type { Region } from "./types";

// ---- Shopify response shape (only the fields we query) ----------------------

type ShopifyCountry = {
  code: { countryCode: string | null; restOfWorld: boolean };
  provinces: { code: string }[];
};

type ShopifyZone = { id: string; name: string; countries: ShopifyCountry[] };

export type ShopifyDeliveryProfile = {
  id: string;
  default: boolean;
  profileLocationGroups: {
    locationGroupZones: { nodes: { zone: ShopifyZone }[] };
  }[];
};

export type ImportedZone = {
  shopifyZoneId: string;
  name: string;
  restOfWorld: boolean;
  regions: Region[];
  sortOrder: number;
};

/**
 * Pure: turns the default (General) profile's zones into our Zone shape.
 * Empty province list = whole country. Zones repeated across location groups
 * are kept once, in Shopify's order.
 */
export function mapShopifyZones(
  profiles: ShopifyDeliveryProfile[],
): ImportedZone[] {
  const general = profiles.find((profile) => profile.default);
  if (!general) return [];

  const seen = new Set<string>();
  const zones: ImportedZone[] = [];

  for (const group of general.profileLocationGroups) {
    for (const { zone } of group.locationGroupZones.nodes) {
      if (seen.has(zone.id)) continue;
      seen.add(zone.id);

      let restOfWorld = false;
      const regions: Region[] = [];
      for (const country of zone.countries) {
        if (country.code.restOfWorld) {
          restOfWorld = true;
          continue;
        }
        if (!country.code.countryCode) continue;
        regions.push({
          country: country.code.countryCode,
          provinces:
            country.provinces.length > 0
              ? country.provinces.map((province) => province.code)
              : null,
        });
      }

      zones.push({
        shopifyZoneId: zone.id,
        name: zone.name,
        restOfWorld,
        regions,
        sortOrder: zones.length,
      });
    }
  }

  return zones;
}
