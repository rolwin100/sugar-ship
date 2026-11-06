import { describe, expect, it } from "vitest";
import {
  gidToId,
  normaliseTags,
  toProductSnapshot,
} from "./to-product-snapshot";

describe("gidToId", () => {
  it("reads Shopify ids of the right type", () => {
    expect(gidToId("gid://shopify/Product/8123456789", "Product")).toBe(
      8123456789,
    );
    expect(gidToId("gid://shopify/Collection/45", "Product")).toBeNull();
    expect(gidToId("gid://shopify/Product/abc", "Product")).toBeNull();
    expect(gidToId(123, "Product")).toBeNull();
  });
});

describe("normaliseTags", () => {
  it("trims, lowercases and drops blanks and repeats", () => {
    expect(normaliseTags([" Fragile ", "fragile", "", "Sale", 3])).toEqual([
      "fragile",
      "sale",
    ]);
    expect(normaliseTags(null)).toEqual([]);
  });
});

describe("toProductSnapshot", () => {
  it("keeps the fields conditions use", () => {
    expect(
      toProductSnapshot({
        id: "gid://shopify/Product/101",
        tags: ["Fragile", "Glass"],
        productType: " Vase ",
        vendor: "Acme",
        collections: {
          nodes: [
            { id: "gid://shopify/Collection/7" },
            { id: "gid://shopify/Collection/7" },
            { id: "bad" },
          ],
        },
      }),
    ).toEqual({
      productId: 101,
      tags: ["fragile", "glass"],
      productType: "Vase",
      vendor: "Acme",
      collectionIds: [7],
    });
  });

  it("returns null without a valid product id, and copes with missing fields", () => {
    expect(toProductSnapshot({ id: "nope" })).toBeNull();
    expect(toProductSnapshot({ id: "gid://shopify/Product/5" })).toEqual({
      productId: 5,
      tags: [],
      productType: "",
      vendor: "",
      collectionIds: [],
    });
  });
});
