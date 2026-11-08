import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { logger } from "../logger.server";
import { adminQuery } from "./admin-query.server";
import { gidToId } from "./to-product-snapshot";

const COLLECTION_TITLES_QUERY = `#graphql
  query SugarShipCollectionTitles($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Collection { id title }
    }
  }`;

/**
 * Titles for these collection ids, so rate conditions can show "Shoes" instead of a
 * number. Deleted collections are left out; a failed call returns what we have (none).
 */
export async function fetchCollectionTitles(
  admin: AdminApiContext,
  ids: number[],
): Promise<Record<number, string>> {
  if (ids.length === 0) return {};
  try {
    const json = (await adminQuery(admin, COLLECTION_TITLES_QUERY, {
      ids: ids.map((id) => `gid://shopify/Collection/${id}`),
    })) as { data?: { nodes?: ({ id?: unknown; title?: unknown } | null)[] } };
    const titles: Record<number, string> = {};
    for (const node of json.data?.nodes ?? []) {
      const id = gidToId(node?.id, "Collection");
      if (id !== null && typeof node?.title === "string")
        titles[id] = node.title;
    }
    return titles;
  } catch (error) {
    logger.error(
      { err: error, module: "products" },
      "collection titles failed",
    );
    return {};
  }
}
