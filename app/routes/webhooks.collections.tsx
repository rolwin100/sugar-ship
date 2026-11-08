import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { logger } from "../lib/logger.server";
import { findInstalledShopId } from "../lib/shop.server";
import { readWebhookId } from "../lib/products";
import {
  refreshCollection,
  removeCollection,
} from "../lib/products/product-webhooks.server";
import { withLogContext } from "../lib/log-context.server";

/** collections/create, collections/update, collections/delete: keep memberships current. */
const handleAction = async ({ request }: ActionFunctionArgs) => {
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
    logger.error(
      { err: error, shop, topic, module: "webhooks" },
      "webhook failed",
    );
    return new Response(null, { status: 500 }); // Shopify retries later
  }
  return new Response();
};

export const action = (args: ActionFunctionArgs) =>
  withLogContext(args.request, () => handleAction(args));
