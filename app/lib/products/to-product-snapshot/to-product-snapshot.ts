import type { ProductSnapshotInput, ShopifyProductNode } from "../types";

/** "gid://shopify/Product/123" → 123 for the given type; null for anything else. */
export function gidToId(gid: unknown, type: string): number | null {
  if (typeof gid !== "string") return null;
  const match = /^gid:\/\/shopify\/([A-Za-z]+)\/(\d+)$/.exec(gid);
  if (!match || match[1] !== type) return null;
  const id = Number(match[2]);
  return Number.isSafeInteger(id) ? id : null;
}

/** Tags as conditions compare them: trimmed, lowercased, no blanks or repeats. */
export function normaliseTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const clean = tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(clean)];
}

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

/**
 * A product from Shopify's API → the fields we keep, or null when it has no valid id.
 * Collections we can't read are skipped rather than failing the whole product.
 */
export function toProductSnapshot(
  node: ShopifyProductNode,
): ProductSnapshotInput | null {
  const productId = gidToId(node.id, "Product");
  if (productId === null) return null;

  const collections = (node.collections as { nodes?: unknown } | null)?.nodes;
  const collectionIds = Array.isArray(collections)
    ? collections.flatMap((c: { id?: unknown } | null) => {
        const id = gidToId(c?.id, "Collection");
        return id === null ? [] : [id];
      })
    : [];

  return {
    productId,
    tags: normaliseTags(node.tags),
    productType: text(node.productType),
    vendor: text(node.vendor),
    collectionIds: [...new Set(collectionIds)],
  };
}
