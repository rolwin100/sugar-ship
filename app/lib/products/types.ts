/**
 * The product fields checkout needs but Shopify doesn't send in the rate request.
 * Ids are Shopify's numeric ids (they fit in a JS number); tags are lowercased and
 * trimmed so conditions can match them without caring about case.
 */
export type ProductSnapshotInput = {
  productId: number;
  tags: string[];
  productType: string;
  vendor: string;
  collectionIds: number[];
};

/** A product from the Admin GraphQL API, as the sync and webhooks fetch it. */
export type ShopifyProductNode = {
  id?: unknown; // "gid://shopify/Product/123"
  tags?: unknown; // string[]
  productType?: unknown;
  vendor?: unknown;
  collections?: unknown; // { nodes: [{ id: "gid://shopify/Collection/45" }] }
};
