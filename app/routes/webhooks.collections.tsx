import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { findInstalledShopId } from "../lib/shop.server";
import { readWebhookId } from "../lib/products";
import {
  refreshCollection,
  removeCollection,
} from "../lib/products/product-webhooks.server";

/** collections/create, collections/update, collections/delete: keep memberships current. */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, payload, shop, topic } = await authenticate.webhook(request);
  const shopId = await findInstalledShopId(shop);
  const collectionId = readWebhookId(payload, "Collection");
  if (!shopId || collectionId === null) return new Response();

  try {
    // The library may report the topic as "COLLECTIONS_DELETE" or "collections/delete".
    if (topic === "COLLECTIONS_DELETE" || topic === "collections/delete") {
      await removeCollection(shopId, collectionId);
    } else if (admin) {
      await refreshCollection(admin, shopId, collectionId);
    }
  } catch (error) {
    console.error(`[sugar-ship] ${topic} failed for ${shop}`, error);
    return new Response(null, { status: 500 }); // Shopify retries later
  }
  return new Response();
};
