import { describe, expect, it } from "vitest";
import { readCollectionsPage, readProductsPage } from "./read-products-page";

const product = (id: number, collections: number[], more = false) => ({
  id: `gid://shopify/Product/${id}`,
  tags: ["Sale"],
  productType: "Shoes",
  vendor: "Acme",
  collections: {
    nodes: collections.map((c) => ({ id: `gid://shopify/Collection/${c}` })),
    pageInfo: { hasNextPage: more },
  },
});

describe("readProductsPage", () => {
  it("reads snapshots, the next cursor and products with more collections", () => {
    const page = readProductsPage({
      data: {
        products: {
          nodes: [product(1, [10]), product(2, [10, 11], true), { id: "bad" }],
          pageInfo: { hasNextPage: true, endCursor: "abc" },
        },
      },
    });
    expect(page.products.map((p) => p.productId)).toEqual([1, 2]);
    expect(page.products[0]).toEqual({
      productId: 1,
      tags: ["sale"],
      productType: "Shoes",
      vendor: "Acme",
      collectionIds: [10],
    });
    expect(page.nextCursor).toBe("abc");
    expect(page.moreCollections).toEqual([2]);
  });

  it("has no next cursor on the last page", () => {
    const page = readProductsPage({
      data: { products: { nodes: [], pageInfo: { hasNextPage: false } } },
    });
    expect(page).toEqual({
      products: [],
      nextCursor: null,
      moreCollections: [],
    });
  });

  it("throws on a response without products, instead of syncing nothing", () => {
    expect(() => readProductsPage({ errors: [{ message: "x" }] })).toThrow();
  });
});

describe("readCollectionsPage", () => {
  it("reads collection ids and the next cursor", () => {
    expect(
      readCollectionsPage({
        data: {
          product: {
            collections: {
              nodes: [{ id: "gid://shopify/Collection/7" }, { id: "bad" }],
              pageInfo: { hasNextPage: true, endCursor: "c2" },
            },
          },
        },
      }),
    ).toEqual({ collectionIds: [7], nextCursor: "c2" });
    expect(readCollectionsPage({ data: { product: null } })).toEqual({
      collectionIds: [],
      nextCursor: null,
    });
  });
});
