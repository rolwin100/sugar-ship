import { gidToId, toProductSnapshot } from "../to-product-snapshot";
import type { ProductSnapshotInput, ShopifyProductNode } from "../types";

type Connection = {
  nodes?: unknown;
  pageInfo?: { hasNextPage?: unknown; endCursor?: unknown };
};

/**
 * A single-product query's JSON → its snapshot and whether it has more collections
 * than were fetched, or null when Shopify says the product doesn't exist (deleted).
 * Throws on a response without `data`, so a failed call isn't mistaken for a deletion.
 */
export function readProductResponse(
  json: unknown,
): { product: ProductSnapshotInput; moreCollections: boolean } | null {
  const data = (json as { data?: { product?: ShopifyProductNode | null } })
    ?.data;
  if (!data) throw new Error("Shopify returned no data for the product");
  if (!data.product) return null;

  const product = toProductSnapshot(data.product);
  if (!product) return null;
  const collections = data.product.collections as Connection | undefined;
  return {
    product,
    moreCollections: collections?.pageInfo?.hasNextPage === true,
  };
}

/**
 * A collection's products page → product ids and the next cursor, or null when the
 * collection doesn't exist (deleted). Throws on a response without `data`.
 */
export function readCollectionProductsPage(
  json: unknown,
): { productIds: number[]; nextCursor: string | null } | null {
  const data = (
    json as { data?: { collection?: { products?: Connection } | null } }
  )?.data;
  if (!data) throw new Error("Shopify returned no data for the collection");
  if (!data.collection) return null;

  const connection = data.collection.products;
  const nodes = Array.isArray(connection?.nodes) ? connection.nodes : [];
  return {
    productIds: nodes.flatMap((n: { id?: unknown } | null) => {
      const id = gidToId(n?.id, "Product");
      return id === null ? [] : [id];
    }),
    nextCursor:
      connection?.pageInfo?.hasNextPage === true &&
      typeof connection.pageInfo.endCursor === "string"
        ? connection.pageInfo.endCursor
        : null,
  };
}
