import { describe, expect, it } from "vitest";
import type {
  ProductsClient,
  ProductSnapshotInput,
  ProductsPage,
} from "../types";
import { syncAllProducts } from "./sync-all-products";

const snapshot = (
  productId: number,
  collectionIds: number[] = [],
): ProductSnapshotInput => ({
  productId,
  tags: [],
  productType: "",
  vendor: "",
  collectionIds,
});

describe("syncAllProducts", () => {
  it("saves every page and completes products in many collections", async () => {
    const pages: Record<string, ProductsPage> = {
      first: {
        products: [snapshot(1), snapshot(2, [10])],
        nextCursor: "p2",
        moreCollections: [2],
      },
      p2: { products: [snapshot(3)], nextCursor: null, moreCollections: [] },
    };
    const client: ProductsClient = {
      productsPage: async (cursor) => pages[cursor ?? "first"],
      collectionsPage: async (_productId, cursor) =>
        cursor === null
          ? { collectionIds: [10, 11], nextCursor: "c2" }
          : { collectionIds: [12], nextCursor: null },
    };

    const saved: ProductSnapshotInput[][] = [];
    const count = await syncAllProducts(client, async (products) => {
      saved.push(products);
    });

    expect(count).toBe(3);
    expect(saved.map((page) => page.map((p) => p.productId))).toEqual([
      [1, 2],
      [3],
    ]);
    expect(saved[0][1].collectionIds).toEqual([10, 11, 12]);
  });

  it("stops when Shopify fails, so a half sync is never marked complete", async () => {
    const client: ProductsClient = {
      productsPage: async () => {
        throw new Error("Throttled");
      },
      collectionsPage: async () => ({ collectionIds: [], nextCursor: null }),
    };
    await expect(syncAllProducts(client, async () => {})).rejects.toThrow(
      "Throttled",
    );
  });
});
