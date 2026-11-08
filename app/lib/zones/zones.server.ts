import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { Prisma } from "@prisma/client";
import db from "../../db.server";
import { logger } from "../logger.server";
import {
  mapShopifyZones,
  type ShopifyDeliveryProfile,
} from "./map-shopify-zones";

/**
 * Pre-fills our zones from Shopify's General profile, once. Does nothing if the
 * shop already has zones, so merchant edits are never overwritten.
 */
export async function importZonesFromShopify(
  admin: AdminApiContext,
  shopId: string,
) {
  const existing = await db.zone.count({ where: { shopId } });
  if (existing > 0) return { status: "skipped" as const, count: existing };

  const response = await admin.graphql(
    `#graphql
    query SugarShipDeliveryProfileZones {
      deliveryProfiles(first: 20) {
        nodes {
          id
          default
          profileLocationGroups {
            locationGroupZones(first: 50) {
              nodes {
                zone {
                  id
                  name
                  countries {
                    code {
                      countryCode
                      restOfWorld
                    }
                    provinces {
                      code
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`,
  );
  const json = await response.json();
  const profiles: ShopifyDeliveryProfile[] =
    json.data?.deliveryProfiles?.nodes ?? [];
  const zones = mapShopifyZones(profiles);

  if (zones.length === 0) return { status: "empty" as const, count: 0 };

  await db.zone.createMany({
    data: zones.map((zone) => ({
      shopId,
      shopifyZoneId: zone.shopifyZoneId,
      name: zone.name,
      restOfWorld: zone.restOfWorld,
      regions: zone.regions as unknown as Prisma.InputJsonValue,
      sortOrder: zone.sortOrder,
    })),
  });

  logger.info(
    { module: "zones", shopId, count: zones.length },
    "imported zones from Shopify",
  );
  return { status: "imported" as const, count: zones.length };
}
