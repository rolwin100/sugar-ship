import type { ProductsClient, ProductSnapshotInput } from "../types";

/** Shopify can't return more than this many pages for one product's collections in practice. */
const MAX_COLLECTION_PAGES = 20;

/**
 * Walks every product page and saves each page as it goes, first completing the
 * collections of the rare products in more collections than one page holds.
 * Returns how many products were saved.
 */
export async function syncAllProducts(
  client: ProductsClient,
  save: (products: ProductSnapshotInput[]) => Promise<void>,
): Promise<number> {
  let cursor: string | null = null;
  let saved = 0;

  do {
    const page = await client.productsPage(cursor);
    const products = await Promise.all(
      page.products.map(async (product) =>
        page.moreCollections.includes(product.productId)
          ? { ...product, collectionIds: await allCollections(client, product) }
          : product,
      ),
    );
    await save(products);
    saved += products.length;
    cursor = page.nextCursor;
  } while (cursor !== null);

  return saved;
}

/** Every collection a product is in, fetched page by page after the first ones we have. */
async function allCollections(
  client: ProductsClient,
  product: ProductSnapshotInput,
): Promise<number[]> {
  const ids = new Set(product.collectionIds);
  let cursor: string | null = null;
  for (let i = 0; i < MAX_COLLECTION_PAGES; i++) {
    const page = await client.collectionsPage(product.productId, cursor);
    page.collectionIds.forEach((id) => ids.add(id));
    cursor = page.nextCursor;
    if (cursor === null) break;
  }
  return [...ids];
}
