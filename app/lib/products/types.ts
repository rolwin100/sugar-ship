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

/** One page of products from Shopify, ready to save. */
export type ProductsPage = {
  products: ProductSnapshotInput[];
  nextCursor: string | null; // null on the last page
  /** Products in more collections than the page query fetched; their rest is fetched one by one. */
  moreCollections: number[];
};

/** One page of a single product's collections. */
export type CollectionsPage = {
  collectionIds: number[];
  nextCursor: string | null;
};

/**
 * What the sync needs from Shopify, so it can run against the real Admin API or a
 * test double: one page of products, one page of a product's collections.
 */
export type ProductsClient = {
  productsPage: (cursor: string | null) => Promise<ProductsPage>;
  collectionsPage: (
    productId: number,
    cursor: string | null,
  ) => Promise<CollectionsPage>;
};
