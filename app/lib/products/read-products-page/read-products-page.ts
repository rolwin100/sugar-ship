import { gidToId, toProductSnapshot } from "../to-product-snapshot";
import type {
  CollectionsPage,
  ProductsPage,
  ShopifyProductNode,
} from "../types";

type Connection = {
  nodes?: unknown;
  pageInfo?: { hasNextPage?: unknown; endCursor?: unknown };
};

const nextCursor = (connection: Connection | undefined): string | null =>
  connection?.pageInfo?.hasNextPage === true &&
  typeof connection.pageInfo.endCursor === "string"
    ? connection.pageInfo.endCursor
    : null;

/**
 * The products query's JSON → snapshots, the next cursor, and the products whose
 * collections didn't all fit. Throws when the response has no products list, so a
 * broken response stops the sync instead of looking like an empty shop.
 */
export function readProductsPage(json: unknown): ProductsPage {
  const connection = (json as { data?: { products?: Connection } })?.data
    ?.products;
  if (!connection || !Array.isArray(connection.nodes)) {
    throw new Error("Shopify returned no products list");
  }

  const products: ProductsPage["products"] = [];
  const moreCollections: number[] = [];
  for (const node of connection.nodes as ShopifyProductNode[]) {
    const snapshot = toProductSnapshot(node ?? {});
    if (!snapshot) continue;
    products.push(snapshot);
    const collections = node.collections as Connection | undefined;
    if (collections?.pageInfo?.hasNextPage === true) {
      moreCollections.push(snapshot.productId);
    }
  }

  return { products, nextCursor: nextCursor(connection), moreCollections };
}

/** The single-product collections query's JSON → collection ids and the next cursor. */
export function readCollectionsPage(json: unknown): CollectionsPage {
  const connection = (
    json as { data?: { product?: { collections?: Connection } | null } }
  )?.data?.product?.collections;
  const nodes = Array.isArray(connection?.nodes) ? connection.nodes : [];
  return {
    collectionIds: nodes.flatMap((n: { id?: unknown } | null) => {
      const id = gidToId(n?.id, "Collection");
      return id === null ? [] : [id];
    }),
    nextCursor: nextCursor(connection),
  };
}
