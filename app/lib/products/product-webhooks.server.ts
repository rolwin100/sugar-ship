import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { adminQuery } from "./admin-query.server";
import {
  deleteProduct,
  setCollectionMembers,
  upsertProducts,
} from "./product-store.server";
import { adminProductsClient } from "./product-sync.server";
import {
  readCollectionProductsPage,
  readProductResponse,
} from "./read-product-response";
import { allCollections } from "./sync-all-products";

// Webhooks only say *what* changed; we fetch its current state from Shopify, so a late
// or out-of-order webhook still writes the latest data.

const PRODUCT_QUERY = `#graphql
  query SugarShipProduct($id: ID!) {
    product(id: $id) {
      id
      tags
      productType
      vendor
      collections(first: 250) {
        nodes { id }
        pageInfo { hasNextPage }
      }
    }
  }`;

const COLLECTION_PRODUCTS_QUERY = `#graphql
  query SugarShipCollectionProducts($id: ID!, $cursor: String) {
    collection(id: $id) {
      products(first: 250, after: $cursor) {
        nodes { id }
        pageInfo { hasNextPage endCursor }
      }
    }
  }`;

/** A big collection is read in pages of 250; this caps it at 50,000 products. */
const MAX_COLLECTION_PAGES = 200;

/** Saves a product's current tags, type, vendor and collections, or removes it if it's gone. */
export async function refreshProduct(
  admin: AdminApiContext,
  shopId: string,
  productId: number,
): Promise<void> {
  const result = readProductResponse(
    await adminQuery(admin, PRODUCT_QUERY, {
      id: `gid://shopify/Product/${productId}`,
    }),
  );
  if (!result) {
    await deleteProduct(shopId, productId);
    return;
  }

  const product = result.moreCollections
    ? {
        ...result.product,
        collectionIds: await allCollections(
          adminProductsClient(admin),
          result.product,
        ),
      }
    : result.product;
  await upsertProducts(shopId, [product]);
}

/** Makes our snapshots match a collection's current products (none if it's gone). */
export async function refreshCollection(
  admin: AdminApiContext,
  shopId: string,
  collectionId: number,
): Promise<void> {
  const productIds: number[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < MAX_COLLECTION_PAGES; i++) {
    const page = readCollectionProductsPage(
      await adminQuery(admin, COLLECTION_PRODUCTS_QUERY, {
        id: `gid://shopify/Collection/${collectionId}`,
        cursor,
      }),
    );
    if (!page) break; // deleted: no members
    productIds.push(...page.productIds);
    cursor = page.nextCursor;
    if (cursor === null) break;
  }
  await setCollectionMembers(shopId, collectionId, productIds);
}

/** Takes a deleted collection off every product. */
export async function removeCollection(
  shopId: string,
  collectionId: number,
): Promise<void> {
  await setCollectionMembers(shopId, collectionId, []);
}
