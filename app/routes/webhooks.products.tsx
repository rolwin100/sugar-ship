import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { logger } from "../lib/logger.server";
import { findInstalledShopId } from "../lib/shop.server";
import { readWebhookId } from "../lib/products";
import { refreshProduct } from "../lib/products/product-webhooks.server";
import { deleteProduct } from "../lib/products/product-store.server";
import { withLogContext } from "../lib/log-context.server";

/** products/create, products/update, products/delete: keep ProductSnapshot current. */
const handleAction = async ({ request }: ActionFunctionArgs) => {
  const { admin, payload, shop, topic } = await authenticate.webhook(request);
  const shopId = await findInstalledShopId(shop);
  const productId = readWebhookId(payload, "Product");
  if (!shopId || productId === null) return new Response();

  try {
    // The library may report the topic as "PRODUCTS_DELETE" or "products/delete".
    if (topic === "PRODUCTS_DELETE" || topic === "products/delete") {
      await deleteProduct(shopId, productId);
    } else if (admin) {
      await refreshProduct(admin, shopId, productId);
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
