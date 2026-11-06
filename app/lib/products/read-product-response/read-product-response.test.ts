import { describe, expect, it } from "vitest";
import {
  readCollectionProductsPage,
  readProductResponse,
} from "./read-product-response";

describe("readProductResponse", () => {
  it("reads the product and whether it has more collections", () => {
    expect(
      readProductResponse({
        data: {
          product: {
            id: "gid://shopify/Product/5",
            tags: ["Fragile"],
            productType: "Vase",
            vendor: "Acme",
            collections: {
              nodes: [{ id: "gid://shopify/Collection/9" }],
              pageInfo: { hasNextPage: true },
            },
          },
        },
      }),
    ).toEqual({
      product: {
        productId: 5,
        tags: ["fragile"],
        productType: "Vase",
        vendor: "Acme",
        collectionIds: [9],
      },
      moreCollections: true,
    });
  });

  it("returns null when the product is gone, and throws when the call failed", () => {
    expect(readProductResponse({ data: { product: null } })).toBeNull();
    expect(() => readProductResponse({ errors: [{}] })).toThrow();
  });
});

describe("readCollectionProductsPage", () => {
  it("reads product ids and the next cursor", () => {
    expect(
      readCollectionProductsPage({
        data: {
          collection: {
            products: {
              nodes: [{ id: "gid://shopify/Product/1" }, { id: "bad" }],
              pageInfo: { hasNextPage: true, endCursor: "p2" },
            },
          },
        },
      }),
    ).toEqual({ productIds: [1], nextCursor: "p2" });
  });

  it("returns null when the collection is gone, and throws when the call failed", () => {
    expect(
      readCollectionProductsPage({ data: { collection: null } }),
    ).toBeNull();
    expect(() => readCollectionProductsPage({})).toThrow();
  });
});
