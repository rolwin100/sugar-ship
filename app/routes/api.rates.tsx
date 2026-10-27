import type { ActionFunctionArgs } from "react-router";
import type { RateRequest, ShippingRate } from "../lib/types";
import {
  fallbackRates,
  isTestCheckout,
  isValidHmac,
  quoteRates,
} from "../lib/rates/rates.server";
import { getShopForRates } from "../lib/shop.server";

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

  let rates: ShippingRate[] = [];
  try {
    rates = quoteRates(payload);
  } catch (error) {
    console.error(`[sugar-ship] rates: quoting failed for ${shop}`, error);
  }

  // Fallback when quoting failed or returned nothing. Test mode still applies.
  if (rates.length === 0 && shop && isTestCheckout(destination)) {
    try {
      const shopRecord = await getShopForRates(shop);
      rates = fallbackRates(
        shopRecord?.settings,
        shopRecord?.currency,
        currency,
        payload.rate?.locale,
      );
      if (rates.length > 0) {
        console.log(`[sugar-ship] rates: returned fallback for ${shop}`);
      }
    } catch (error) {
      console.error(`[sugar-ship] rates: fallback lookup failed for ${shop}`, error);
    }
  }

  return Response.json({ rates });
};
