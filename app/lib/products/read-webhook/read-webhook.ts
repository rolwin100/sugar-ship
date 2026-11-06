import { gidToId } from "../to-product-snapshot";

/**
 * The product or collection id from a webhook body: `id` (a number) or, failing
 * that, `admin_graphql_api_id`. Null when neither is usable.
 */
export function readWebhookId(
  payload: unknown,
  type: "Product" | "Collection",
): number | null {
  if (!payload || typeof payload !== "object") return null;
  const { id, admin_graphql_api_id: gid } = payload as Record<string, unknown>;
  if (typeof id === "number" && Number.isSafeInteger(id) && id > 0) return id;
  return gidToId(gid, type);
}
