import { describe, expect, it } from "vitest";
import type { EngineItem } from "../../engine";
import type { ProductSnapshotInput } from "../types";
import { attachProductData } from "./attach-product-data";

const snapshot: ProductSnapshotInput = {
  productId: 101,
  tags: ["fragile"],
  productType: "Vase",
  vendor: "Acme",
  collectionIds: [7],
};
const item = (overrides: Partial<EngineItem> = {}): EngineItem => ({
  quantity: 1,
  grams: 500,
  price: 1000,
  ...overrides,
});
const snapshots = new Map([[101, snapshot]]);

describe("attachProductData", () => {
  it("adds tags, type and collections from the snapshot", () => {
    expect(attachProductData([item({ productId: 101 })], snapshots)).toEqual([
      item({
        productId: 101,
        vendor: "Acme",
        tags: ["fragile"],
        productType: "Vase",
        collectionIds: [7],
      }),
    ]);
  });

  it("keeps the vendor Shopify sent", () => {
    const [result] = attachProductData(
      [item({ productId: 101, vendor: "Acme Glass" })],
      snapshots,
    );
    expect(result.vendor).toBe("Acme Glass");
  });

  it("leaves items without a snapshot or product id as they are", () => {
    const items = [item({ productId: 999 }), item()];
    expect(attachProductData(items, snapshots)).toEqual(items);
  });
});
