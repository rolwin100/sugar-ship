import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { markProductsSynced } from "../shop.server";
import { adminQuery } from "./admin-query.server";
import { deleteStaleProducts, upsertProducts } from "./product-store.server";
import { readCollectionsPage, readProductsPage } from "./read-products-page";
import { syncAllProducts } from "./sync-all-products";
import type { ProductsClient } from "./types";

// 25 products × 25 collections keeps each query well under Shopify's cost limit.
const PRODUCTS_QUERY = `#graphql
  query SugarShipProducts($cursor: String) {
    products(first: 25, after: $cursor) {
      nodes {
        id
        tags
        productType
        vendor
        collections(first: 25) {
          nodes { id }
          pageInfo { hasNextPage }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`;

export const COLLECTIONS_QUERY = `#graphql
  query SugarShipProductCollections($id: ID!, $cursor: String) {
    product(id: $id) {
      collections(first: 250, after: $cursor) {
        nodes { id }
        pageInfo { hasNextPage endCursor }
      }
    }
  }`;

/** The sync's view of Shopify, backed by the Admin API. */
export function adminProductsClient(admin: AdminApiContext): ProductsClient {
  return {
    productsPage: async (cursor) =>
      readProductsPage(await adminQuery(admin, PRODUCTS_QUERY, { cursor })),
    collectionsPage: async (productId, cursor) =>
      readCollectionsPage(
        await adminQuery(admin, COLLECTIONS_QUERY, {
          id: `gid://shopify/Product/${productId}`,
          cursor,
        }),
      ),
  };
}

/**
 * Copies every product's tags, type, vendor and collections into ProductSnapshot,
 * removes products that no longer exist, and records when it finished.
 */
export async function syncProducts(
  admin: AdminApiContext,
  shopId: string,
): Promise<number> {
  const startedAt = new Date();
  const count = await syncAllProducts(adminProductsClient(admin), (products) =>
    upsertProducts(shopId, products),
  );
  // Every product still in Shopify was saved after startedAt; the rest are gone.
  await deleteStaleProducts(shopId, startedAt);
  await markProductsSynced(shopId, new Date());
  return count;
}

/** Shops with a sync running in this process, so a second trigger doesn't start another. */
const running = new Set<string>();

/**
 * Starts a sync in the background (the caller doesn't wait); errors are logged.
 * Does nothing if one is already running for this shop.
 */
export function startProductSync(admin: AdminApiContext, shopId: string): void {
  if (running.has(shopId)) return;
  running.add(shopId);
  syncProducts(admin, shopId)
    .then((count) =>
      console.log(`[sugar-ship] products synced: ${count} for shop ${shopId}`),
    )
    .catch((error) =>
      console.error(`[sugar-ship] product sync failed for ${shopId}`, error),
    )
    .finally(() => running.delete(shopId));
}
