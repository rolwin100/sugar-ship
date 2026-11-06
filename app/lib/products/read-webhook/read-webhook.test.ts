import { describe, expect, it } from "vitest";
import { readWebhookId } from "./read-webhook";

describe("readWebhookId", () => {
  it("reads the numeric id, falling back to the GraphQL id", () => {
    expect(readWebhookId({ id: 788032119674292900 }, "Product")).toBeNull(); // unsafe
    expect(readWebhookId({ id: 101 }, "Product")).toBe(101);
    expect(
      readWebhookId(
        { admin_graphql_api_id: "gid://shopify/Collection/7" },
        "Collection",
      ),
    ).toBe(7);
  });

  it("ignores payloads without a usable id", () => {
    expect(readWebhookId(null, "Product")).toBeNull();
    expect(readWebhookId({ id: "101" }, "Product")).toBeNull();
    expect(
      readWebhookId(
        { admin_graphql_api_id: "gid://shopify/Product/1" },
        "Collection",
      ),
    ).toBeNull();
  });
});
