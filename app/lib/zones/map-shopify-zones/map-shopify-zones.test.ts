import { describe, expect, it } from "vitest";
import {
  mapShopifyZones,
  type ShopifyDeliveryProfile,
} from "./map-shopify-zones";

const country = (
  code: string | null,
  provinces: string[] = [],
  restOfWorld = false,
) => ({
  code: { countryCode: code, restOfWorld },
  provinces: provinces.map((p) => ({ code: p })),
});

const domestic = {
  id: "gid://shopify/DeliveryZone/1",
  name: "Domestic",
  countries: [country("IN", ["KA", "KL", "MH"])],
};
const international = {
  id: "gid://shopify/DeliveryZone/2",
  name: "International",
  countries: [country("AE"), country("FR")],
};
const rest = {
  id: "gid://shopify/DeliveryZone/3",
  name: "Rest of world",
  countries: [country(null, [], true)],
};

const profile = (
  id: string,
  isDefault: boolean,
  groups: (typeof domestic)[][],
): ShopifyDeliveryProfile => ({
  id,
  default: isDefault,
  profileLocationGroups: groups.map((zones) => ({
    locationGroupZones: { nodes: zones.map((zone) => ({ zone })) },
  })),
});

describe("mapShopifyZones", () => {
  it("maps the General profile's zones in order", () => {
    const zones = mapShopifyZones([
      profile("general", true, [[domestic, international, rest]]),
    ]);
    expect(zones).toEqual([
      {
        shopifyZoneId: domestic.id,
        name: "Domestic",
        restOfWorld: false,
        regions: [{ country: "IN", provinces: ["KA", "KL", "MH"] }],
        sortOrder: 0,
      },
      {
        shopifyZoneId: international.id,
        name: "International",
        restOfWorld: false,
        regions: [
          { country: "AE", provinces: null },
          { country: "FR", provinces: null },
        ],
        sortOrder: 1,
      },
      {
        shopifyZoneId: rest.id,
        name: "Rest of world",
        restOfWorld: true,
        regions: [],
        sortOrder: 2,
      },
    ]);
  });

  it("ignores custom profiles", () => {
    const zones = mapShopifyZones([
      profile("bulky", false, [[international]]),
      profile("general", true, [[domestic]]),
    ]);
    expect(zones.map((z) => z.name)).toEqual(["Domestic"]);
  });

  it("keeps a zone once when it appears in several location groups", () => {
    const zones = mapShopifyZones([
      profile("general", true, [[domestic], [domestic, rest]]),
    ]);
    expect(zones.map((z) => z.name)).toEqual(["Domestic", "Rest of world"]);
  });

  it("returns nothing when there is no default profile", () => {
    expect(mapShopifyZones([profile("bulky", false, [[domestic]])])).toEqual(
      [],
    );
  });
});
