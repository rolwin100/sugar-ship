import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

/** Fields every log line gets while a request is being handled. */
export type LogContext = { reqId: string; shop?: string };

const storage = new AsyncLocalStorage<LogContext>();

/** The current request's log fields, or undefined outside a request. */
export function getLogContext(): LogContext | undefined {
  return storage.getStore();
}

/**
 * The id to tag a request's log lines with: Shopify's own id when it sends one (the
 * webhook id, or the request id), so lines match what Shopify sees; otherwise a new one.
 */
export function requestIdFor(request: Request): string {
  return (
    request.headers.get("x-shopify-webhook-id") ??
    request.headers.get("x-request-id") ??
    randomUUID()
  );
}

/**
 * Runs a request handler so that every log line written during it, including from
 * work it starts in the background, carries the same `reqId` (and the shop, when
 * Shopify says which). Wrap a route's loader or action with it.
 */
export function withLogContext<T>(
  request: Request,
  handler: () => Promise<T>,
): Promise<T> {
  const shop = request.headers.get("x-shopify-shop-domain") ?? undefined;
  return storage.run({ reqId: requestIdFor(request), shop }, handler);
}
