import type { EngineItem } from "../../engine";
import type { ProductSnapshotInput } from "../types";

/**
 * Adds each item's tags, product type and collections from our ProductSnapshot copy,
 * so product conditions can check them. Vendor comes with Shopify's request; the
 * snapshot's is only used when the request has none. Items we have no snapshot for
 * (or no product id) get nothing, which conditions treat as "no tags, no collections".
 */
export function attachProductData(
  items: EngineItem[],
  snapshots: Map<number, ProductSnapshotInput>,
): EngineItem[] {
  return items.map((item) => {
    const snapshot =
      item.productId != null ? snapshots.get(item.productId) : undefined;
    if (!snapshot) return item;
    return {
      ...item,
      vendor: item.vendor || snapshot.vendor || null,
      tags: snapshot.tags,
      productType: snapshot.productType,
      collectionIds: snapshot.collectionIds,
    };
  });
}
