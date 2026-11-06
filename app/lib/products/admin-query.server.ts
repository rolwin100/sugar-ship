import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

const RETRIES = 3;

const isThrottled = (error: unknown) =>
  /throttl/i.test(
    error instanceof Error ? `${error.message} ${JSON.stringify(error)}` : "",
  );

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs an Admin API query, waiting and retrying when Shopify says to slow down. */
export async function adminQuery(
  admin: AdminApiContext,
  text: string,
  variables: Record<string, unknown>,
): Promise<unknown> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await admin.graphql(text, { variables });
      return await response.json();
    } catch (error) {
      if (!isThrottled(error) || attempt >= RETRIES) throw error;
      await wait(1000 * attempt);
    }
  }
}
