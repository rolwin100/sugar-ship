import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { CarrierServiceNode } from "./types";

export const CARRIER_SERVICE_NAME = "Sugar Ship";

export function getRatesCallbackUrl(): string {
  const appUrl = (process.env.SHOPIFY_APP_URL ?? "").replace(/\/$/, "");
  return `${appUrl}/api/rates`;
}

/**
 * Makes sure this shop has exactly one active "Sugar Ship" carrier service
 * pointing at our current callback URL. Safe to call on every admin load:
 * it only writes when something is missing or out of date (e.g. a new dev tunnel URL).
 */
export async function ensureCarrierService(admin: AdminApiContext) {
  const callbackUrl = getRatesCallbackUrl();

  const listResponse = await admin.graphql(
    `#graphql
    query SugarShipCarrierServices {
      carrierServices(first: 25) {
        nodes {
          id
          name
          callbackUrl
          active
        }
      }
    }`,
  );
  const listJson = await listResponse.json();
  const nodes: CarrierServiceNode[] =
    listJson.data?.carrierServices?.nodes ?? [];
  const existing = nodes.find((node) => node.name === CARRIER_SERVICE_NAME);

  if (!existing) {
    const createResponse = await admin.graphql(
      `#graphql
      mutation SugarShipCarrierServiceCreate($input: DeliveryCarrierServiceCreateInput!) {
        carrierServiceCreate(input: $input) {
          carrierService {
            id
            callbackUrl
            active
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            name: CARRIER_SERVICE_NAME,
            callbackUrl,
            supportsServiceDiscovery: true,
            active: true,
          },
        },
      },
    );
    const createJson = await createResponse.json();
    const errors = createJson.data?.carrierServiceCreate?.userErrors ?? [];
    if (errors.length > 0) {
      console.error("[sugar-ship] carrierServiceCreate failed", errors);
      return { status: "error" as const, errors };
    }
    const createdId: string | undefined =
      createJson.data?.carrierServiceCreate?.carrierService?.id;
    console.log(`[sugar-ship] carrier service created -> ${callbackUrl}`);
    return { status: "created" as const, id: createdId };
  }

  if (existing.callbackUrl === callbackUrl && existing.active) {
    return { status: "ok" as const, id: existing.id };
  }

  const updateResponse = await admin.graphql(
    `#graphql
    mutation SugarShipCarrierServiceUpdate($input: DeliveryCarrierServiceUpdateInput!) {
      carrierServiceUpdate(input: $input) {
        carrierService {
          id
          callbackUrl
          active
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        input: { id: existing.id, callbackUrl, active: true },
      },
    },
  );
  const updateJson = await updateResponse.json();
  const errors = updateJson.data?.carrierServiceUpdate?.userErrors ?? [];
  if (errors.length > 0) {
    console.error("[sugar-ship] carrierServiceUpdate failed", errors);
    return { status: "error" as const, errors };
  }
  console.log(`[sugar-ship] carrier service updated -> ${callbackUrl}`);
  return { status: "updated" as const, id: existing.id };
}
