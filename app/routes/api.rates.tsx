import type { ActionFunctionArgs } from "react-router";
import type { RateRequest } from "../lib/types";
import { isValidHmac, quoteRates } from "../lib/rates/rates.server";

/**
 * Carrier Service callback. Shopify POSTs { rate: { origin, destination, items, currency, locale } }
 * at checkout and shows whatever rates we return.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const shop = request.headers.get("x-shopify-shop-domain");

  if (!hmacHeader || !isValidHmac(rawBody, hmacHeader)) {
    console.warn(
      `[sugar-ship] rates: missing or bad HMAC from ${shop ?? "unknown shop"}`,
    );
    return Response.json({ rates: [] }, { status: 401 });
  }

  let payload: RateRequest;
  try {
    payload = JSON.parse(rawBody) as RateRequest;
  } catch {
    return Response.json({ rates: [] }, { status: 400 });
  }

  const destination = payload.rate?.destination;
  const currency = payload.rate?.currency ?? "USD";

  console.log(
    `[sugar-ship] rates: shop=${shop} name=${destination?.name ?? "null"} currency=${currency}`,
  );

  return Response.json({ rates: quoteRates(payload) });
};
