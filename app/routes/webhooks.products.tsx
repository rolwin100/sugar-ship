import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { findInstalledShopId } from "../lib/shop.server";
import { readWebhookId } from "../lib/products";
import { refreshProduct } from "../lib/products/product-webhooks.server";
import { deleteProduct } from "../lib/products/product-store.server";

/** products/create, products/update, products/delete: keep ProductSnapshot current. */
export const action = async ({ request }: ActionFunctionArgs) => {
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
    console.error(`[sugar-ship] ${topic} failed for ${shop}`, error);
    return new Response(null, { status: 500 }); // Shopify retries later
  }
  return new Response();
};
