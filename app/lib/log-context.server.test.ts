import { describe, expect, it } from "vitest";
import {
  getLogContext,
  requestIdFor,
  withLogContext,
} from "./log-context.server";

const request = (headers: Record<string, string> = {}) =>
  new Request("https://app.test/api/rates", { headers });

describe("requestIdFor", () => {
  it("uses Shopify's webhook id, then the request id, then a new one", () => {
    expect(
      requestIdFor(
        request({ "x-shopify-webhook-id": "wh-1", "x-request-id": "r-1" }),
      ),
    ).toBe("wh-1");
    expect(requestIdFor(request({ "x-request-id": "r-1" }))).toBe("r-1");
    expect(requestIdFor(request())).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("withLogContext", () => {
  it("gives the handler, and work it awaits, the request's id and shop", async () => {
    const seen = await withLogContext(
      request({
        "x-request-id": "r-1",
        "x-shopify-shop-domain": "mega-bundle.myshopify.com",
      }),
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return getLogContext();
      },
    );
    expect(seen).toEqual({ reqId: "r-1", shop: "mega-bundle.myshopify.com" });
  });

  it("has no context outside a request", () => {
    expect(getLogContext()).toBeUndefined();
  });
});
